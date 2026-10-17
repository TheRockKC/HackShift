import unittest
from datetime import datetime, date, timezone
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.user import User
from app.models.farm import Farm
from app.models.scheme import Scheme, FarmerProfile


class SchemeSaathiIsolatedTests(unittest.TestCase):
    """Isolated tests for SchemeSaathi government scheme discovery and profile matching.

    Uses an isolated SQLite in-memory database with StaticPool to ensure zero pollution
    or destructive operations against the live Neon database.
    """

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
        # Seed users with different roles
        self.farmer1 = User(
            name="Balwinder Singh",
            email="balwinder@kisan.test",
            phone="9876543201",
            role="farmer",
        )
        self.farmer2 = User(
            name="Sunita Devi",
            email="sunita@kisan.test",
            phone="9876543202",
            role="farmer",
        )
        self.buyer = User(
            name="Deepak Buyer",
            email="deepak@buyer.test",
            phone="9876543203",
            role="buyer",
        )
        self.admin = User(
            name="Official Admin",
            email="admin@gov.test",
            phone="9876543204",
            role="admin",
        )
        self.db.add_all([self.farmer1, self.farmer2, self.buyer, self.admin])
        self.db.commit()
        for u in (self.farmer1, self.farmer2, self.buyer, self.admin):
            self.db.refresh(u)

    def tearDown(self):
        self.db.query(FarmerProfile).delete()
        self.db.query(Farm).delete()
        self.db.query(Scheme).delete()
        self.db.query(User).delete()
        self.db.commit()
        self.db.close()

    # -------------------------------------------------------------------------
    # 1. Scheme Catalogue Endpoints (Listing, Filtering, Details, Inactive)
    # -------------------------------------------------------------------------
    def test_01_list_schemes_and_filtering(self):
        # Seed schemes
        s1 = Scheme(
            slug="pm-kisan",
            name="PM-KISAN Samman Nidhi",
            short_description="Direct income support of Rs 6000 per year for landholding farmers.",
            benefits_summary="Three equal installments of Rs 2000 transferred directly to bank account.",
            category="direct_income_support",
            nodal_ministry="Ministry of Agriculture & Farmers Welfare",
            state_applicability="All India",
            official_portal_url="https://pmkisan.gov.in",
            verification_date=date(2026, 1, 15),
            is_active=True,
        )
        s2 = Scheme(
            slug="kcc-crop-loan",
            name="Kisan Credit Card Concessional Loan",
            short_description="Subsidized institutional credit up to Rs 3 Lakh at 4% effective interest.",
            benefits_summary="Short-term credit for crop cultivation and post-harvest expenses.",
            category="credit",
            nodal_ministry="Ministry of Finance / NABARD",
            state_applicability="All India",
            official_portal_url="https://www.myscheme.gov.in/schemes/kcc",
            verification_date=date(2026, 2, 1),
            is_active=True,
        )
        s3 = Scheme(
            slug="punjab-submersible-subsidy",
            name="Punjab Solar Submersible Pump Scheme",
            short_description="80% capital subsidy on standalone solar agriculture pumps in Punjab.",
            benefits_summary="Subsidy on 3HP to 7.5HP solar pumps for irrigation.",
            category="irrigation",
            nodal_ministry="Punjab Energy Development Agency (PEDA)",
            state_applicability="Punjab",
            official_portal_url="https://peda.gov.in",
            verification_date=date(2026, 3, 10),
            is_active=True,
        )
        s4 = Scheme(
            slug="archived-scheme",
            name="Expired Scheme 2024",
            short_description="An inactive pilot scheme from previous cycle.",
            benefits_summary="Discontinued benefits.",
            category="subsidy",
            nodal_ministry="Ministry of Agriculture",
            state_applicability="All India",
            official_portal_url="https://example.gov.in/expired",
            verification_date=date(2024, 1, 1),
            is_active=False,  # Inactive scheme
        )
        self.db.add_all([s1, s2, s3, s4])
        self.db.commit()

        # 1. Default list: should only return the 3 active schemes
        res = self.client.get("/api/schemes")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["total"], 3)
        slugs = [s["slug"] for s in data["items"]]
        self.assertIn("pm-kisan", slugs)
        self.assertIn("kcc-crop-loan", slugs)
        self.assertIn("punjab-submersible-subsidy", slugs)
        self.assertNotIn("archived-scheme", slugs)

        # 2. Filter by state "Punjab": returns All India schemes AND Punjab schemes
        res_state = self.client.get("/api/schemes?state=Punjab")
        self.assertEqual(res_state.status_code, 200)
        data_state = res_state.json()
        self.assertEqual(data_state["total"], 3)  # 2 All India + 1 Punjab

        # 3. Filter by state "Maharashtra": returns ONLY All India schemes
        res_mh = self.client.get("/api/schemes?state=Maharashtra")
        self.assertEqual(res_mh.status_code, 200)
        self.assertEqual(res_mh.json()["total"], 2)

        # 4. Filter by category "credit"
        res_cat = self.client.get("/api/schemes?category=credit")
        self.assertEqual(res_cat.status_code, 200)
        self.assertEqual(res_cat.json()["total"], 1)
        self.assertEqual(res_cat.json()["items"][0]["slug"], "kcc-crop-loan")

        # 5. Search query "solar"
        res_q = self.client.get("/api/schemes?q=solar")
        self.assertEqual(res_q.status_code, 200)
        self.assertEqual(res_q.json()["total"], 1)
        self.assertEqual(res_q.json()["items"][0]["slug"], "punjab-submersible-subsidy")

        # 6. Pagination
        res_page = self.client.get("/api/schemes?page=1&page_size=2")
        self.assertEqual(res_page.status_code, 200)
        p_data = res_page.json()
        self.assertEqual(len(p_data["items"]), 2)
        self.assertEqual(p_data["total"], 3)
        self.assertEqual(p_data["total_pages"], 2)

    def test_02_get_single_scheme_and_inactive_404(self):
        active = Scheme(
            slug="active-scheme",
            name="Active Test Scheme",
            short_description="Active test description",
            benefits_summary="Active benefits",
            category="insurance",
            nodal_ministry="MoA",
            state_applicability="All India",
            official_portal_url="https://portal.test",
            verification_date=date(2026, 1, 1),
            is_active=True,
        )
        inactive = Scheme(
            slug="inactive-scheme",
            name="Inactive Test Scheme",
            short_description="Inactive test description",
            benefits_summary="Inactive benefits",
            category="insurance",
            nodal_ministry="MoA",
            state_applicability="All India",
            official_portal_url="https://portal.test",
            verification_date=date(2026, 1, 1),
            is_active=False,
        )
        self.db.add_all([active, inactive])
        self.db.commit()
        self.db.refresh(active)
        self.db.refresh(inactive)

        # 1. Active scheme returns 200
        res = self.client.get(f"/api/schemes/{active.id}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["slug"], "active-scheme")
        self.assertEqual(res.json()["official_portal_url"], "https://portal.test")

        # 2. Inactive scheme returns 404
        res_inactive = self.client.get(f"/api/schemes/{inactive.id}")
        self.assertEqual(res_inactive.status_code, 404)

        # 3. Non-existent scheme returns 404
        res_404 = self.client.get("/api/schemes/99999")
        self.assertEqual(res_404.status_code, 404)

    # -------------------------------------------------------------------------
    # 2. Farmer Profile Create / Update (Upsert) Tests
    # -------------------------------------------------------------------------
    def test_03_farmer_profile_create_update_and_role_validation(self):
        # 1. Non-existent user -> 404
        res_404 = self.client.put("/api/farmer/99999/profile", json={"has_kcc": True})
        self.assertEqual(res_404.status_code, 404)

        # 2. Buyer user (non-farmer role) -> 400
        res_buyer = self.client.put(f"/api/farmer/{self.buyer.id}/profile", json={"has_kcc": True})
        self.assertEqual(res_buyer.status_code, 400)
        self.assertIn("must be 'farmer'", res_buyer.json()["detail"])

        # 3. Create profile for farmer1 (all optional fields allowed to be omitted)
        create_payload = {
            "primary_crop_type": "cereals",
            "has_irrigation": True,
            "has_kcc": False,
            "social_category": "obc",
            "gender": "male",
        }
        res_create = self.client.put(f"/api/farmer/{self.farmer1.id}/profile", json=create_payload)
        self.assertEqual(res_create.status_code, 200)
        data = res_create.json()
        self.assertEqual(data["farmer_id"], self.farmer1.id)
        self.assertEqual(data["primary_crop_type"], "cereals")
        self.assertEqual(data["social_category"], "obc")
        self.assertEqual(data["gender"], "male")
        self.assertEqual(data["has_irrigation"], True)
        self.assertEqual(data["has_kcc"], False)

        # 4. Update profile (upsert modification)
        update_payload = {
            "has_kcc": True,
            "primary_crop_type": "horticulture",
        }
        res_update = self.client.put(f"/api/farmer/{self.farmer1.id}/profile", json=update_payload)
        self.assertEqual(res_update.status_code, 200)
        data_up = res_update.json()
        self.assertEqual(data_up["has_kcc"], True)
        self.assertEqual(data_up["primary_crop_type"], "horticulture")
        # Existing attributes should be preserved
        self.assertEqual(data_up["social_category"], "obc")
        self.assertEqual(data_up["gender"], "male")

        # 5. Invalid social category -> 422
        res_invalid_sc = self.client.put(
            f"/api/farmer/{self.farmer1.id}/profile",
            json={"social_category": "invalid_category"},
        )
        self.assertEqual(res_invalid_sc.status_code, 422)

        # 6. Invalid gender -> 422
        res_invalid_g = self.client.put(
            f"/api/farmer/{self.farmer1.id}/profile",
            json={"gender": "invalid_gender"},
        )
        self.assertEqual(res_invalid_g.status_code, 422)

    # -------------------------------------------------------------------------
    # 3. Scheme Matching Logic Tests
    # -------------------------------------------------------------------------
    def test_04_matching_without_profile_returns_advice_and_potential_matches(self):
        # Seed an All India scheme
        s = Scheme(
            slug="nationwide-scheme",
            name="National Crop Insurance",
            short_description="Pradhan Mantri Fasal Bima Yojana",
            benefits_summary="Comprehensive risk insurance for crop loss",
            category="insurance",
            nodal_ministry="MoA",
            state_applicability="All India",
            official_portal_url="https://pmfby.gov.in",
            verification_date=date(2026, 1, 1),
            is_active=True,
        )
        self.db.add(s)
        self.db.commit()

        # farmer2 has no profile and no registered farms
        res = self.client.get(f"/api/schemes/farmer/{self.farmer2.id}/matches")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["farmer_id"], self.farmer2.id)
        self.assertEqual(data["profile_exists"], False)
        self.assertIsNotNone(data["profile_advice"])
        self.assertIn("PUT /api/farmer/", data["profile_advice"])
        self.assertIn("DISCLAIMER", data["disclaimer"])
        self.assertEqual(len(data["matches"]), 1)
        self.assertEqual(data["matches"][0]["match_status"], "potential_match")
        self.assertIn("All India", data["matches"][0]["match_reasons"][0])

    def test_05_matching_state_and_landholding_rules(self):
        # 1. Register two farms for farmer1 in Punjab: total area = 2.0 + 3.0 = 5.0 acres
        f1 = Farm(
            farmer_id=self.farmer1.id,
            name="North Farm",
            state="Punjab",
            district="Ludhiana",
            area_acres=Decimal("2.00"),
        )
        f2 = Farm(
            farmer_id=self.farmer1.id,
            name="South Farm",
            state="Punjab",
            district="Ludhiana",
            area_acres=Decimal("3.00"),
        )
        self.db.add_all([f1, f2])

        # 2. Scheme A: Punjab only, max land 5.0 acres (farmer has 5.0 acres total -> should match!)
        s_punjab_marginal = Scheme(
            slug="punjab-marginal-farmer",
            name="Punjab Small & Marginal Assistance",
            short_description="Targeted support for holdings <= 5 acres",
            benefits_summary="Subsidized inputs",
            category="subsidy",
            nodal_ministry="Punjab Agriculture Dept",
            state_applicability="Punjab",
            max_land_acres=Decimal("5.00"),
            official_portal_url="https://agri.punjab.gov.in",
            verification_date=date(2026, 1, 1),
            is_active=True,
        )

        # 3. Scheme B: Punjab only, max land 2.0 acres (farmer total holding is 5.0 -> excluded!)
        s_micro_only = Scheme(
            slug="punjab-micro-only",
            name="Punjab Micro Farmer Grant",
            short_description="Grant for micro holdings <= 2 acres",
            benefits_summary="Direct micro grant",
            category="grant",
            nodal_ministry="Punjab Agriculture Dept",
            state_applicability="Punjab",
            max_land_acres=Decimal("2.00"),
            official_portal_url="https://agri.punjab.gov.in",
            verification_date=date(2026, 1, 1),
            is_active=True,
        )

        # 4. Scheme C: Haryana only (farmer farms are in Punjab -> excluded!)
        s_haryana_only = Scheme(
            slug="haryana-bhavantar",
            name="Haryana Bhavantar Bharpayee Yojana",
            short_description="Price deficit compensation in Haryana",
            benefits_summary="Deficit payout",
            category="compensation",
            nodal_ministry="Haryana Agri Marketing Board",
            state_applicability="Haryana",
            official_portal_url="https://agriharyana.gov.in",
            verification_date=date(2026, 1, 1),
            is_active=True,
        )

        # 5. Scheme D: All India (should match!)
        s_all_india = Scheme(
            slug="soil-health-card",
            name="National Soil Health Scheme",
            short_description="Free soil testing",
            benefits_summary="Nutrient advisory",
            category="soil",
            nodal_ministry="MoA",
            state_applicability="All India",
            official_portal_url="https://soilhealth.dac.gov.in",
            verification_date=date(2026, 1, 1),
            is_active=True,
        )

        self.db.add_all([s_punjab_marginal, s_micro_only, s_haryana_only, s_all_india])
        self.db.commit()

        # Execute matches
        res = self.client.get(f"/api/schemes/farmer/{self.farmer1.id}/matches")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["total_registered_farms"], 2)
        self.assertEqual(Decimal(str(data["total_registered_acres"])), Decimal("5.00"))

        matched_slugs = [m["slug"] for m in data["matches"]]
        self.assertIn("punjab-marginal-farmer", matched_slugs)
        self.assertIn("soil-health-card", matched_slugs)
        self.assertNotIn("punjab-micro-only", matched_slugs, "Should be excluded due to exceeding 2.0 acre cap")
        self.assertNotIn("haryana-bhavantar", matched_slugs, "Should be excluded due to state mismatch")

        # Verify documentation of total landholding basis
        marginal_match = next(m for m in data["matches"] if m["slug"] == "punjab-marginal-farmer")
        self.assertIn("Aggregated total area across 2 registered farm(s)", marginal_match["landholding_calculation_basis"])
        self.assertEqual(Decimal(str(marginal_match["total_landholding_considered_acres"])), Decimal("5.00"))

    def test_06_matching_gender_social_category_and_unknown_handling(self):
        # Scheme 1: Targets female farmers exclusively
        s_women = Scheme(
            slug="mahila-kisan-sashaktikaran",
            name="Mahila Kisan Sashaktikaran Pariyojana",
            short_description="Empowerment of women in agriculture",
            benefits_summary="Training and financial grants for women farmers",
            category="empowerment",
            nodal_ministry="Ministry of Rural Development",
            state_applicability="All India",
            target_gender="female",
            official_portal_url="https://aajeevika.gov.in",
            verification_date=date(2026, 1, 1),
            is_active=True,
        )

        # Scheme 2: Targets SC / ST farmers
        s_sc_st = Scheme(
            slug="tribal-special-central-assistance",
            name="Special Central Assistance to Tribal Sub-Scheme",
            short_description="Agricultural livelihoods for SC and ST farmers",
            benefits_summary="100% grant for farm inputs",
            category="grant",
            nodal_ministry="Ministry of Tribal Affairs",
            state_applicability="All India",
            target_social_categories="sc,st",
            official_portal_url="https://tribal.nic.in",
            verification_date=date(2026, 1, 1),
            is_active=True,
        )

        self.db.add_all([s_women, s_sc_st])
        self.db.commit()

        # Case A: farmer2 has profile with gender='female' and social_category='sc'
        p_female_sc = FarmerProfile(
            farmer_id=self.farmer2.id,
            gender="female",
            social_category="sc",
            primary_crop_type="cereals",
        )
        self.db.add(p_female_sc)
        self.db.commit()

        res_female = self.client.get(f"/api/schemes/farmer/{self.farmer2.id}/matches")
        self.assertEqual(res_female.status_code, 200)
        slugs_female = [m["slug"] for m in res_female.json()["matches"]]
        self.assertIn("mahila-kisan-sashaktikaran", slugs_female)
        self.assertIn("tribal-special-central-assistance", slugs_female)

        # Case B: farmer1 has profile with gender='male' and social_category='general'
        p_male_gen = FarmerProfile(
            farmer_id=self.farmer1.id,
            gender="male",
            social_category="general",
        )
        self.db.add(p_male_gen)
        self.db.commit()

        res_male = self.client.get(f"/api/schemes/farmer/{self.farmer1.id}/matches")
        self.assertEqual(res_male.status_code, 200)
        slugs_male = [m["slug"] for m in res_male.json()["matches"]]
        self.assertNotIn("mahila-kisan-sashaktikaran", slugs_male, "Excluded because profile gender is male")
        self.assertNotIn("tribal-special-central-assistance", slugs_male, "Excluded because profile category is general")

        # Case C: Unknown attributes do NOT exclude!
        # Delete farmer1 profile and test that schemes with targeted gender/category are retained with missing_information
        self.db.delete(p_male_gen)
        self.db.commit()

        res_unknown = self.client.get(f"/api/schemes/farmer/{self.farmer1.id}/matches")
        self.assertEqual(res_unknown.status_code, 200)
        unknown_matches = {m["slug"]: m for m in res_unknown.json()["matches"]}
        self.assertIn("mahila-kisan-sashaktikaran", unknown_matches)
        self.assertIn("tribal-special-central-assistance", unknown_matches)
        self.assertTrue(any("female" in info for info in unknown_matches["mahila-kisan-sashaktikaran"]["missing_information"]))
        self.assertTrue(any("sc,st" in info for info in unknown_matches["tribal-special-central-assistance"]["missing_information"]))

    def test_07_openapi_contains_schemesaathi_routes(self):
        res = self.client.get("/openapi.json")
        self.assertEqual(res.status_code, 200)
        paths = res.json().get("paths", {})

        self.assertIn("/api/schemes", paths)
        self.assertIn("get", paths["/api/schemes"])

        self.assertIn("/api/schemes/{scheme_id}", paths)
        self.assertIn("get", paths["/api/schemes/{scheme_id}"])

        self.assertIn("/api/farmer/{farmer_id}/profile", paths)
        self.assertIn("put", paths["/api/farmer/{farmer_id}/profile"])

        self.assertIn("/api/schemes/farmer/{farmer_id}/matches", paths)
        self.assertIn("get", paths["/api/schemes/farmer/{farmer_id}/matches"])


if __name__ == "__main__":
    unittest.main()
