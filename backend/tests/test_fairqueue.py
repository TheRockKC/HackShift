import unittest
from datetime import datetime, timezone, timedelta
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.user import User
from app.models.machinery import Machinery, Booking


class FairQueueIsolatedTests(unittest.TestCase):
    """Isolated tests for FairQueue machinery rental and booking endpoints.

    Uses an isolated SQLite in-memory database with StaticPool to ensure zero pollution
    or destructive operations against the live database.
    """

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
        # Populate test seed users
        self.db = self.TestingSessionLocal()
        self.provider = User(
            name="Ramesh Equipment Provider",
            email="ramesh@equipment.test",
            phone="9988776655",
            role="machinery_provider",
        )
        self.farmer1 = User(
            name="Harpreet Singh Farmer",
            email="harpreet@kisan.test",
            phone="8877665544",
            role="farmer",
        )
        self.farmer2 = User(
            name="Sukhwinder Farmer",
            email="sukhwinder@kisan.test",
            phone="7766554433",
            role="farmer",
        )
        self.buyer = User(
            name="Karan Buyer",
            email="karan@buyer.test",
            phone="6655443322",
            role="buyer",
        )
        self.db.add_all([self.provider, self.farmer1, self.farmer2, self.buyer])
        self.db.commit()
        self.db.refresh(self.provider)
        self.db.refresh(self.farmer1)
        self.db.refresh(self.farmer2)
        self.db.refresh(self.buyer)

    def tearDown(self):
        self.db.query(Booking).delete()
        self.db.query(Machinery).delete()
        self.db.query(User).delete()
        self.db.commit()
        self.db.close()

    def test_01_create_machinery_success(self):
        payload = {
            "provider_id": self.provider.id,
            "equipment_type": "Tractor",
            "name": "Mahindra 575 DI",
            "hourly_rate": 800.00,
            "daily_rate": 6000.00,
            "state": "Punjab",
            "district": "Sangrur",
        }
        res = self.client.post("/api/machinery", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["equipment_type"], "Tractor")
        self.assertEqual(data["name"], "Mahindra 575 DI")
        self.assertEqual(data["provider_name"], "Ramesh Equipment Provider")
        self.assertTrue(data["is_available"])

    def test_02_create_machinery_validation_rules(self):
        # Missing positive rate (both 0 or null)
        bad_payload = {
            "provider_id": self.provider.id,
            "equipment_type": "Rotavator",
            "hourly_rate": 0.00,
            "daily_rate": None,
            "state": "Punjab",
            "district": "Sangrur",
        }
        res = self.client.post("/api/machinery", json=bad_payload)
        self.assertEqual(res.status_code, 422)

        # Unauthorized role (farmer cannot create machinery listings)
        unauth_payload = {
            "provider_id": self.farmer1.id,
            "equipment_type": "Harvester",
            "hourly_rate": 1500.00,
            "state": "Punjab",
            "district": "Sangrur",
        }
        res_role = self.client.post("/api/machinery", json=unauth_payload)
        self.assertEqual(res_role.status_code, 400)

    def test_03_browse_and_filter_machinery(self):
        # Create two listings
        m1 = Machinery(
            provider_id=self.provider.id,
            equipment_type="Combine Harvester",
            name="Claas Crop Tiger",
            hourly_rate=Decimal("2500.00"),
            state="Punjab",
            district="Ludhiana",
            is_available=True,
        )
        m2 = Machinery(
            provider_id=self.provider.id,
            equipment_type="Solar Pump",
            name="Tata 5HP Solar",
            daily_rate=Decimal("1200.00"),
            state="Haryana",
            district="Karnal",
            is_available=False,
        )
        self.db.add_all([m1, m2])
        self.db.commit()

        # Filter by equipment type
        res_type = self.client.get("/api/machinery?equipment_type=Harvester")
        self.assertEqual(res_type.status_code, 200)
        data = res_type.json()
        self.assertEqual(data["total"], 1)
        self.assertEqual(data["items"][0]["name"], "Claas Crop Tiger")
        # Ensure private phone and email are not exposed
        self.assertNotIn("phone", data["items"][0])
        self.assertNotIn("email", data["items"][0])

        # Filter by availability
        res_avail = self.client.get("/api/machinery?is_available=true")
        self.assertEqual(res_avail.status_code, 200)
        self.assertEqual(res_avail.json()["total"], 1)

    def test_04_get_machinery_details(self):
        m = Machinery(
            provider_id=self.provider.id,
            equipment_type="Laser Land Leveler",
            hourly_rate=Decimal("1100.00"),
            state="Punjab",
            district="Patiala",
            is_available=True,
        )
        self.db.add(m)
        self.db.commit()
        self.db.refresh(m)

        res = self.client.get(f"/api/machinery/{m.id}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["equipment_type"], "Laser Land Leveler")

        res_404 = self.client.get("/api/machinery/999999")
        self.assertEqual(res_404.status_code, 404)

    def test_05_create_booking_success_and_conflict_detection(self):
        m = Machinery(
            provider_id=self.provider.id,
            equipment_type="Baler",
            hourly_rate=Decimal("1800.00"),
            state="Punjab",
            district="Bathinda",
            is_available=True,
        )
        self.db.add(m)
        self.db.commit()
        self.db.refresh(m)

        base_time = datetime(2026, 11, 20, 9, 0, tzinfo=timezone.utc)
        slot_end = base_time + timedelta(hours=4)

        # 1. First booking succeeds
        payload1 = {
            "farmer_id": self.farmer1.id,
            "start_time": base_time.isoformat(),
            "end_time": slot_end.isoformat(),
        }
        res1 = self.client.post(f"/api/machinery/{m.id}/bookings", json=payload1)
        self.assertEqual(res1.status_code, 201)
        booking1_id = res1.json()["id"]

        # 2. Overlapping booking 1 (exact same slot) -> 409 Conflict
        res_conflict_exact = self.client.post(f"/api/machinery/{m.id}/bookings", json=payload1)
        self.assertEqual(res_conflict_exact.status_code, 409)

        # 3. Overlapping booking 2 (overlaps start) -> 409 Conflict
        payload_overlap_start = {
            "farmer_id": self.farmer2.id,
            "start_time": (base_time - timedelta(hours=1)).isoformat(),
            "end_time": (base_time + timedelta(hours=2)).isoformat(),
        }
        res_overlap_start = self.client.post(f"/api/machinery/{m.id}/bookings", json=payload_overlap_start)
        self.assertEqual(res_overlap_start.status_code, 409)

        # 4. Overlapping booking 3 (overlaps end) -> 409 Conflict
        payload_overlap_end = {
            "farmer_id": self.farmer2.id,
            "start_time": (base_time + timedelta(hours=2)).isoformat(),
            "end_time": (slot_end + timedelta(hours=2)).isoformat(),
        }
        res_overlap_end = self.client.post(f"/api/machinery/{m.id}/bookings", json=payload_overlap_end)
        self.assertEqual(res_overlap_end.status_code, 409)

        # 5. Non-overlapping booking (later slot) -> 201 Created
        payload_non_overlap = {
            "farmer_id": self.farmer2.id,
            "start_time": (slot_end + timedelta(hours=1)).isoformat(),
            "end_time": (slot_end + timedelta(hours=5)).isoformat(),
        }
        res_non_overlap = self.client.post(f"/api/machinery/{m.id}/bookings", json=payload_non_overlap)
        self.assertEqual(res_non_overlap.status_code, 201)

    def test_06_booking_role_and_time_validation(self):
        m = Machinery(
            provider_id=self.provider.id,
            equipment_type="Plow",
            hourly_rate=Decimal("600.00"),
            state="Punjab",
            district="Amritsar",
            is_available=True,
        )
        self.db.add(m)
        self.db.commit()
        self.db.refresh(m)

        # Non-farmer user booking
        t1 = datetime(2026, 11, 22, 10, 0, tzinfo=timezone.utc)
        t2 = t1 + timedelta(hours=2)
        res_role = self.client.post(
            f"/api/machinery/{m.id}/bookings",
            json={"farmer_id": self.buyer.id, "start_time": t1.isoformat(), "end_time": t2.isoformat()},
        )
        self.assertEqual(res_role.status_code, 400)

        # end_time <= start_time
        res_time = self.client.post(
            f"/api/machinery/{m.id}/bookings",
            json={"farmer_id": self.farmer1.id, "start_time": t2.isoformat(), "end_time": t1.isoformat()},
        )
        self.assertEqual(res_time.status_code, 422)

    def test_07_status_transitions_and_authorization(self):
        m = Machinery(
            provider_id=self.provider.id,
            equipment_type="Seeder",
            hourly_rate=Decimal("900.00"),
            state="Punjab",
            district="Jalandhar",
            is_available=True,
        )
        self.db.add(m)
        self.db.commit()
        self.db.refresh(m)

        start = datetime(2026, 11, 25, 8, 0, tzinfo=timezone.utc)
        end = start + timedelta(hours=3)

        booking = Booking(
            machinery_id=m.id,
            farmer_id=self.farmer1.id,
            start_time=start,
            end_time=end,
            status="pending",
        )
        self.db.add(booking)
        self.db.commit()
        self.db.refresh(booking)

        # 1. Unauthorized user cannot update status (403)
        res_unauth = self.client.patch(
            f"/api/bookings/{booking.id}/status",
            json={"user_id": self.farmer2.id, "status": "confirmed"},
        )
        self.assertEqual(res_unauth.status_code, 403)

        # 2. Farmer cannot confirm their own booking (403)
        res_farmer_confirm = self.client.patch(
            f"/api/bookings/{booking.id}/status",
            json={"user_id": self.farmer1.id, "status": "confirmed"},
        )
        self.assertEqual(res_farmer_confirm.status_code, 403)

        # 3. Provider confirms the pending booking (200)
        res_confirm = self.client.patch(
            f"/api/bookings/{booking.id}/status",
            json={"user_id": self.provider.id, "status": "confirmed"},
        )
        self.assertEqual(res_confirm.status_code, 200)
        self.assertEqual(res_confirm.json()["status"], "confirmed")

        # 4. Farmer cancels the confirmed booking (200)
        res_cancel = self.client.patch(
            f"/api/bookings/{booking.id}/status",
            json={"user_id": self.farmer1.id, "status": "cancelled"},
        )
        self.assertEqual(res_cancel.status_code, 200)
        self.assertEqual(res_cancel.json()["status"], "cancelled")

        # 5. Cancellation frees the time slot: a new booking for the same slot now succeeds (201)
        res_rebook = self.client.post(
            f"/api/machinery/{m.id}/bookings",
            json={
                "farmer_id": self.farmer2.id,
                "start_time": start.isoformat(),
                "end_time": end.isoformat(),
            },
        )
        self.assertEqual(res_rebook.status_code, 201)

    def test_08_openapi_contains_fairqueue_routes(self):
        res = self.client.get("/openapi.json")
        self.assertEqual(res.status_code, 200)
        paths = res.json()["paths"]

        expected_routes = [
            "/api/machinery",
            "/api/machinery/{machinery_id}",
            "/api/machinery/{machinery_id}/bookings",
            "/api/bookings/{booking_id}/status",
        ]
        for route in expected_routes:
            self.assertIn(route, paths)


if __name__ == "__main__":
    unittest.main()
