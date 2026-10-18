import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock

from fastapi import HTTPException

from app.services.disease_service import (
    DiseaseModelManager,
    parse_class_mapping,
    get_safe_fallback_treatment,
    lookup_treatment,
    compute_softmax,
    predict_disease,
    SUPPORTED_CROPS,
    PRELIMINARY_DISCLAIMER,
    SOFTMAX_SCORE_NOTE,
)


class DiseaseServiceUnitTests(unittest.TestCase):
    """Unit tests for crop disease detection logic, mapping parsing, and treatment fallbacks."""

    def test_parse_class_mapping_from_list(self):
        input_data = ["Tomato___Early_blight", "Tomato___Late_blight", "Tomato___healthy"]
        result = parse_class_mapping(input_data)
        self.assertEqual(result, input_data)

    def test_parse_class_mapping_from_dict_with_str_keys(self):
        input_data = {
            "1": "Wheat_Brown_Rust",
            "0": "Wheat_Healthy",
            "2": "Wheat_Yellow_Rust",
        }
        result = parse_class_mapping(input_data)
        self.assertEqual(result, ["Wheat_Healthy", "Wheat_Brown_Rust", "Wheat_Yellow_Rust"])

    def test_parse_class_mapping_from_dict_with_int_values(self):
        input_data = {
            "Rice_Blast": 1,
            "Rice_Healthy": 0,
            "Rice_Brown_Spot": 2,
        }
        result = parse_class_mapping(input_data)
        self.assertEqual(result, ["Rice_Healthy", "Rice_Blast", "Rice_Brown_Spot"])

    def test_parse_class_mapping_invalid_type(self):
        with self.assertRaises(ValueError):
            parse_class_mapping("invalid_string")

    def test_safe_fallback_healthy(self):
        res = get_safe_fallback_treatment("Tomato___healthy", "tomato")
        self.assertEqual(res["condition"], "Healthy Foliage")
        self.assertEqual(res["severity"], "None")
        self.assertIn("No visual symptoms", res["preliminary_guidance"])
        self.assertIn(PRELIMINARY_DISCLAIMER, res["disclaimer"])
        self.assertEqual(res["chemical_options"], [])

    def test_safe_fallback_disease(self):
        res = get_safe_fallback_treatment("Wheat_Yellow_Rust", "wheat")
        self.assertEqual(res["condition"], "Uncataloged Pathological Condition")
        self.assertIn("Do not apply chemical pesticides", res["preliminary_guidance"])
        self.assertEqual(res["chemical_options"], [])
        self.assertIn(PRELIMINARY_DISCLAIMER, res["disclaimer"])

    def test_treatment_lookup_exact(self):
        guide = {
            "Tomato___Early_blight": {
                "disease_name": "Tomato Early Blight",
                "organic_options": ["Neem oil spray"],
                "chemical_options": ["Consult local agricultural officer"],
            }
        }
        res = lookup_treatment("tomato", "Tomato___Early_blight", guide)
        self.assertEqual(res["disease_name"], "Tomato Early Blight")
        self.assertEqual(res["source"], "treatment_guide_exact")
        self.assertEqual(res["organic_options"], ["Neem oil spray"])

    def test_treatment_lookup_crop_scoped(self):
        guide = {
            "rice": {
                "Rice_Blast": {
                    "disease_name": "Rice Blast Fungus",
                    "organic_options": ["Pseudomonas fluorescens"],
                }
            }
        }
        res = lookup_treatment("rice", "Rice_Blast", guide)
        self.assertEqual(res["disease_name"], "Rice Blast Fungus")
        self.assertEqual(res["source"], "treatment_guide_crop_scoped")

    def test_treatment_lookup_normalized(self):
        guide = {
            "wheat_brown_rust": {
                "disease_name": "Wheat Brown Rust",
            }
        }
        res = lookup_treatment("wheat", "Wheat Brown Rust", guide)
        self.assertEqual(res["disease_name"], "Wheat Brown Rust")
        self.assertEqual(res["source"], "treatment_guide_normalized")

    def test_treatment_lookup_fallback_when_empty_or_missing(self):
        res = lookup_treatment("wheat", "Unseen_Disease", {})
        self.assertEqual(res["source"], "safe_default_advisory")

    def test_compute_softmax_logits(self):
        logits = [2.0, 1.0, 0.1]
        probs = compute_softmax(logits)
        self.assertAlmostEqual(float(sum(probs)), 1.0, places=4)
        self.assertTrue(probs[0] > probs[1] > probs[2])

    def test_compute_softmax_already_normalized(self):
        input_probs = [0.7, 0.2, 0.1]
        probs = compute_softmax(input_probs)
        self.assertAlmostEqual(float(probs[0]), 0.7, places=4)

    def test_manager_unsupported_crop(self):
        manager = DiseaseModelManager()
        with self.assertRaises(HTTPException) as ctx:
            manager.get_model_and_classes("cotton")
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Unsupported crop", ctx.exception.detail)

    def test_manager_missing_model_file(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            manager = DiseaseModelManager(base_assets_dir=tmpdir)
            with self.assertRaises(HTTPException) as ctx:
                manager.get_model_and_classes("wheat")
            self.assertEqual(ctx.exception.status_code, 503)
            self.assertIn("Model file for crop 'wheat' not found", ctx.exception.detail)

    def test_manager_missing_class_file(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp_path = Path(tmpdir)
            # Create the model file so it passes model resolution
            model_file = tmp_path / "wheat_mobilenetv2_finetuned.keras"
            model_file.write_text("dummy")

            manager = DiseaseModelManager(base_assets_dir=tmp_path)
            with self.assertRaises(HTTPException) as ctx:
                manager.get_model_and_classes("wheat")
            self.assertEqual(ctx.exception.status_code, 503)
            self.assertIn("Class mapping file for crop 'wheat' not found", ctx.exception.detail)

    def test_manager_thread_safe_caching(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp_path = Path(tmpdir)
            # Create dummy model and label
            (tmp_path / "rice_mobilenetv2_best.keras").write_text("dummy")
            label_file = tmp_path / "rice_class_names.json"
            label_file.write_text(json.dumps(["Rice_Healthy", "Rice_Blast"]))

            manager = DiseaseModelManager(base_assets_dir=tmp_path)
            mock_model = MagicMock()
            manager._load_keras_model = MagicMock(return_value=mock_model)

            # First fetch
            model1, classes1, name1 = manager.get_model_and_classes("rice")
            self.assertEqual(classes1, ["Rice_Healthy", "Rice_Blast"])
            self.assertEqual(name1, "rice_mobilenetv2_best.keras")
            manager._load_keras_model.assert_called_once()

            # Second fetch should hit cache
            model2, classes2, name2 = manager.get_model_and_classes("rice")
            self.assertEqual(model1, model2)
            self.assertEqual(classes1, classes2)
            # Load should not be called again
            manager._load_keras_model.assert_called_once()

            # Cache clear
            manager.clear_cache()
            self.assertEqual(len(manager._models), 0)

    def test_decode_image_empty_bytes(self):
        from app.services.disease_service import decode_image_bytes

        with self.assertRaises(HTTPException) as ctx:
            decode_image_bytes(b"")
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Empty image payload", ctx.exception.detail)

    def test_predict_disease_end_to_end_mocked(self):
        from unittest.mock import patch

        manager = MagicMock()
        mock_model = MagicMock()
        mock_model.predict.return_value = [[2.5, 0.5, 0.1]]  # Logits
        manager.get_model_and_classes.return_value = (
            mock_model,
            ["Tomato___Early_blight", "Tomato___Late_blight", "Tomato___healthy"],
            "best_tomato_model.keras",
        )
        manager.get_treatment_guide.return_value = {
            "Tomato___Early_blight": {
                "disease_name": "Tomato Early Blight",
                "organic_options": ["Copper fungicide"],
            }
        }

        with patch("app.services.disease_service.decode_image_bytes") as mock_decode, \
             patch("app.services.disease_service.preprocess_image_tensor") as mock_pre:
            mock_decode.return_value = MagicMock()
            mock_pre.return_value = MagicMock()

            result = predict_disease(
                crop="tomato",
                image_bytes=b"dummy_bytes",
                manager=manager,
            )

            self.assertEqual(result["crop"], "tomato")
            self.assertEqual(result["predicted_class"], "Tomato___Early_blight")
            self.assertTrue(result["confidence_score"] > 0.8)
            self.assertEqual(len(result["top_predictions"]), 3)
            self.assertEqual(result["top_predictions"][0]["class_name"], "Tomato___Early_blight")
            self.assertEqual(result["treatment"]["disease_name"], "Tomato Early Blight")
            self.assertTrue(result["needs_expert_review"])
            self.assertIn(SOFTMAX_SCORE_NOTE, result["score_interpretation"])
            self.assertIn(PRELIMINARY_DISCLAIMER, result["disclaimer"])

    def test_validate_assets_empty_dir(self):
        from app.services.disease_service import validate_ml_assets

        with tempfile.TemporaryDirectory() as tmpdir:
            report = validate_ml_assets(base_assets_dir=tmpdir)
            self.assertEqual(report["status"], "missing_assets")
            self.assertFalse(report["all_assets_present"])
            self.assertEqual(report["missing_count"], 7)
            self.assertEqual(report["crops"]["tomato"]["model"]["status"], "missing")
            self.assertEqual(report["crops"]["wheat"]["model"]["status"], "missing")
            self.assertEqual(report["crops"]["rice"]["model"]["status"], "missing")
            self.assertEqual(report["treatment_guide"]["status"], "missing")

    def test_validate_assets_complete_subdirs(self):
        from app.services.disease_service import validate_ml_assets

        with tempfile.TemporaryDirectory() as tmpdir:
            p = Path(tmpdir)
            (p / "models").mkdir()
            (p / "labels").mkdir()
            (p / "data").mkdir()

            # Create dummy model and label files
            (p / "models" / "best_tomato_model.keras").write_text("model")
            (p / "models" / "wheat_mobilenetv2_finetuned.keras").write_text("model")
            (p / "models" / "rice_mobilenetv2_best.keras").write_text("model")

            (p / "labels" / "class_names.json").write_text("[]")
            (p / "labels" / "wheat_class_names.json").write_text("[]")
            (p / "labels" / "rice_class_names.json").write_text("[]")

            (p / "data" / "crop_treatment_guide.json").write_text("{}")

            report = validate_ml_assets(base_assets_dir=tmpdir)
            self.assertEqual(report["status"], "ready")
            self.assertTrue(report["all_assets_present"])
            self.assertEqual(report["missing_count"], 0)
            self.assertEqual(report["crops"]["tomato"]["model"]["status"], "present")
            self.assertEqual(report["crops"]["wheat"]["model"]["status"], "present")
            self.assertEqual(report["crops"]["rice"]["model"]["status"], "present")
            self.assertEqual(report["treatment_guide"]["status"], "present")


if __name__ == "__main__":
    unittest.main()
