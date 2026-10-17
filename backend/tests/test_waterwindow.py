import unittest
from datetime import datetime, timezone
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.user import User
from app.models.farm import Farm
from app.models.irrigation import IrrigationPlan
from app.services.waterwindow_service import evaluate_irrigation_recommendation


class WaterWindowRuleEngineTests(unittest.TestCase):
    """Unit tests for the deterministic WaterWindow recommendation rule engine."""

    def test_flowering_stage_critical_recommendation(self):
        action, scheduled_at, reason = evaluate_irrigation_recommendation(
            crop="Wheat",
            growth_stage="flowering",
        )
        self.assertIn("full-depth irrigation cycle", action)
        self.assertIsNotNone(scheduled_at)
        self.assertIn("moisture-critical physiological phase", reason)
        self.assertIn("WaterWindow Prototype Engine", reason)

    def test_maturity_stage_withhold_recommendation(self):
        action, scheduled_at, reason = evaluate_irrigation_recommendation(
            crop="Basmati Rice",
            growth_stage="maturity",
        )
        self.assertIn("Withhold irrigation", action)
        self.assertIsNone(scheduled_at)
        self.assertIn("delays maturity", reason)

    def test_rain_alert_postpones_irrigation(self):
        action, scheduled_at, reason = evaluate_irrigation_recommendation(
            crop="Cotton",
            growth_stage="vegetative",
            forecasted_rain_expected=True,
        )
        self.assertIn("Postpone scheduled irrigation", action)
        self.assertIsNotNone(scheduled_at)
        self.assertIn("Significant rainfall forecasted", reason)

    def test_saturated_soil_suspends_irrigation(self):
        action, scheduled_at, reason = evaluate_irrigation_recommendation(
            crop="Maize",
            growth_stage="vegetative",
            observed_soil_moisture="wet",
        )
        self.assertIn("Suspend irrigation immediately", action)
        self.assertIsNone(scheduled_at)
        self.assertIn("Field soil is saturated", reason)

    def test_sandy_soil_modifier(self):
        action, scheduled_at, reason = evaluate_irrigation_recommendation(
            crop="Groundnut",
            growth_stage="pod_development",
            soil_type="sandy",
        )
        self.assertIn("High hydraulic conductivity", reason)


