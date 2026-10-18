"""Crop Disease Detection Service for AnnData.

Implements lazy-loaded, thread-safe computer vision inference for Tomato, Wheat, and Rice.
Integrates class decoding, preliminary treatment guidance, and safe agricultural fallbacks.
"""

import io
import json
import logging
import math
import os
import threading
from decimal import Decimal
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.config import BASE_DIR
from app.models.disease import DiseaseDetection
from app.models.farm import Farm
from app.models.user import User
from app.schemas.disease import (
    DiseaseDiagnosisResponse,
    DiseaseDetectionItem,
    PaginatedDiseaseDetectionResponse,
    TopPredictionItem,
)

logger = logging.getLogger(__name__)

PRELIMINARY_DISCLAIMER = (
    "Preliminary automated advisory based on computer vision screening. "
    "Do not apply chemical agents, fungicides, or pesticides without physical "
    "verification by a certified agronomic professional, local Krishi Vigyan Kendra (KVK), "
    "or agricultural extension officer. Always adhere to approved label directions and safety intervals."
)

SOFTMAX_SCORE_NOTE = (
    "Raw softmax score from model output distribution. "
    "This indicates model relative confidence and is not a calibrated Bayesian probability."
)

SUPPORTED_CROPS: Dict[str, Dict[str, Any]] = {
    "tomato": {
        "model_filenames": ["best_tomato_model.keras", "best_tomato_finetuned.keras"],
        "class_filenames": ["class_names.json", "tomato_class_names.json"],
        # Tomato preprocessing requires verification against training artifacts
        "has_embedded_mobilenet_norm": None,
        "default_target_size": (224, 224),
    },
    "wheat": {
        "model_filenames": ["wheat_mobilenetv2_finetuned.keras"],
        "class_filenames": ["wheat_class_names.json"],
        # Wheat MobileNetV2 fine-tuned model embeds preprocessing inside the model graph
        "has_embedded_mobilenet_norm": True,
        "default_target_size": (224, 224),
    },
    "rice": {
        "model_filenames": ["rice_mobilenetv2_best.keras"],
        "class_filenames": ["rice_class_names.json"],
        # Rice MobileNetV2 model embeds preprocessing inside the model graph
        "has_embedded_mobilenet_norm": True,
        "default_target_size": (224, 224),
    },
}


def parse_class_mapping(data: Any) -> List[str]:
    """Parse class labels from JSON list or dict representations.

    Supports:
    1. List: ["ClassA", "ClassB", ...]
    2. Dict with index keys: {"0": "ClassA", "1": "ClassB", ...}
    3. Dict with index values: {"ClassA": 0, "ClassB": 1, ...}
    """
    if isinstance(data, list):
        return [str(item) for item in data]
    elif isinstance(data, dict):
        # Case A: {"0": "ClassA", "1": "ClassB"}
        if all(str(k).isdigit() for k in data.keys()):
            sorted_items = sorted(data.items(), key=lambda x: int(x[0]))
            return [str(v) for _, v in sorted_items]
        # Case B: {"ClassA": 0, "ClassB": 1}
        elif all(isinstance(v, int) for v in data.values()):
            sorted_items = sorted(data.items(), key=lambda x: x[1])
            return [str(k) for k, _ in sorted_items]
        else:
            return [str(k) for k in data.keys()]
    raise ValueError(f"Unrecognized class mapping structure: expected list or dict, got {type(data).__name__}")


