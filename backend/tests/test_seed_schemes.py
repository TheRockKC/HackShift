import unittest
from datetime import date
from decimal import Decimal

from sqlalchemy import create_engine, select, func
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.main import app
from app.database import Base, get_db
from app.models.scheme import Scheme
from app.models.user import User
from app.models.farm import Farm
from scripts.seed_schemes import seed_schemes, GENUINE_GOVERNMENT_SCHEMES


class SeedSchemesIsolatedTests(unittest.TestCase):
    """Isolated tests verifying the idempotent seed script on an isolated SQLite in-memory database."""

    @classmethod
    def setUpClass(cls):
        # Guarantee strict SQLite in-memory isolation
        cls.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        assert cls.engine.url.drivername == "sqlite", "Engine dialect must be SQLite"
        assert cls.engine.url.database == ":memory:", "Engine must point to in-memory database"

        cls.TestingSessionLocal = sessionmaker(
            bind=cls.engine,
            autocommit=False,
            autoflush=False,
            expire_on_commit=False,
        )
        Base.metadata.create_all(bind=cls.engine)

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
        Base.metadata.drop_all(bind=cls.engine)

    def setUp(self):
        self.db = self.TestingSessionLocal()

    def tearDown(self):
        self.db.query(Scheme).delete()
        self.db.query(Farm).delete()
        self.db.query(User).delete()
        self.db.commit()
        self.db.close()

    def test_01_dry_run_does_not_mutate_database(self):
        # Dry-run execution
        preview = seed_schemes(self.db, dry_run=True)
        self.assertEqual(len(preview["inserted"]), len(GENUINE_GOVERNMENT_SCHEMES))
        self.assertEqual(len(preview["already_exists"]), 0)

        # Database must still have 0 records
        count = self.db.scalar(select(func.count(Scheme.id)))
        self.assertEqual(count, 0)

    def test_02_first_run_inserts_all_genuine_schemes(self):
        result = seed_schemes(self.db, dry_run=False)

        self.assertEqual(len(result["inserted"]), len(GENUINE_GOVERNMENT_SCHEMES))
        self.assertEqual(len(result["already_exists"]), 0)

        total = self.db.scalar(select(func.count(Scheme.id)))
        self.assertEqual(total, len(GENUINE_GOVERNMENT_SCHEMES))

        # Verify attributes on PM-KISAN
        pm_kisan = self.db.scalar(select(Scheme).where(Scheme.slug == "pm-kisan"))
        self.assertIsNotNone(pm_kisan)
        self.assertEqual(pm_kisan.official_portal_url, "https://pmkisan.gov.in")
        self.assertEqual(pm_kisan.state_applicability, "All India")
        self.assertEqual(pm_kisan.verification_date, date(2026, 10, 18))
        self.assertTrue(pm_kisan.is_active)
        self.assertIn("eKYC", pm_kisan.benefits_summary)
        self.assertIsNone(pm_kisan.min_land_acres)
        self.assertIsNone(pm_kisan.max_land_acres)
        self.assertIsNone(pm_kisan.target_gender)
        self.assertIsNone(pm_kisan.target_social_categories)

        # Verify attributes on PMFBY
        pmfby = self.db.scalar(select(Scheme).where(Scheme.slug == "pmfby"))
        self.assertIsNotNone(pmfby)
        self.assertEqual(pmfby.official_portal_url, "https://pmfby.gov.in")
        self.assertEqual(pmfby.category, "crop_insurance")
        self.assertIn("Voluntary", pmfby.benefits_summary)

        # Verify attributes on SMAM
        smam = self.db.scalar(select(Scheme).where(Scheme.slug == "smam"))
        self.assertIsNotNone(smam)
        self.assertEqual(smam.official_portal_url, "https://agrimachinery.nic.in")
        self.assertEqual(smam.category, "machinery_subsidy")

        # Verify attributes on KCC (revised 2025 limit of ₹2.0 Lakh)
        kcc = self.db.scalar(select(Scheme).where(Scheme.slug == "kisan-credit-card"))
        self.assertIsNotNone(kcc)
        self.assertEqual(kcc.official_portal_url, "https://www.myscheme.gov.in/schemes/kisan-credit-card")
        self.assertEqual(kcc.category, "credit")
        self.assertIn("2.0 Lakh", kcc.benefits_summary)

    def test_03_idempotency_second_run_does_not_duplicate(self):
        # 1st run
        res1 = seed_schemes(self.db, dry_run=False)
        self.assertEqual(len(res1["inserted"]), len(GENUINE_GOVERNMENT_SCHEMES))

        count_after_first = self.db.scalar(select(func.count(Scheme.id)))

        # 2nd run
        res2 = seed_schemes(self.db, dry_run=False)
        self.assertEqual(len(res2["inserted"]), 0)
        self.assertEqual(len(res2["already_exists"]), len(GENUINE_GOVERNMENT_SCHEMES))

        count_after_second = self.db.scalar(select(func.count(Scheme.id)))
        self.assertEqual(count_after_first, count_after_second)

    def test_04_preserves_pre_existing_unrelated_schemes(self):
        # Insert a pre-existing custom scheme
        pre_existing = Scheme(
            slug="custom-state-grant",
            name="State Dairy Grant",
            short_description="Pre-existing grant",
            benefits_summary="Grant benefits",
            category="dairy",
            nodal_ministry="State Animal Husbandry",
            state_applicability="Punjab",
            official_portal_url="https://state.test/dairy",
            verification_date=date(2026, 1, 1),
            is_active=True,
        )
        self.db.add(pre_existing)
        self.db.commit()

        # Run seed
        result = seed_schemes(self.db, dry_run=False)
        self.assertEqual(len(result["inserted"]), len(GENUINE_GOVERNMENT_SCHEMES))

        # Verify pre-existing scheme is untouched
        found = self.db.scalar(select(Scheme).where(Scheme.slug == "custom-state-grant"))
        self.assertIsNotNone(found)
        self.assertEqual(found.name, "State Dairy Grant")

        total = self.db.scalar(select(func.count(Scheme.id)))
        self.assertEqual(total, len(GENUINE_GOVERNMENT_SCHEMES) + 1)

    def test_05_seeded_schemes_accessible_via_api_and_matching(self):
        seed_schemes(self.db, dry_run=False)

        # 1. API catalogue check
        res = self.client.get("/api/schemes")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["total"], len(GENUINE_GOVERNMENT_SCHEMES))

        # 2. Farmer matching check
        farmer = User(
            name="Mohan Lal",
            email="mohan@kisan.test",
            phone="9876543299",
            role="farmer",
        )
        self.db.add(farmer)
        self.db.commit()
        self.db.refresh(farmer)

        farm = Farm(
            farmer_id=farmer.id,
            name="Main Farm",
            state="Haryana",
            district="Sirsa",
            area_acres=Decimal("3.50"),
        )
        self.db.add(farm)
        self.db.commit()

        matches_res = self.client.get(f"/api/schemes/farmer/{farmer.id}/matches")
        self.assertEqual(matches_res.status_code, 200)
        matches_data = matches_res.json()
        matched_slugs = [m["slug"] for m in matches_data["matches"]]

        # All 4 nationwide genuine schemes should match for Mohan Lal
        self.assertIn("pm-kisan", matched_slugs)
        self.assertIn("pmfby", matched_slugs)
        self.assertIn("smam", matched_slugs)
        self.assertIn("kisan-credit-card", matched_slugs)


if __name__ == "__main__":
    unittest.main()
