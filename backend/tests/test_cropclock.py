import unittest
from datetime import date, datetime, timezone
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy import select, delete, create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.user import User
from app.models.farm import Farm
from app.models.harvest import Harvest, BuyerOffer
from app.services.cropclock_service import calculate_net_earnings


class CropClockCalculationTests(unittest.TestCase):
    """Unit tests for CropClock pure Decimal calculations."""

    def test_net_earnings_standard_case(self):
        # 1000 kg wheat @ 25.50/kg, transport=500, other=200
        # Gross = 25,500.00, Costs = 700.00, Net = 24,800.00
        gross, total_costs, net = calculate_net_earnings(
            price_per_kg=Decimal("25.50"),
            quantity_kg=Decimal("1000.00"),
            transport_cost=Decimal("500.00"),
            other_costs=Decimal("200.00"),
        )
        self.assertEqual(gross, Decimal("25500.00"))
        self.assertEqual(total_costs, Decimal("700.00"))
        self.assertEqual(net, Decimal("24800.00"))

    def test_net_earnings_zero_costs(self):
        gross, total_costs, net = calculate_net_earnings(
            price_per_kg=Decimal("30.00"),
            quantity_kg=Decimal("500.00"),
            transport_cost=Decimal("0.00"),
            other_costs=Decimal("0.00"),
        )
        self.assertEqual(gross, Decimal("15000.00"))
        self.assertEqual(total_costs, Decimal("0.00"))
        self.assertEqual(net, Decimal("15000.00"))

    def test_net_earnings_fractional_precision(self):
        # Ensure Decimal quantization avoids floating point imprecision
        gross, total_costs, net = calculate_net_earnings(
            price_per_kg=Decimal("19.99"),
            quantity_kg=Decimal("123.45"),
            transport_cost=Decimal("15.55"),
            other_costs=Decimal("4.45"),
        )
        self.assertEqual(gross, Decimal("2467.77"))
        self.assertEqual(total_costs, Decimal("20.00"))
        self.assertEqual(net, Decimal("2447.77"))