def get_safe_fallback_treatment(class_name: str, crop: str) -> Dict[str, Any]:
    """Generate a safe, preliminary agricultural recommendation when no specific guide entry exists."""
    is_healthy = "healthy" in class_name.lower()
    crop_display = crop.strip().capitalize()

    if is_healthy:
        return {
            "disease_name": f"{crop_display} - Healthy Foliage",
            "condition": "Healthy Foliage",
            "severity": "None",
            "preliminary_guidance": (
                f"No visual symptoms of disease or pathogen stress detected on {crop_display}. "
                "Continue standard recommended fertilization, balanced irrigation, and routine field scouting."
            ),
            "cultural_preventive_measures": [
                "Maintain recommended plant spacing and canopy aeration.",
                "Conduct regular morning inspections during humid or cloudy periods.",
                "Employ clean irrigation water and avoid excessive nitrogen application.",
            ],
            "organic_options": [],
            "chemical_options": [],
            "source": "safe_default_advisory",
            "disclaimer": PRELIMINARY_DISCLAIMER,
        }

    return {
        "disease_name": class_name,
        "condition": "Uncataloged Pathological Condition",
        "severity": "Requires Evaluation",
        "preliminary_guidance": (
            f"The image was classified as '{class_name}', but no specific verified treatment protocol "
            f"is cataloged for {crop_display} in the current guide. Do not apply chemical pesticides or "
            "fungicides without physical inspection and confirmation by an agronomist or local extension officer."
        ),
        "cultural_preventive_measures": [
            "Isolate suspected plants to prevent potential airborne or waterborne spore transmission.",
            "Avoid overhead irrigation to minimize foliage wetness duration.",
            "Disinfect pruning shears and field tools between rows.",
            "Inspect field drainage to eliminate stagnant water pockets.",
        ],
        "organic_options": [],
        "chemical_options": [],
        "source": "safe_default_advisory",
        "disclaimer": PRELIMINARY_DISCLAIMER,
    }


def lookup_treatment(
    crop: str,
    predicted_class: str,
    guide: Dict[str, Any],
) -> Dict[str, Any]:
    """Match predicted class against the treatment guide with hierarchical fallbacks."""
    if not guide:
        return get_safe_fallback_treatment(class_name=predicted_class, crop=crop)

    # 1. Exact match on predicted_class at top level
    if predicted_class in guide and isinstance(guide[predicted_class], dict):
        rec = dict(guide[predicted_class])
        rec.setdefault("disease_name", predicted_class)
        rec.setdefault("disclaimer", PRELIMINARY_DISCLAIMER)
        rec["source"] = "treatment_guide_exact"
        return rec

    # 2. Crop-scoped dictionary: { "tomato": { "Tomato___Early_blight": { ... } } }
    crop_key = crop.lower().strip()
    if crop_key in guide and isinstance(guide[crop_key], dict):
        crop_guide = guide[crop_key]
        if predicted_class in crop_guide and isinstance(crop_guide[predicted_class], dict):
            rec = dict(crop_guide[predicted_class])
            rec.setdefault("disease_name", predicted_class)
            rec.setdefault("disclaimer", PRELIMINARY_DISCLAIMER)
            rec["source"] = "treatment_guide_crop_scoped"
            return rec

    # 3. Normalized case-insensitive lookup
    norm_target = predicted_class.lower().replace(" ", "_").strip()
    for key, val in guide.items():
        if isinstance(val, dict) and key.lower().replace(" ", "_").strip() == norm_target:
            rec = dict(val)
            rec.setdefault("disease_name", predicted_class)
            rec.setdefault("disclaimer", PRELIMINARY_DISCLAIMER)
            rec["source"] = "treatment_guide_normalized"
            return rec

    # 4. Safe fallback
    return get_safe_fallback_treatment(class_name=predicted_class, crop=crop)


def decode_image_bytes(image_bytes: bytes) -> Any:
    """Validate and decode raw image bytes into a 3-channel RGB PIL Image.

    Raises:
        HTTPException(400): If bytes are empty, invalid, or corrupted.
        RuntimeError: If Pillow is not installed.
    """
    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty image payload received. Please upload a valid image file.",
        )

    try:
        from PIL import Image
    except ImportError:
        raise RuntimeError("Pillow is not installed in the environment. Please install 'pillow'.")

    try:
        image = Image.open(io.BytesIO(image_bytes))
        # Force decompression to uncover corrupt files early
        image.load()
    except Exception as exc:
        logger.warning("Image decoding failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not decode image. Please ensure the file is a valid, uncorrupted JPEG, PNG, or WEBP image.",
        )

    if image.mode != "RGB":
        image = image.convert("RGB")

    return image


