from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.disease import (
    DiseaseDiagnosisResponse,
    DiseaseDetectionItem,
    PaginatedDiseaseDetectionResponse,
)
from app.services import disease_service

router = APIRouter(tags=["Crop Disease Detection"])

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post(
    "/api/disease/detect",
    response_model=DiseaseDiagnosisResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Diagnose crop disease from leaf image upload and record advisory",
)
async def detect_crop_disease_endpoint(
    crop: str = Form(..., description="Crop type: tomato, wheat, or rice"),
    file: UploadFile = File(..., description="Uploaded leaf photograph (JPEG, PNG, or WEBP)"),
    farm_id: Optional[int] = Form(None, description="Optional associated farm ID"),
    farmer_id: Optional[int] = Form(None, description="Optional farmer/user ID for ownership verification"),
    db: Session = Depends(get_db),
):
    """Classify crop leaf disease using trained computer vision models and generate advisory.

    - Validates crop type (tomato, wheat, or rice).
    - Validates uploaded image format and integrity.
    - Evaluates prediction using the crop's deep learning model without duplicate MobileNetV2 normalization.
    - Matches exact predicted class against the local crop treatment guide or returns a safe agronomic fallback.
    - Persists diagnosis record in the `disease_detections` table following farm ownership rules.
    """
    clean_crop = crop.strip().lower()
    if clean_crop not in disease_service.SUPPORTED_CROPS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported crop '{crop}'. Supported crops: {list(disease_service.SUPPORTED_CROPS.keys())}",
        )

    # Basic filename validation
    filename = file.filename or "uploaded_leaf.jpg"
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext and ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension '{ext}'. Allowed image formats: {list(ALLOWED_IMAGE_EXTENSIONS)}",
        )

    # Read image bytes
    try:
        image_bytes = await file.read()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed reading uploaded image file: {exc}",
        )

    if not image_bytes or len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty. Please provide a valid leaf image.",
        )

    if len(image_bytes) > MAX_IMAGE_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image file exceeds the maximum allowed size of {MAX_IMAGE_FILE_SIZE // (1024 * 1024)} MB.",
        )

    # Delegate diagnosis & database persistence to disease service
    return disease_service.diagnose_and_record_disease(
        db=db,
        crop=clean_crop,
        image_bytes=image_bytes,
        filename=filename,
        farm_id=farm_id,
        farmer_id=farmer_id,
    )


# Alias endpoint matching common naming conventions
@router.post(
    "/api/disease/diagnose",
    response_model=DiseaseDiagnosisResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
async def diagnose_crop_disease_alias_endpoint(
    crop: str = Form(..., description="Crop type: tomato, wheat, or rice"),
    file: UploadFile = File(..., description="Uploaded leaf photograph"),
    farm_id: Optional[int] = Form(None),
    farmer_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
):
    return await detect_crop_disease_endpoint(
        crop=crop,
        file=file,
        farm_id=farm_id,
        farmer_id=farmer_id,
        db=db,
    )


@router.get(
    "/api/disease/detections",
    response_model=PaginatedDiseaseDetectionResponse,
    summary="Retrieve historical crop disease detections with pagination",
)
def list_disease_detections_endpoint(
    farm_id: Optional[int] = Query(None, description="Filter by farm ID"),
    needs_expert_review: Optional[bool] = Query(None, description="Filter by expert review requirement"),
    page: int = Query(1, ge=1, description="Page number, 1-indexed"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    db: Session = Depends(get_db),
):
    """List historical disease detections and diagnoses."""
    return disease_service.list_disease_detections(
        db=db,
        farm_id=farm_id,
        needs_expert_review=needs_expert_review,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/api/disease/detections/{detection_id}",
    response_model=DiseaseDetectionItem,
    summary="Retrieve a single crop disease detection record by ID",
)
def get_disease_detection_endpoint(
    detection_id: int,
    db: Session = Depends(get_db),
):
    """Retrieve details of a single historical disease diagnosis."""
    return disease_service.get_disease_detection(db=db, detection_id=detection_id)


@router.get(
    "/api/disease/assets/status",
    summary="Inspect presence and readiness of crop disease ML models and metadata",
)
def check_ml_assets_status_endpoint():
    """Inspect and report the status of model files, class mappings, and treatment guides."""
    return disease_service.validate_ml_assets()