class WaterWindowIsolatedApiTests(unittest.TestCase):
    """Isolated integration tests for WaterWindow endpoints using in-memory SQLite."""

    @classmethod
    def setUpClass(cls):
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
        # Seed test users
        self.farmer = User(
            name="Gurpreet Singh",
            email="gurpreet@waterwindow.test",
            phone="9876543210",
            role="farmer",
        )
        self.other_farmer = User(
            name="Balwinder Singh",
            email="balwinder@waterwindow.test",
            phone="8765432109",
            role="farmer",
        )
        self.buyer = User(
            name="Rajesh Buyer",
            email="rajesh@waterwindow.test",
            phone="7654321098",
            role="buyer",
        )
        self.db.add_all([self.farmer, self.other_farmer, self.buyer])
        self.db.commit()
        self.db.refresh(self.farmer)
        self.db.refresh(self.other_farmer)
        self.db.refresh(self.buyer)

        # Seed test farm owned by self.farmer
        self.farm = Farm(
            farmer_id=self.farmer.id,
            name="Sutlej Farmstead",
            state="Punjab",
            district="Ferozepur",
            area_acres=Decimal("40.00"),
        )
        self.db.add(self.farm)
        self.db.commit()
        self.db.refresh(self.farm)

    def tearDown(self):
        self.db.query(IrrigationPlan).delete()
        self.db.query(Farm).delete()
        self.db.query(User).delete()
        self.db.commit()
        self.db.close()

    def test_01_create_irrigation_plan_success(self):
        payload = {
            "farm_id": self.farm.id,
            "farmer_id": self.farmer.id,
            "crop": "Wheat",
            "growth_stage": "crown_root_initiation",
            "soil_type": "alluvial",
            "observed_soil_moisture": "dry",
            "forecasted_rain_expected": False,
        }
        res = self.client.post("/api/irrigation/plan", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["farm_id"], self.farm.id)
        self.assertEqual(data["farm_name"], "Sutlej Farmstead")
        self.assertEqual(data["state"], "Punjab")
        self.assertEqual(data["district"], "Ferozepur")
        self.assertEqual(data["crop"], "Wheat")
        self.assertIn("Priority irrigation", data["recommended_action"])
        self.assertIn("WaterWindow Prototype Engine", data["reason"])
        self.assertIsNotNone(data["scheduled_at"])

    def test_02_create_irrigation_plan_unauthorized_farmer(self):
        # other_farmer does not own self.farm
        payload = {
            "farm_id": self.farm.id,
            "farmer_id": self.other_farmer.id,
            "crop": "Wheat",
            "growth_stage": "flowering",
        }
        res = self.client.post("/api/irrigation/plan", json=payload)
        self.assertEqual(res.status_code, 403)
        self.assertIn("does not own farm", res.json()["detail"])

    def test_03_create_irrigation_plan_non_farmer_role(self):
        # buyer user attempts to create irrigation plan
        payload = {
            "farm_id": self.farm.id,
            "farmer_id": self.buyer.id,
            "crop": "Cotton",
            "growth_stage": "vegetative",
        }
        res = self.client.post("/api/irrigation/plan", json=payload)
        self.assertEqual(res.status_code, 400)
        self.assertIn("must be 'farmer'", res.json()["detail"])

    def test_04_create_irrigation_plan_missing_records(self):
        # Non-existent farm
        res_farm = self.client.post(
            "/api/irrigation/plan",
            json={"farm_id": 99999, "farmer_id": self.farmer.id, "crop": "Rice", "growth_stage": "nursery"},
        )
        self.assertEqual(res_farm.status_code, 404)

        # Non-existent farmer
        res_user = self.client.post(
            "/api/irrigation/plan",
            json={"farm_id": self.farm.id, "farmer_id": 99999, "crop": "Rice", "growth_stage": "nursery"},
        )
        self.assertEqual(res_user.status_code, 404)

    def test_05_create_irrigation_plan_invalid_moisture_pattern(self):
        payload = {
            "farm_id": self.farm.id,
            "farmer_id": self.farmer.id,
            "crop": "Wheat",
            "growth_stage": "flowering",
            "observed_soil_moisture": "super_wet",  # Invalid regex (only dry/adequate/wet allowed)
        }
        res = self.client.post("/api/irrigation/plan", json=payload)
        self.assertEqual(res.status_code, 422)

    def test_06_list_and_filter_irrigation_plans(self):
        # Create two plans
        p1 = IrrigationPlan(
            farm_id=self.farm.id,
            crop="Mustard",
            growth_stage="flowering",
            recommended_action="Irrigate 40mm",
            reason="Flowering moisture needed",
        )
        p2 = IrrigationPlan(
            farm_id=self.farm.id,
            crop="Barley",
            growth_stage="maturity",
            recommended_action="Withhold water",
            reason="Facilitate ripening",
        )
        self.db.add_all([p1, p2])
        self.db.commit()

        # Filter by crop
        res_crop = self.client.get(f"/api/irrigation/plans?crop=Mustard")
        self.assertEqual(res_crop.status_code, 200)
        data = res_crop.json()
        self.assertEqual(data["total"], 1)
        self.assertEqual(data["items"][0]["crop"], "Mustard")

        # Filter by growth stage
        res_stage = self.client.get(f"/api/irrigation/plans?growth_stage=maturity")
        self.assertEqual(res_stage.status_code, 200)
        self.assertEqual(res_stage.json()["total"], 1)
        self.assertEqual(res_stage.json()["items"][0]["crop"], "Barley")

        # Filter by farm_id
        res_farm = self.client.get(f"/api/irrigation/plans?farm_id={self.farm.id}")
        self.assertEqual(res_farm.status_code, 200)
        self.assertEqual(res_farm.json()["total"], 2)

    def test_07_get_single_irrigation_plan(self):
        p = IrrigationPlan(
            farm_id=self.farm.id,
            crop="Sugarcane",
            growth_stage="formative",
            recommended_action="Apply ridge furrow irrigation 50mm",
            reason="Critical tillering water demand",
        )
        self.db.add(p)
        self.db.commit()
        self.db.refresh(p)

        res = self.client.get(f"/api/irrigation/plans/{p.id}")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["id"], p.id)
        self.assertEqual(data["crop"], "Sugarcane")
        self.assertEqual(data["farm_name"], "Sutlej Farmstead")

        res_404 = self.client.get("/api/irrigation/plans/999999")
        self.assertEqual(res_404.status_code, 404)

    def test_08_openapi_contains_waterwindow_routes(self):
        res = self.client.get("/openapi.json")
        self.assertEqual(res.status_code, 200)
        paths = res.json()["paths"]

        expected_routes = [
            "/api/irrigation/plan",
            "/api/irrigation/plans",
            "/api/irrigation/plans/{plan_id}",
        ]
        for route in expected_routes:
            self.assertIn(route, paths)


if __name__ == "__main__":
    unittest.main()