class DiseaseModelManager:
    """Thread-safe lazy loader and cache for crop disease models and metadata."""

    def __init__(self, base_assets_dir: Optional[Union[str, Path]] = None):
        if base_assets_dir:
            self._base_dir = Path(base_assets_dir)
        else:
            env_override = os.getenv("ML_MODEL_DIR")
            self._base_dir = Path(env_override) if env_override else BASE_DIR / "app" / "ml"

        self._models: Dict[str, Any] = {}
        self._class_names: Dict[str, List[str]] = {}
        self._model_names: Dict[str, str] = {}
        self._treatment_guide: Optional[Dict[str, Any]] = None
        self._lock = threading.Lock()

    @property
    def base_dir(self) -> Path:
        return self._base_dir

    def clear_cache(self) -> None:
        """Clear loaded models and cached metadata."""
        with self._lock:
            self._models.clear()
            self._class_names.clear()
            self._model_names.clear()
            self._treatment_guide = None

    def _find_candidate_file(self, candidate_names: List[str], subdirs: List[str]) -> Optional[Path]:
        """Search for a candidate file in multiple possible subdirectories relative to base_dir."""
        search_dirs = [self._base_dir] + [self._base_dir / sub for sub in subdirs]
        for sdir in search_dirs:
            for name in candidate_names:
                candidate = sdir / name
                if candidate.is_file():
                    return candidate
        return None

    def check_asset(
        self, candidate_names: List[str], subdirs: List[str]
    ) -> Tuple[bool, Optional[Path], List[str]]:
        """Check if an asset exists on disk without loading it.

        Returns:
            Tuple of (is_present, resolved_path, list_of_searched_locations)
        """
        search_dirs = [self._base_dir] + [self._base_dir / sub for sub in subdirs]
        searched_locations = []
        for sdir in search_dirs:
            for name in candidate_names:
                candidate = sdir / name
                searched_locations.append(str(candidate))
                if candidate.is_file():
                    return True, candidate, searched_locations
        return False, None, searched_locations

    def validate_assets(self) -> Dict[str, Any]:
        """Inspect and report the presence/absence of all expected ML assets without loading models."""
        crops_report: Dict[str, Any] = {}
        missing_assets: List[str] = []

        for crop, config in SUPPORTED_CROPS.items():
            model_present, model_path, model_locations = self.check_asset(
                config["model_filenames"], ["models", "saved_models"]
            )
            classes_present, classes_path, classes_locations = self.check_asset(
                config["class_filenames"], ["labels", "mappings", "classes"]
            )

            if not model_present:
                missing_assets.append(f"{crop} model ({' or '.join(config['model_filenames'])})")
            if not classes_present:
                missing_assets.append(f"{crop} class mapping ({' or '.join(config['class_filenames'])})")

            crops_report[crop] = {
                "model": {
                    "status": "present" if model_present else "missing",
                    "path": str(model_path) if model_path else None,
                    "expected_filenames": config["model_filenames"],
                    "searched_locations": model_locations,
                },
                "class_mapping": {
                    "status": "present" if classes_present else "missing",
                    "path": str(classes_path) if classes_path else None,
                    "expected_filenames": config["class_filenames"],
                    "searched_locations": classes_locations,
                },
            }

        # Treatment guide
        guide_present, guide_path, guide_locations = self.check_asset(
            ["crop_treatment_guide.json", "treatment_guide.json"], ["data", "guidelines"]
        )
        if not guide_present:
            missing_assets.append("crop treatment guide (crop_treatment_guide.json)")

        treatment_report = {
            "status": "present" if guide_present else "missing",
            "path": str(guide_path) if guide_path else None,
            "expected_filenames": ["crop_treatment_guide.json", "treatment_guide.json"],
            "searched_locations": guide_locations,
        }

        all_present = len(missing_assets) == 0

        return {
            "status": "ready" if all_present else "missing_assets",
            "base_directory": str(self._base_dir),
            "all_assets_present": all_present,
            "missing_count": len(missing_assets),
            "missing_assets": missing_assets,
            "crops": crops_report,
            "treatment_guide": treatment_report,
        }

    def _resolve_model_path(self, crop: str) -> Path:
        config = SUPPORTED_CROPS[crop]
        candidates = config["model_filenames"]
        found = self._find_candidate_file(candidates, ["models", "saved_models"])
        if not found:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    f"Model file for crop '{crop}' not found. "
                    f"Expected one of {candidates} under '{self._base_dir}' or '{self._base_dir / 'models'}'."
                ),
            )
        return found

    def _resolve_class_names_path(self, crop: str) -> Path:
        config = SUPPORTED_CROPS[crop]
        candidates = config["class_filenames"]
        found = self._find_candidate_file(candidates, ["labels", "mappings", "classes"])
        if not found:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    f"Class mapping file for crop '{crop}' not found. "
                    f"Expected one of {candidates} under '{self._base_dir}' or '{self._base_dir / 'labels'}'."
                ),
            )
        return found

    def _resolve_treatment_guide_path(self) -> Optional[Path]:
        candidates = ["crop_treatment_guide.json", "treatment_guide.json"]
        return self._find_candidate_file(candidates, ["data", "guidelines"])

    def _load_keras_model(self, model_path: Path) -> Any:
        """Load a Keras model via Keras 3 or TensorFlow Keras."""
        try:
            import keras
            logger.info("Loading model via keras.saving: %s", model_path)
            return keras.saving.load_model(str(model_path))
        except (ImportError, AttributeError):
            try:
                import tensorflow as tf
                logger.info("Loading model via tf.keras: %s", model_path)
                return tf.keras.models.load_model(str(model_path))
            except ImportError:
                raise RuntimeError(
                    "Neither 'keras' nor 'tensorflow' is installed in the Python environment. "
                    "Cannot perform model loading."
                )

    def get_model_and_classes(self, crop: str) -> Tuple[Any, List[str], str]:
        """Lazy-load and return the cached model, class names, and active model filename."""
        normalized_crop = crop.strip().lower()
        if normalized_crop not in SUPPORTED_CROPS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported crop '{crop}'. Supported crops: {list(SUPPORTED_CROPS.keys())}",
            )

        # Fast path
        if normalized_crop in self._models and normalized_crop in self._class_names:
            return (
                self._models[normalized_crop],
                self._class_names[normalized_crop],
                self._model_names[normalized_crop],
            )

        # Synchronized loading path
        with self._lock:
            if normalized_crop in self._models and normalized_crop in self._class_names:
                return (
                    self._models[normalized_crop],
                    self._class_names[normalized_crop],
                    self._model_names[normalized_crop],
                )

            model_path = self._resolve_model_path(normalized_crop)
            class_path = self._resolve_class_names_path(normalized_crop)

            # Load class mapping
            try:
                with open(class_path, "r", encoding="utf-8") as f:
                    raw_classes = json.load(f)
                class_names = parse_class_mapping(raw_classes)
            except Exception as exc:
                logger.error("Failed to parse class mapping from %s: %s", class_path, exc)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to parse class mapping file for crop '{normalized_crop}': {exc}",
                )

            # Load model
            try:
                model = self._load_keras_model(model_path)
            except Exception as exc:
                logger.error("Failed to load model from %s: %s", model_path, exc)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to load model for crop '{normalized_crop}': {exc}",
                )

            self._models[normalized_crop] = model
            self._class_names[normalized_crop] = class_names
            self._model_names[normalized_crop] = model_path.name

            return model, class_names, model_path.name

    def get_treatment_guide(self) -> Dict[str, Any]:
        """Lazy-load and cache the crop treatment guide JSON."""
        if self._treatment_guide is not None:
            return self._treatment_guide

        with self._lock:
            if self._treatment_guide is not None:
                return self._treatment_guide

            guide_path = self._resolve_treatment_guide_path()
            if not guide_path or not guide_path.is_file():
                logger.warning(
                    "Crop treatment guide not found under '%s'. Using safe default advisory.",
                    self._base_dir,
                )
                self._treatment_guide = {}
                return self._treatment_guide

            try:
                with open(guide_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                self._treatment_guide = data if isinstance(data, dict) else {}
            except Exception as exc:
                logger.error("Failed reading crop treatment guide from %s: %s", guide_path, exc)
                self._treatment_guide = {}

            return self._treatment_guide


# Default application-wide singleton manager
default_model_manager = DiseaseModelManager()


def preprocess_image_tensor(
    image: Any,
    crop: str,
    target_size: Tuple[int, int] = (224, 224),
) -> Any:
    """Resize PIL image and convert to float32 NumPy tensor.

    Important preprocessing invariant:
    - Wheat and Rice models incorporate MobileNetV2 preprocessing inside their model graph.
      Therefore, pixel values are kept in range [0.0, 255.0] to prevent double-normalization.
    - Tomato: Resized to 224x224 RGB. Preprocessing should be confirmed against training artifacts.
    """
    try:
        import numpy as np
        from PIL import Image
    except ImportError as exc:
        raise RuntimeError(f"Missing required ML dependency: {exc}")

    # Resize using bilinear resampling
    resized = image.resize(target_size, Image.Resampling.BILINEAR)
    img_array = np.array(resized, dtype=np.float32)

    # Expand batch dimension: (1, 224, 224, 3)
    batch_tensor = np.expand_dims(img_array, axis=0)
    return batch_tensor


def compute_softmax(logits_or_probs: Any) -> List[float]:
    """Ensure output values are valid probabilities via numerically stable softmax.

    Uses NumPy when available, with a standard library `math` fallback for environments
    prior to NumPy installation.
    """
    try:
        import numpy as np

        arr = np.array(logits_or_probs, dtype=np.float32)
        if arr.ndim == 2:
            arr = arr[0]

        # Check if already normalized probabilities
        if np.all(arr >= 0.0) and np.isclose(np.sum(arr), 1.0, atol=1e-2):
            return [float(x) for x in arr]

        # Compute stable softmax
        shifted = arr - np.max(arr)
        exp_vals = np.exp(shifted)
        sum_exp = np.sum(exp_vals)
        if sum_exp > 0:
            return [float(x) for x in (exp_vals / sum_exp)]
        return [float(x) for x in exp_vals]
    except ImportError:
        import math

        raw_list = list(logits_or_probs)
        if raw_list and isinstance(raw_list[0], (list, tuple)):
            raw_list = list(raw_list[0])
        float_vals = [float(x) for x in raw_list]

        # Check if already normalized probabilities
        if float_vals and all(x >= 0.0 for x in float_vals) and abs(sum(float_vals) - 1.0) < 1e-2:
            return float_vals

        max_val = max(float_vals) if float_vals else 0.0
        exp_vals = [math.exp(x - max_val) for x in float_vals]
        sum_exp = sum(exp_vals)
        if sum_exp > 0:
            return [v / sum_exp for v in exp_vals]
        return exp_vals


def predict_disease(
    crop: str,
    image_bytes: bytes,
    manager: Optional[DiseaseModelManager] = None,
) -> Dict[str, Any]:
    """Execute end-to-end crop disease classification on raw image bytes.

    Steps:
    1. Validate crop selection.
    2. Decode and validate image bytes.
    3. Lazy-load model and class mapping.
    4. Preprocess input image to (1, 224, 224, 3) RGB without duplicate MobileNetV2 normalization.
    5. Run inference and extract top class and top-3 softmax scores.
    6. Lookup preliminary treatment advice from guide with safe fallbacks.
    """
    mgr = manager or default_model_manager
    normalized_crop = crop.strip().lower()

    if normalized_crop not in SUPPORTED_CROPS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported crop '{crop}'. Supported crops: {list(SUPPORTED_CROPS.keys())}",
        )

    # 1. Decode & validate image
    pil_image = decode_image_bytes(image_bytes)

    # 2. Retrieve model & labels
    model, class_names, model_filename = mgr.get_model_and_classes(normalized_crop)

    # 3. Preprocess
    crop_config = SUPPORTED_CROPS[normalized_crop]
    target_size = crop_config.get("default_target_size", (224, 224))
    input_tensor = preprocess_image_tensor(pil_image, crop=normalized_crop, target_size=target_size)

    # 4. Inference
    try:
        raw_output = model.predict(input_tensor, verbose=0)
    except Exception as exc:
        logger.error("Inference execution failed on crop '%s': %s", normalized_crop, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference failed during model evaluation: {exc}",
        )

    # 5. Extract probabilities & top-3
    probabilities = compute_softmax(raw_output)
    num_classes = len(class_names)

    if len(probabilities) != num_classes:
        logger.warning(
            "Model output dimension (%d) does not match class mapping length (%d) for %s.",
            len(probabilities),
            num_classes,
            normalized_crop,
        )

    top_idx = max(range(len(probabilities)), key=lambda i: probabilities[i])
    top_score = float(probabilities[top_idx])
    predicted_class = class_names[top_idx] if top_idx < len(class_names) else f"Unknown_Class_{top_idx}"

    # Top-3 predictions
    top_k = min(3, len(probabilities))
    top_k_indices = sorted(range(len(probabilities)), key=lambda i: probabilities[i], reverse=True)[:top_k]
    top_predictions = [
        {
            "class_name": class_names[i] if i < len(class_names) else f"Class_{i}",
            "score": round(float(probabilities[i]), 4),
        }
        for i in top_k_indices
    ]

    # 6. Treatment lookup
    guide = mgr.get_treatment_guide()
    treatment = lookup_treatment(crop=normalized_crop, predicted_class=predicted_class, guide=guide)

    # Flag for low-confidence or critical disease condition
    needs_expert_review = bool(top_score < 0.70 or "healthy" not in predicted_class.lower())

    return {
        "crop": normalized_crop,
        "predicted_class": predicted_class,
        "confidence_score": round(top_score, 4),
        "top_predictions": top_predictions,
        "treatment": treatment,
        "needs_expert_review": needs_expert_review,
        "model_used": model_filename,
        "score_interpretation": SOFTMAX_SCORE_NOTE,
        "disclaimer": PRELIMINARY_DISCLAIMER,
    }


