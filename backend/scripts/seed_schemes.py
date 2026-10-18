"""Idempotent seed script to populate SchemeSaathi catalogue with verified official government schemes.

Safety Rules:
- Idempotent: checks for existing schemes by unique `slug` before inserting.
- Safe: does NOT delete, overwrite, or truncate existing records.
- Safe CLI: defaults to dry-run mode unless --confirm is explicitly passed.
- Verified: populated only from official government portals and gazettes.
"""

import sys
import argparse
from pathlib import Path
from datetime import date
from decimal import Decimal
from typing import List, Dict, Any

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.scheme import Scheme


GENUINE_GOVERNMENT_SCHEMES: List[Dict[str, Any]] = [
    {
        "slug": "pm-kisan",
        "name": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
        "short_description": "Central sector direct income support scheme providing ₹6,000 annually to all landholding farmer families across India.",
        "benefits_summary": "₹6,000 per year transferred via Direct Benefit Transfer (DBT) in three equal 4-monthly installments of ₹2,000 to Aadhaar-linked bank accounts. Requires land-record seeding and completion of biometric/OTP eKYC on the PM-KISAN portal.",
        "category": "direct_income_support",
        "nodal_ministry": "Ministry of Agriculture and Farmers Welfare",
        "state_applicability": "All India",
        "min_land_acres": None,  # Open to all cultivable landholding farmer families since June 2019 cabinet expansion
        "max_land_acres": None,  # No upper acreage limit in central guidelines
        "target_gender": None,   # Open to all eligible farmer family heads
        "target_social_categories": None,  # Open to all social categories
        "official_portal_url": "https://pmkisan.gov.in",
        "verification_date": date(2026, 10, 18),
        "is_active": True,
    },
    {
        "slug": "pmfby",
        "name": "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
        "short_description": "Comprehensive yield-based crop insurance protecting farmers against non-preventable natural calamities, pests, and adverse weather conditions.",
        "benefits_summary": "Voluntary crop insurance for all farmers. Farmer premium is capped at 2.0% for Kharif food/oilseed crops, 1.5% for Rabi food/oilseed crops, and 5.0% for commercial/horticultural crops. Balance premium is subsidized equally by Central and State Governments.",
        "category": "crop_insurance",
        "nodal_ministry": "Ministry of Agriculture and Farmers Welfare",
        "state_applicability": "All India",
        "min_land_acres": None,  # Covers all farmers including sharecroppers and tenant farmers
        "max_land_acres": None,  # No acreage cap
        "target_gender": None,   # Open to all genders
        "target_social_categories": None,  # Open to all categories
        "official_portal_url": "https://pmfby.gov.in",
        "verification_date": date(2026, 10, 18),
        "is_active": True,
    },
    {
        "slug": "smam",
        "name": "Sub-Mission on Agricultural Mechanization (SMAM)",
        "short_description": "Centrally sponsored mission promoting farm mechanization and modern agricultural machinery adoption via capital subsidies.",
        "benefits_summary": "Financial assistance of 40% to 50% on purchase of approved agricultural machinery (tractors, power tillers, harvesters, laser levelers), with enhanced assistance of up to 50% for SC/ST, small/marginal, and women farmers, and up to 80% for establishment of Custom Hiring Centres (CHCs).",
        "category": "machinery_subsidy",
        "nodal_ministry": "Ministry of Agriculture and Farmers Welfare",
        "state_applicability": "All India",
        "min_land_acres": None,  # Open to individual farmers and groups; differentiated subsidy slabs handled in operational guidelines
        "max_land_acres": None,  # No hard acreage gate
        "target_gender": None,   # Open to all; women receive enhanced subsidy tier
        "target_social_categories": None,  # Open to all; SC/ST receive enhanced subsidy tier
        "official_portal_url": "https://agrimachinery.nic.in",
        "verification_date": date(2026, 10, 18),
        "is_active": True,
    },
]


def seed_schemes(session: Session, dry_run: bool = False) -> Dict[str, List[str]]:
    """Idempotently seed the schemes into the database session.

    Args:
        session: Active SQLAlchemy Session.
        dry_run: If True, inspects database state and reports actions without adding or committing rows.

    Returns:
        Dict with 'inserted' and 'already_exists' lists of scheme slugs.
    """
    inserted: List[str] = []
    already_exists: List[str] = []

    for item in GENUINE_GOVERNMENT_SCHEMES:
        slug = item["slug"]
        existing = session.scalar(select(Scheme).where(Scheme.slug == slug))
        if existing:
            already_exists.append(slug)
        else:
            if not dry_run:
                scheme = Scheme(**item)
                session.add(scheme)
            inserted.append(slug)

    if not dry_run and inserted:
        session.commit()

    return {
        "inserted": inserted,
        "already_exists": already_exists,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Seed verified government schemes into SchemeSaathi catalogue."
    )
    parser.add_argument(
        "--confirm",
        action="store_true",
        help="Explicitly confirm live database execution. Defaults to dry-run if omitted.",
    )
    args = parser.parse_args()

    from app.database import SessionLocal

    if not args.confirm:
        print("=" * 70)
        print("DRY-RUN MODE: No changes will be written to the database.")
        print("To execute live seeding, rerun with the --confirm flag.")
        print("=" * 70)
        with SessionLocal() as db:
            preview = seed_schemes(db, dry_run=True)
            print(f"Would insert: {preview['inserted']}")
            print(f"Already present: {preview['already_exists']}")
        return

    print("Executing confirmed scheme seed against database...")
    with SessionLocal() as db:
        result = seed_schemes(db, dry_run=False)
        print(f"Seed complete. Inserted: {result['inserted']}, Already existed: {result['already_exists']}")


if __name__ == "__main__":
    main()
