import io
import unittest
from decimal import Decimal
from unittest.mock import patch, MagicMock

from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.user import User
from app.models.farm import Farm
from app.models.disease import DiseaseDetection


def create_dummy_image_bytes(format="JPEG", size=(64, 64), color="green") -> bytes:
    """Generate in-memory valid image bytes for testing."""
    img = Image.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format=format)
    return buf.getvalue()


class DiseaseRouterIntegrationTests(unittest.TestCase):
    """End-to-end integration tests for crop disease detection router and database persistence."""

    @classmethod
    def setUpClass(cls):
        # Create an isolated in-memory SQLite database
        cls.test_engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        cls.TestingSessionLocal = sessionmaker(
            bind=cls.test_engine,
            autocommit=False,
            autoflush=False,
            expire_on_commit=False,
        )
        Base.metadata.create_all(bind=cls.test_engine)

        def override_get_db():
            db = cls.TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=cls.test_engine)

    def setUp(self):
        self.db = self.TestingSessionLocal()

        # Seed test user and farm
        self.farmer = User(
            name="Sardar Gurpreet Singh",
            email="gurpreet@smartfarming.test",
            phone="9876500001",
            role="farmer",
        )
        self.other_farmer = User(
            name="Other Farmer",
            email="other@smartfarming.test",
            phone="9876500002",
            role="farmer",
        )
        self.db.add_all([self.farmer, self.other_farmer])
        self.db.commit()
        self.db.refresh(self.farmer)
        self.db.refresh(self.other_farmer)

        self.farm = Farm(
            farmer_id=self.farmer.id,
            name="Gurpreet Wheat & Rice Farm",
            state="Punjab",
            district="Ludhiana",
            area_acres=Decimal("15.50"),
        )
        self.db.add(self.farm)
        self.db.commit()
        self.db.refresh(self.farm)

    def tearDown(self):
        self.db.query(DiseaseDetection).delete()
        self.db.query(Farm).delete()
        self.db.query(User).delete()
        self.db.commit()
        self.db.close()

    @patch("app.services.disease_service.predict_disease")
    def test_01_detect_disease_success_tomato(self, mock_predict):
        mock_predict.return_value = {
            "crop": "tomato",
            "predicted_class": "Tomato___Early_blight",
            "confidence_score": 0.9425,
            "top_predictions": [
                {"class_name": "Tomato___Early_blight", "score": 0.9425},
                {"class_name": "Tomato___Late_blight", "score": 0.0410},
                {"class_name": "Tomato___healthy", "score": 0.0165},
            ],
            "treatment": {
                "disease_name": "Tomato Early Blight",
                "organic_options": ["Neem oil", "Copper fungicide"],
                "source": "treatment_guide_exact",
            },
            "needs_expert_review": True,
            "model_used": "best_tomato_finetuned.keras",
            "score_interpretation": "Raw softmax score from model output distribution.",
            "disclaimer": "Preliminary automated advisory.",
        }

        image_bytes = create_dummy_image_bytes(format="JPEG")
        files = {"file": ("leaf.jpg", image_bytes, "image/jpeg")}
        data = {
            "crop": "tomato",
            "farm_id": str(self.farm.id),
            "farmer_id": str(self.farmer.id),
        }

        response = self.client.post("/api/disease/detect", data=data, files=files)
        self.assertEqual(response.status_code, 201)
        res = response.json()

        # Validate response contract
        self.assertEqual(res["crop"], "tomato")
        self.assertEqual(res["predicted_class"], "Tomato___Early_blight")
        self.assertEqual(float(res["confidence"]), 0.9425)
        self.assertEqual(res["farm_id"], self.farm.id)
        self.assertTrue(res["needs_expert_review"])
        self.assertTrue(res["guidance_available"])
        self.assertEqual(res["treatment"]["disease_name"], "Tomato Early Blight")
        self.assertEqual(len(res["top_predictions"]), 3)
        self.assertIn("score_interpretation", res)
        self.assertIn("disclaimer", res)

        # Validate database persistence
        db_record = self.db.get(DiseaseDetection, res["id"])
        self.assertIsNotNone(db_record)
        self.assertEqual(db_record.farm_id, self.farm.id)
        self.assertEqual(db_record.predicted_class, "Tomato___Early_blight")
        self.assertEqual(float(db_record.confidence), 0.9425)
        self.assertEqual(db_record.image_reference, "leaf.jpg")
        self.assertTrue(db_record.needs_expert_review)
        self.assertTrue(db_record.guidance_available)

    @patch("app.services.disease_service.predict_disease")
    def test_02_detect_disease_alias_endpoint(self, mock_predict):
        mock_predict.return_value = {
            "crop": "wheat",
            "predicted_class": "healthy_wheat",
            "confidence_score": 0.9850,
            "top_predictions": [{"class_name": "healthy_wheat", "score": 0.9850}],
            "treatment": {"disease_name": "Healthy Wheat", "source": "safe_default_advisory"},
            "needs_expert_review": False,
            "model_used": "wheat_mobilenetv2_finetuned.keras",
            "score_interpretation": "Softmax",
            "disclaimer": "Advisory",
        }

        image_bytes = create_dummy_image_bytes(format="PNG")
        files = {"file": ("wheat_sample.png", image_bytes, "image/png")}
        data = {"crop": "wheat"}

        response = self.client.post("/api/disease/diagnose", data=data, files=files)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["predicted_class"], "healthy_wheat")
        self.assertFalse(response.json()["needs_expert_review"])

    def test_03_detect_disease_invalid_crop_type(self):
        image_bytes = create_dummy_image_bytes()
        files = {"file": ("leaf.jpg", image_bytes, "image/jpeg")}
        data = {"crop": "sugarcane"}

        response = self.client.post("/api/disease/detect", data=data, files=files)
        self.assertEqual(response.status_code, 400)
        self.assertIn("Unsupported crop 'sugarcane'", response.json()["detail"])

    def test_04_detect_disease_empty_image(self):
        files = {"file": ("empty.jpg", b"", "image/jpeg")}
        data = {"crop": "rice"}

        response = self.client.post("/api/disease/detect", data=data, files=files)
        self.assertEqual(response.status_code, 400)
        self.assertIn("empty", response.json()["detail"].lower())

    def test_05_detect_disease_corrupt_image(self):
        files = {"file": ("corrupt.jpg", b"NOT_A_VALID_JPEG_HEADER", "image/jpeg")}
        data = {"crop": "rice"}

        response = self.client.post("/api/disease/detect", data=data, files=files)
        self.assertEqual(response.status_code, 400)
        self.assertIn("decode", response.json()["detail"].lower())

    def test_06_detect_disease_invalid_extension(self):
        files = {"file": ("payload.exe", b"binary", "application/octet-stream")}
        data = {"crop": "tomato"}

        response = self.client.post("/api/disease/detect", data=data, files=files)
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid file extension", response.json()["detail"])

    def test_07_detect_disease_farm_not_found(self):
        image_bytes = create_dummy_image_bytes()
        files = {"file": ("leaf.jpg", image_bytes, "image/jpeg")}
        data = {"crop": "wheat", "farm_id": "99999"}

        response = self.client.post("/api/disease/detect", data=data, files=files)
        self.assertEqual(response.status_code, 404)
        self.assertIn("Farm with ID 99999 not found", response.json()["detail"])

    def test_08_detect_disease_farm_ownership_forbidden(self):
        image_bytes = create_dummy_image_bytes()
        files = {"file": ("leaf.jpg", image_bytes, "image/jpeg")}
        # other_farmer does not own self.farm
        data = {
            "crop": "wheat",
            "farm_id": str(self.farm.id),
            "farmer_id": str(self.other_farmer.id),
        }

        response = self.client.post("/api/disease/detect", data=data, files=files)
        self.assertEqual(response.status_code, 403)
        self.assertIn("does not own farm", response.json()["detail"])

    def test_09_list_and_get_disease_detections(self):
        # Insert a detection row directly
        item = DiseaseDetection(
            farm_id=self.farm.id,
            image_reference="test_leaf.jpg",
            predicted_class="wheat_yellow_rust",
            confidence=Decimal("0.8920"),
            needs_expert_review=True,
            guidance_available=True,
        )
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)

        # List endpoint
        list_res = self.client.get(f"/api/disease/detections?farm_id={self.farm.id}")
        self.assertEqual(list_res.status_code, 200)
        data = list_res.json()
        self.assertTrue(data["total"] >= 1)
        self.assertEqual(data["items"][0]["predicted_class"], "wheat_yellow_rust")

        # Get single endpoint
        single_res = self.client.get(f"/api/disease/detections/{item.id}")
        self.assertEqual(single_res.status_code, 200)
        self.assertEqual(single_res.json()["id"], item.id)

    def test_10_check_ml_assets_status_endpoint(self):
        res = self.client.get("/api/disease/assets/status")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("status", data)
        self.assertIn("crops", data)
        self.assertIn("treatment_guide", data)


if __name__ == "__main__":
    unittest.main()