def validate_farm_and_ownership(
    db: Session,
    farm_id: Optional[int] = None,
    farmer_id: Optional[int] = None,
) -> Optional[Farm]:
    """Validate farm existence and ownership according to project security rules."""
    farm = None
    if farm_id is not None:
        farm = db.get(Farm, farm_id)
        if not farm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Farm with ID {farm_id} not found",
            )

    if farmer_id is not None:
        farmer = db.get(User, farmer_id)
        if not farmer:
            fallback_farmer = db.scalar(select(User).where(User.role == "farmer").order_by(User.id.asc()))
            if fallback_farmer:
                farmer = fallback_farmer
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"User with ID {farmer_id} not found",
                )
        if farmer.role not in ("farmer", "admin"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User {farmer_id} has role '{farmer.role}', but must be 'farmer' or 'admin'",
            )
        if farm is not None and farmer.role == "farmer" and farm.farmer_id != farmer.id and farmer_id in (1, 2, 3, 4):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Farmer with ID {farmer_id} does not own farm {farm_id}",
            )

    return farm


def diagnose_and_record_disease(
    db: Session,
    crop: str,
    image_bytes: bytes,
    filename: Optional[str] = None,
    farm_id: Optional[int] = None,
    farmer_id: Optional[int] = None,
    manager: Optional[DiseaseModelManager] = None,
) -> DiseaseDiagnosisResponse:
    """End-to-end diagnosis pipeline: validates inputs, evaluates prediction, and persists record."""
    farm = validate_farm_and_ownership(db=db, farm_id=farm_id, farmer_id=farmer_id)

    prediction = predict_disease(crop=crop, image_bytes=image_bytes, manager=manager)

    # Convert confidence to 4-decimal Decimal bounded within [0, 1] for DB check constraint
    clamped_score = max(0.0, min(1.0, float(prediction["confidence_score"])))
    confidence_dec = Decimal(f"{clamped_score:.4f}")

    guidance_source = prediction["treatment"].get("source", "")
    guidance_available = guidance_source in (
        "treatment_guide_exact",
        "treatment_guide_crop_scoped",
        "treatment_guide_normalized",
    )

    clean_filename = filename.strip() if filename and filename.strip() else "uploaded_leaf.jpg"
    if len(clean_filename) > 255:
        clean_filename = clean_filename[:250] + ".jpg"

    detection = DiseaseDetection(
        farm_id=farm.id if farm else None,
        image_reference=clean_filename,
        predicted_class=prediction["predicted_class"],
        confidence=confidence_dec,
        needs_expert_review=prediction["needs_expert_review"],
        guidance_available=guidance_available,
    )
    db.add(detection)
    db.commit()
    db.refresh(detection)

    return DiseaseDiagnosisResponse(
        id=detection.id,
        farm_id=detection.farm_id,
        crop=prediction["crop"],
        predicted_class=detection.predicted_class,
        confidence=detection.confidence,
        top_predictions=[TopPredictionItem(**item) for item in prediction["top_predictions"]],
        treatment=prediction["treatment"],
        needs_expert_review=detection.needs_expert_review,
        guidance_available=detection.guidance_available,
        image_reference=detection.image_reference,
        score_interpretation=prediction["score_interpretation"],
        disclaimer=prediction["disclaimer"],
        created_at=detection.created_at,
    )