class CropClockIntegrationTests(unittest.TestCase):
    """End-to-end integration tests for CropClock endpoints with safe DB cleanup."""

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
        cls.db = cls.TestingSessionLocal()

        # Generate unique phone/emails to avoid collisions
        unique_suffix = int(datetime.now(timezone.utc).timestamp())
        cls.farmer = User(
            name=f"Test Farmer {unique_suffix}",
            email=f"farmer_{unique_suffix}@cropclock.test",
            phone=f"98765{unique_suffix % 100000:05d}",
            role="farmer",
        )
        cls.buyer1 = User(
            name=f"Test Buyer 1 {unique_suffix}",
            email=f"buyer1_{unique_suffix}@cropclock.test",
            phone=f"88765{unique_suffix % 100000:05d}",
            role="buyer",
        )
        cls.buyer2 = User(
            name=f"Test Buyer 2 {unique_suffix}",
            email=f"buyer2_{unique_suffix}@cropclock.test",
            phone=f"78765{unique_suffix % 100000:05d}",
            role="buyer",
        )
        cls.other_farmer = User(
            name=f"Other Farmer {unique_suffix}",
            email=f"other_{unique_suffix}@cropclock.test",
            phone=f"68765{unique_suffix % 100000:05d}",
            role="farmer",
        )

        cls.db.add_all([cls.farmer, cls.buyer1, cls.buyer2, cls.other_farmer])
        cls.db.commit()
        cls.db.refresh(cls.farmer)
        cls.db.refresh(cls.buyer1)
        cls.db.refresh(cls.buyer2)
        cls.db.refresh(cls.other_farmer)

        cls.farm = Farm(
            farmer_id=cls.farmer.id,
            name=f"Green Valley Farm {unique_suffix}",
            state="Punjab",
            district="Ludhiana",
            area_acres=Decimal("25.50"),
        )
        cls.db.add(cls.farm)
        cls.db.commit()
        cls.db.refresh(cls.farm)

        cls.created_harvest_ids = []

    @classmethod
    def tearDownClass(cls):
        """Clean up all created test data so no permanent rows remain in Neon."""
        try:
            # Delete harvests and cascaded buyer_offers
            for h_id in cls.created_harvest_ids:
                cls.db.execute(delete(Harvest).where(Harvest.id == h_id))
            # Delete farm
            cls.db.execute(delete(Farm).where(Farm.id == cls.farm.id))
            # Delete test users
            user_ids = [cls.farmer.id, cls.buyer1.id, cls.buyer2.id, cls.other_farmer.id]
            cls.db.execute(delete(User).where(User.id.in_(user_ids)))
            cls.db.commit()
        except Exception:
            cls.db.rollback()
        finally:
            app.dependency_overrides.clear()
            cls.db.close()

    def test_01_create_harvest_success(self):
        payload = {
            "farm_id": self.farm.id,
            "farmer_id": self.farmer.id,
            "crop": "Basmati Rice",
            "quantity_kg": 2000.00,
            "expected_harvest_date": str(date.today()),
            "quality_grade": "Grade A",
        }
        res = self.client.post("/api/harvests", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["crop"], "Basmati Rice")
        self.assertEqual(data["status"], "available")
        self.assertEqual(data["state"], "Punjab")
        self.assertEqual(data["district"], "Ludhiana")
        self.created_harvest_ids.append(data["id"])

    def test_02_create_harvest_unauthorized_farmer(self):
        # other_farmer does not own self.farm
        payload = {
            "farm_id": self.farm.id,
            "farmer_id": self.other_farmer.id,
            "crop": "Wheat",
            "quantity_kg": 500.00,
            "expected_harvest_date": str(date.today()),
        }
        res = self.client.post("/api/harvests", json=payload)
        self.assertEqual(res.status_code, 403)

    def test_03_list_and_filter_harvests(self):
        res = self.client.get("/api/harvests?crop=Basmati&state=Punjab&page=1&page_size=10")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("items", data)
        self.assertIn("total", data)
        self.assertGreaterEqual(data["total"], 1)

    def test_04_get_single_harvest(self):
        harvest_id = self.created_harvest_ids[0]
        res = self.client.get(f"/api/harvests/{harvest_id}")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["id"], harvest_id)

    def test_05_get_nonexistent_harvest(self):
        res = self.client.get("/api/harvests/999999999")
        self.assertEqual(res.status_code, 404)

    def test_06_submit_buyer_offers_and_prevent_duplicate(self):
        harvest_id = self.created_harvest_ids[0]

        # Buyer 1 submits offer
        payload1 = {
            "buyer_id": self.buyer1.id,
            "price_per_kg": 35.00,
            "transport_cost": 1000.00,
            "other_costs": 500.00,
        }
        res1 = self.client.post(f"/api/harvests/{harvest_id}/offers", json=payload1)
        self.assertEqual(res1.status_code, 201)
        self.offer1_id = res1.json()["id"]

        # Duplicate active offer from Buyer 1 should be rejected (409 Conflict)
        res_dup = self.client.post(f"/api/harvests/{harvest_id}/offers", json=payload1)
        self.assertEqual(res_dup.status_code, 409)

        # Buyer 2 submits a competitive offer
        payload2 = {
            "buyer_id": self.buyer2.id,
            "price_per_kg": 37.50,
            "transport_cost": 1500.00,
            "other_costs": 300.00,
        }
        res2 = self.client.post(f"/api/harvests/{harvest_id}/offers", json=payload2)
        self.assertEqual(res2.status_code, 201)
        self.offer2_id = res2.json()["id"]

    def test_07_compare_offers_ranking(self):
        harvest_id = self.created_harvest_ids[0]
        res = self.client.get(f"/api/harvests/{harvest_id}/compare-offers")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["harvest_id"], harvest_id)
        self.assertEqual(data["total_offers_evaluated"], 2)
        offers = data["offers"]

        # Offer 2: (37.50 * 2000) - 1500 - 300 = 75,000 - 1800 = 73,200.00
        # Offer 1: (35.00 * 2000) - 1000 - 500 = 70,000 - 1500 = 68,500.00
        # Top offer should be Buyer 2's offer with higher net earnings
        self.assertGreater(Decimal(str(offers[0]["estimated_net"])), Decimal(str(offers[1]["estimated_net"])))
        self.assertEqual(offers[0]["buyer_id"], self.buyer2.id)
        self.assertEqual(Decimal(str(offers[0]["estimated_net"])), Decimal("73200.00"))

    def test_08_accept_offer_and_reserve_harvest(self):
        harvest_id = self.created_harvest_ids[0]
        # Fetch offers to get offer IDs
        offers_res = self.client.get(f"/api/harvests/{harvest_id}/offers")
        offers = offers_res.json()
        target_offer = offers[0]
        other_offer = offers[1]

        # Farmer accepts target_offer
        res = self.client.patch(
            f"/api/offers/{target_offer['id']}/status",
            json={"farmer_id": self.farmer.id, "status": "accepted"},
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "accepted")

        # Verify harvest status transitioned to reserved
        harvest_res = self.client.get(f"/api/harvests/{harvest_id}")
        self.assertEqual(harvest_res.json()["status"], "reserved")

        # Attempting to accept a second offer on the reserved harvest should fail (409 Conflict)
        res_conflict = self.client.patch(
            f"/api/offers/{other_offer['id']}/status",
            json={"farmer_id": self.farmer.id, "status": "accepted"},
        )
        self.assertEqual(res_conflict.status_code, 409)

    def test_09_health_check_still_operational(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "ok")
        self.assertEqual(res.json()["database"]["status"], "connected")


class CropClockOpenAPITests(unittest.TestCase):
    """Verify that all CropClock endpoints are exposed in OpenAPI documentation."""

    def test_openapi_contains_cropclock_routes(self):
        client = TestClient(app)
        res = client.get("/openapi.json")
        self.assertEqual(res.status_code, 200)
        schema = res.json()
        paths = schema["paths"]

        expected_endpoints = [
            "/api/harvests",
            "/api/harvests/{harvest_id}",
            "/api/harvests/{harvest_id}/offers",
            "/api/offers/{offer_id}/status",
            "/api/harvests/{harvest_id}/compare-offers",
        ]
        for ep in expected_endpoints:
            self.assertIn(ep, paths, f"Expected endpoint {ep} was missing from OpenAPI schema")


if __name__ == "__main__":
    unittest.main()
