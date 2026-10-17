import unittest
from datetime import datetime, timezone, timedelta

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.user import User
from app.models.camp import Camp


class CampIsolatedTests(unittest.TestCase):
    """Isolated tests for FarmConnect Camps endpoints.

    Uses an isolated SQLite in-memory database with StaticPool to ensure zero pollution
    or destructive operations against the live Neon database.
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
        self.db = self.TestingSessionLocal()
        # Seed users for coordinator / role checks
        self.admin = User(
            name="Platform Admin",
            email="admin@smartfarming.test",
            phone="9876543210",
            role="admin",
        )
        self.farmer = User(
            name="Gurpreet Singh",
            email="gurpreet@kisan.test",
            phone="9812345678",
            role="farmer",
        )
        self.provider = User(
            name="Rajesh Machinery",
            email="rajesh@machinery.test",
            phone="9823456789",
            role="machinery_provider",
        )
        self.buyer = User(
            name="Sunil Buyer",
            email="sunil@buyer.test",
            phone="9834567890",
            role="buyer",
        )
        self.db.add_all([self.admin, self.farmer, self.provider, self.buyer])
        self.db.commit()
        for u in (self.admin, self.farmer, self.provider, self.buyer):
            self.db.refresh(u)

    def tearDown(self):
        self.db.query(Camp).delete()
        self.db.query(User).delete()
        self.db.commit()
        self.db.close()

    # -------------------------------------------------------------------------
    # 1. Camp Creation Tests
    # -------------------------------------------------------------------------
    def test_01_create_camp_success(self):
        start = datetime.now(timezone.utc) + timedelta(days=5)
        end = start + timedelta(hours=3)

        payload = {
            "title": "Digital Mandi & eKYC Awareness Camp",
            "description": "Training session for smallholders on eNAM registration, PM-KISAN eKYC, and digital banking.",
            "scheduled_start": start.isoformat(),
            "scheduled_end": end.isoformat(),
            "venue": "Community Hall, Near Bus Stand",
            "village": "Jagraon",
            "district": "Ludhiana",
            "state": "Punjab",
            "topics": "eNAM, PM-KISAN, Mobile Banking, Soil Health Card",
            "contact_person": "Sardar Baldev Singh",
            "contact_phone": "9876500001",
            "coordinator_id": self.admin.id,
        }

        response = self.client.post("/api/camps", json=payload)
        self.assertEqual(response.status_code, 201, response.text)
        data = response.json()
        self.assertIn("id", data)
        self.assertEqual(data["title"], payload["title"])
        self.assertEqual(data["district"], "Ludhiana")
        self.assertEqual(data["state"], "Punjab")
        self.assertEqual(data["is_cancelled"], False)
        self.assertEqual(data["village"], "Jagraon")

    def test_02_create_camp_invalid_time_range(self):
        now = datetime.now(timezone.utc)
        # End before start
        payload = {
            "title": "Time Inverted Camp",
            "description": "This should be rejected because end is earlier than start.",
            "scheduled_start": (now + timedelta(days=2)).isoformat(),
            "scheduled_end": (now + timedelta(days=1)).isoformat(),
            "venue": "Panchayat Ghar",
            "district": "Patiala",
            "state": "Punjab",
            "topics": "Digital Literacy",
            "coordinator_id": self.admin.id,
        }
        response = self.client.post("/api/camps", json=payload)
        self.assertEqual(response.status_code, 422)

        # End equal to start
        payload["scheduled_end"] = payload["scheduled_start"]
        response2 = self.client.post("/api/camps", json=payload)
        self.assertEqual(response2.status_code, 422)

    def test_03_create_camp_naive_datetime_rejected(self):
        # Naive datetime string without timezone offset
        payload = {
            "title": "Naive Timestamp Camp",
            "description": "Should fail validation due to lack of timezone.",
            "scheduled_start": "2026-11-01T10:00:00",
            "scheduled_end": "2026-11-01T13:00:00",
            "venue": "Panchayat Ghar",
            "district": "Amritsar",
            "state": "Punjab",
            "topics": "Digital Literacy",
            "coordinator_id": self.admin.id,
        }
        response = self.client.post("/api/camps", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_04_create_camp_role_and_existence_checks(self):
        start = datetime.now(timezone.utc) + timedelta(days=3)
        end = start + timedelta(hours=2)
        base_payload = {
            "title": "Role Test Camp",
            "description": "Testing permission boundaries for camp creation.",
            "scheduled_start": start.isoformat(),
            "scheduled_end": end.isoformat(),
            "venue": "School Ground",
            "district": "Bathinda",
            "state": "Punjab",
            "topics": "Farmer Literacy",
        }

        # Unknown user
        payload_unknown = {**base_payload, "coordinator_id": 99999}
        res_unknown = self.client.post("/api/camps", json=payload_unknown)
        self.assertEqual(res_unknown.status_code, 404)

        # Farmer role (unauthorized)
        payload_farmer = {**base_payload, "coordinator_id": self.farmer.id}
        res_farmer = self.client.post("/api/camps", json=payload_farmer)
        self.assertEqual(res_farmer.status_code, 400)
        self.assertIn("must be 'admin'", res_farmer.json()["detail"])

        # Machinery provider role (unauthorized)
        payload_provider = {**base_payload, "coordinator_id": self.provider.id}
        res_provider = self.client.post("/api/camps", json=payload_provider)
        self.assertEqual(res_provider.status_code, 400)

        # Buyer role (unauthorized)
        payload_buyer = {**base_payload, "coordinator_id": self.buyer.id}
        res_buyer = self.client.post("/api/camps", json=payload_buyer)
        self.assertEqual(res_buyer.status_code, 400)

    # -------------------------------------------------------------------------
    # 2. Camp Listing, Filtering, and Cancellation Tests
    # -------------------------------------------------------------------------
    def test_05_list_camps_default_upcoming_and_past_filtering(self):
        now = datetime.now(timezone.utc)

        # 1. Past camp (ended 2 days ago)
        c_past = Camp(
            title="Past Literacy Camp",
            description="Completed past workshop on digital tools.",
            scheduled_start=now - timedelta(days=2, hours=3),
            scheduled_end=now - timedelta(days=2),
            venue="Old School",
            district="Ludhiana",
            state="Punjab",
            topics="Past topics",
            is_cancelled=False,
        )
        # 2. Upcoming camp 1 (starts in 2 days)
        c_upcoming1 = Camp(
            title="Upcoming Camp 1",
            description="Upcoming workshop on PM-KISAN.",
            scheduled_start=now + timedelta(days=2),
            scheduled_end=now + timedelta(days=2, hours=3),
            venue="Village Chaupal",
            district="Ludhiana",
            state="Punjab",
            topics="PM-KISAN",
            is_cancelled=False,
        )
        # 3. Upcoming camp 2 (starts in 5 days)
        c_upcoming2 = Camp(
            title="Upcoming Camp 2",
            description="Upcoming workshop on FairQueue machinery.",
            scheduled_start=now + timedelta(days=5),
            scheduled_end=now + timedelta(days=5, hours=4),
            venue="Block Office",
            district="Amritsar",
            state="Punjab",
            topics="Machinery Booking",
            is_cancelled=False,
        )
        # 4. Cancelled upcoming camp
        c_cancelled = Camp(
            title="Cancelled Camp",
            description="Cancelled session due to bad weather.",
            scheduled_start=now + timedelta(days=1),
            scheduled_end=now + timedelta(days=1, hours=2),
            venue="Panchayat Bhawan",
            district="Ludhiana",
            state="Punjab",
            topics="Weather Updates",
            is_cancelled=True,
        )
        self.db.add_all([c_past, c_upcoming1, c_upcoming2, c_cancelled])
        self.db.commit()

        # Default GET /api/camps: should only return the 2 upcoming non-cancelled camps
        res = self.client.get("/api/camps")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["total"], 2)
        titles = [c["title"] for c in data["items"]]
        self.assertIn("Upcoming Camp 1", titles)
        self.assertIn("Upcoming Camp 2", titles)
        self.assertNotIn("Past Literacy Camp", titles)
        self.assertNotIn("Cancelled Camp", titles)
        # Ordered by scheduled_start ascending
        self.assertEqual(titles[0], "Upcoming Camp 1")
        self.assertEqual(titles[1], "Upcoming Camp 2")

        # GET /api/camps?include_past=true: returns past + upcoming, but EXCLUDES cancelled
        res_past = self.client.get("/api/camps?include_past=true")
        self.assertEqual(res_past.status_code, 200)
        data_past = res_past.json()
        self.assertEqual(data_past["total"], 3)
        titles_past = [c["title"] for c in data_past["items"]]
        self.assertIn("Past Literacy Camp", titles_past)
        self.assertIn("Upcoming Camp 1", titles_past)
        self.assertIn("Upcoming Camp 2", titles_past)
        self.assertNotIn("Cancelled Camp", titles_past)

    def test_06_filter_camps_by_district_and_state(self):
        now = datetime.now(timezone.utc)

        c_punjab = Camp(
            title="Punjab Camp",
            description="Digital training in Punjab.",
            scheduled_start=now + timedelta(days=3),
            scheduled_end=now + timedelta(days=3, hours=2),
            venue="Kisan Bhawan",
            district="Patiala",
            state="Punjab",
            topics="Schemes",
            is_cancelled=False,
        )
        c_haryana = Camp(
            title="Haryana Camp",
            description="Digital training in Haryana.",
            scheduled_start=now + timedelta(days=4),
            scheduled_end=now + timedelta(days=4, hours=2),
            venue="Krishi Vigyan Kendra",
            district="Karnal",
            state="Haryana",
            topics="Soil Testing",
            is_cancelled=False,
        )
        self.db.add_all([c_punjab, c_haryana])
        self.db.commit()

        # Filter by state
        res_state = self.client.get("/api/camps?state=haryana")
        self.assertEqual(res_state.status_code, 200)
        data_state = res_state.json()
        self.assertEqual(data_state["total"], 1)
        self.assertEqual(data_state["items"][0]["title"], "Haryana Camp")

        # Filter by district
        res_dist = self.client.get("/api/camps?district=patiala")
        self.assertEqual(res_dist.status_code, 200)
        data_dist = res_dist.json()
        self.assertEqual(data_dist["total"], 1)
        self.assertEqual(data_dist["items"][0]["title"], "Punjab Camp")

    def test_07_camps_pagination(self):
        now = datetime.now(timezone.utc)
        camps = [
            Camp(
                title=f"Camp Page Item {i}",
                description="Pagination testing item.",
                scheduled_start=now + timedelta(days=i),
                scheduled_end=now + timedelta(days=i, hours=2),
                venue="Venue Hall",
                district="Jalandhar",
                state="Punjab",
                topics="General",
                is_cancelled=False,
            )
            for i in range(1, 6)
        ]
        self.db.add_all(camps)
        self.db.commit()

        res_p1 = self.client.get("/api/camps?page=1&page_size=2")
        self.assertEqual(res_p1.status_code, 200)
        data_p1 = res_p1.json()
        self.assertEqual(data_p1["total"], 5)
        self.assertEqual(data_p1["page"], 1)
        self.assertEqual(data_p1["page_size"], 2)
        self.assertEqual(data_p1["total_pages"], 3)
        self.assertEqual(len(data_p1["items"]), 2)
        self.assertEqual(data_p1["items"][0]["title"], "Camp Page Item 1")
        self.assertEqual(data_p1["items"][1]["title"], "Camp Page Item 2")

        res_p3 = self.client.get("/api/camps?page=3&page_size=2")
        self.assertEqual(res_p3.status_code, 200)
        data_p3 = res_p3.json()
        self.assertEqual(len(data_p3["items"]), 1)
        self.assertEqual(data_p3["items"][0]["title"], "Camp Page Item 5")

    # -------------------------------------------------------------------------
    # 3. Next Camp & Single Camp Tests
    # -------------------------------------------------------------------------
    def test_08_get_next_camp_behavior(self):
        now = datetime.now(timezone.utc)

        # 404 when no upcoming camps exist
        res_empty = self.client.get("/api/camps/next")
        self.assertEqual(res_empty.status_code, 404)

        # Add camps: one in the past, one cancelled sooner, one upcoming earliest, one later
        c_past = Camp(
            title="Past Camp",
            description="Already done",
            scheduled_start=now - timedelta(days=1, hours=3),
            scheduled_end=now - timedelta(days=1),
            venue="Old Hall",
            district="Ludhiana",
            state="Punjab",
            topics="Topics",
            is_cancelled=False,
        )
        c_cancelled_soon = Camp(
            title="Cancelled Soonest",
            description="Cancelled",
            scheduled_start=now + timedelta(days=1),
            scheduled_end=now + timedelta(days=1, hours=2),
            venue="Hall 1",
            district="Ludhiana",
            state="Punjab",
            topics="Topics",
            is_cancelled=True,
        )
        c_earliest_upcoming = Camp(
            title="Earliest Valid Upcoming",
            description="The true next camp",
            scheduled_start=now + timedelta(days=2),
            scheduled_end=now + timedelta(days=2, hours=3),
            venue="Community Center",
            district="Ludhiana",
            state="Punjab",
            topics="Digital Schemes",
            is_cancelled=False,
        )
        c_later = Camp(
            title="Later Upcoming",
            description="Scheduled next week",
            scheduled_start=now + timedelta(days=7),
            scheduled_end=now + timedelta(days=7, hours=2),
            venue="Town Hall",
            district="Ludhiana",
            state="Punjab",
            topics="Digital Banking",
            is_cancelled=False,
        )
        self.db.add_all([c_past, c_cancelled_soon, c_earliest_upcoming, c_later])
        self.db.commit()

        # Should return Earliest Valid Upcoming
        res_next = self.client.get("/api/camps/next")
        self.assertEqual(res_next.status_code, 200)
        self.assertEqual(res_next.json()["title"], "Earliest Valid Upcoming")

        # Filter by state where none exists -> 404
        res_none_state = self.client.get("/api/camps/next?state=Rajasthan")
        self.assertEqual(res_none_state.status_code, 404)

        # Filter by matching state -> 200
        res_punjab = self.client.get("/api/camps/next?state=Punjab")
        self.assertEqual(res_punjab.status_code, 200)
        self.assertEqual(res_punjab.json()["title"], "Earliest Valid Upcoming")

    def test_09_get_single_camp_and_404(self):
        now = datetime.now(timezone.utc)
        camp = Camp(
            title="Single Camp Test",
            description="Detailed information about this specific camp.",
            scheduled_start=now + timedelta(days=4),
            scheduled_end=now + timedelta(days=4, hours=3),
            venue="Panchayat Hall",
            village="Samrala",
            district="Ludhiana",
            state="Punjab",
            topics="Direct Benefit Transfer, Kisan Credit Card",
            contact_person="Harinder Kaur",
            contact_phone="9876543200",
            is_cancelled=False,
        )
        self.db.add(camp)
        self.db.commit()
        self.db.refresh(camp)

        # Valid ID
        res = self.client.get(f"/api/camps/{camp.id}")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["id"], camp.id)
        self.assertEqual(data["title"], "Single Camp Test")
        self.assertEqual(data["village"], "Samrala")
        self.assertEqual(data["contact_person"], "Harinder Kaur")

        # Unknown ID
        res_404 = self.client.get("/api/camps/99999")
        self.assertEqual(res_404.status_code, 404)
        self.assertIn("not found", res_404.json()["detail"].lower())

    # -------------------------------------------------------------------------
    # 4. OpenAPI Registration Test
    # -------------------------------------------------------------------------
    def test_10_openapi_contains_camp_routes(self):
        res = self.client.get("/openapi.json")
        self.assertEqual(res.status_code, 200)
        openapi = res.json()
        paths = openapi.get("paths", {})

        self.assertIn("/api/camps", paths)
        self.assertIn("get", paths["/api/camps"])
        self.assertIn("post", paths["/api/camps"])

        self.assertIn("/api/camps/next", paths)
        self.assertIn("get", paths["/api/camps/next"])

        self.assertIn("/api/camps/{camp_id}", paths)
        self.assertIn("get", paths["/api/camps/{camp_id}"])


if __name__ == "__main__":
    unittest.main()