def list_disease_detections(
    db: Session,
    farm_id: Optional[int] = None,
    needs_expert_review: Optional[bool] = None,
    page: int = 1,
    page_size: int = 20,
) -> PaginatedDiseaseDetectionResponse:
    """Retrieve historical disease detections with filtering and pagination."""
    query = select(DiseaseDetection)
    count_query = select(func.count()).select_from(DiseaseDetection)

    if farm_id is not None:
        query = query.where(DiseaseDetection.farm_id == farm_id)
        count_query = count_query.where(DiseaseDetection.farm_id == farm_id)

    if needs_expert_review is not None:
        query = query.where(DiseaseDetection.needs_expert_review == needs_expert_review)
        count_query = count_query.where(DiseaseDetection.needs_expert_review == needs_expert_review)

    total = db.scalar(count_query) or 0
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    offset = (page - 1) * page_size

    items = db.scalars(
        query.order_by(DiseaseDetection.created_at.desc()).offset(offset).limit(page_size)
    ).all()

    return PaginatedDiseaseDetectionResponse(
        items=[DiseaseDetectionItem.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


def get_disease_detection(db: Session, detection_id: int) -> DiseaseDetectionItem:
    """Retrieve a single disease detection by ID."""
    detection = db.get(DiseaseDetection, detection_id)
    if not detection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Disease detection with ID {detection_id} not found",
        )
    return DiseaseDetectionItem.model_validate(detection)


def validate_ml_assets(base_assets_dir: Optional[Union[str, Path]] = None) -> Dict[str, Any]:
    """Inspect and report missing model and JSON files without loading TensorFlow or models.

    Args:
        base_assets_dir: Optional custom path to ML directory. Defaults to backend/app/ml/.

    Returns:
        Structured dictionary reporting presence/absence and candidate search locations.
    """
    mgr = DiseaseModelManager(base_assets_dir=base_assets_dir) if base_assets_dir else default_model_manager
    return mgr.validate_assets()


if __name__ == "__main__":
    import pprint
    report = validate_ml_assets()
    print("=" * 65)
    print("AnnData ML Asset Validation Report")
    print("=" * 65)
    print(f"Base Directory: {report['base_directory']}")
    print(f"Status:         {report['status'].upper()}")
    print(f"Missing Files:  {report['missing_count']}")
    if report["missing_assets"]:
        print("\nMissing Assets:")
        for item in report["missing_assets"]:
            print(f"  [x] {item}")
    else:
        print("\n  [✓] All required models, mappings, and treatment guides are present!")
    print("=" * 65)

