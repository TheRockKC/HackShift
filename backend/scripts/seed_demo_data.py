"""Idempotent seed script to populate AnnData with rich demo records for all personas.

Creates:
- Demo Users: Farmer, Produce Buyer, Machinery Provider, Coordinator Admin
- Demo Farm for the farmer
- Demo Machinery listings (Tractor, Harvester)
- Demo Upcoming Camp
- Demo Harvest listing

Safety Rules:
- Idempotent: searches by email or name before inserting.
- Safe CLI: defaults to dry-run mode unless --confirm is explicitly passed.
"""

import sys
import argparse
from pathlib import Path
from datetime import datetime, timezone, timedelta, date
from decimal import Decimal

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.farm import Farm
from app.models.machinery import Machinery
from app.models.camp import Camp
from app.models.harvest import Harvest
from app.models.scheme import FarmerProfile


def seed_demo_data(session: Session, dry_run: bool = False):
    inserted_summary = {}

    # 1. Users
    users_data = [
        {
            "name": "Sardar Balvinder Singh",
            "email": "farmer.balvinder@anndata.org",
            "phone": "9876543210",
            "role": "farmer",
        },
        {
            "name": "Karan Traders & Grain Mill",
            "email": "buyer.karan@anndata.org",
            "phone": "9876543211",
            "role": "buyer",
        },
        {
            "name": "Samrala Kisan Custom Hiring Center",
            "email": "provider.samrala@anndata.org",
            "phone": "9876543212",
            "role": "machinery_provider",
        },
        {
            "name": "Dr. Hardeep Sandhu (Agriculture Officer)",
            "email": "admin.sandhu@anndata.org",
            "phone": "9876543213",
            "role": "admin",
        },
    ]

    user_objs = {}
    for u in users_data:
        existing = session.execute(
            select(User).where(User.email == u["email"])
        ).scalar_one_or_none()
        if existing:
            user_objs[u["role"]] = existing
        else:
            if not dry_run:
                new_user = User(**u)
                session.add(new_user)
                session.flush()
                user_objs[u["role"]] = new_user
            inserted_summary[f"user_{u['role']}"] = u["name"]

    # 2. Farm
    farmer = user_objs.get("farmer")
    farm_obj = None
    if farmer:
        existing_farm = session.execute(
            select(Farm).where(Farm.farmer_id == farmer.id)
        ).scalars().first()
        if existing_farm:
            farm_obj = existing_farm
        else:
            if not dry_run:
                new_farm = Farm(
                    farmer_id=farmer.id,
                    name="Golden Fields Agri Farm",
                    state="Punjab",
                    district="Ludhiana",
                    latitude=Decimal("30.9010"),
                    longitude=Decimal("75.8573"),
                    area_acres=Decimal("18.50"),
                )
                session.add(new_farm)
                session.flush()
                farm_obj = new_farm
            inserted_summary["farm"] = "Golden Fields Agri Farm"

    # 3. Farmer Scheme Profile
    if farmer:
        existing_profile = session.execute(
            select(FarmerProfile).where(FarmerProfile.farmer_id == farmer.id)
        ).scalar_one_or_none()
        if not existing_profile and not dry_run:
            new_profile = FarmerProfile(
                farmer_id=farmer.id,
                primary_crop_type="wheat",
                has_irrigation=True,
                has_kcc=False,
                social_category="general",
                gender="male",
            )
            session.add(new_profile)
            inserted_summary["farmer_profile"] = "Farmer Profile Initialized"

    # 4. Machinery
    provider = user_objs.get("machinery_provider")
    if provider:
        machineries = [
            {
                "provider_id": provider.id,
                "equipment_type": "tractor",
                "name": "Mahindra 575 DI (45 HP Tractor)",
                "hourly_rate": Decimal("650.00"),
                "daily_rate": Decimal("4500.00"),
                "state": "Punjab",
                "district": "Ludhiana",
                "is_available": True,
            },
            {
                "provider_id": provider.id,
                "equipment_type": "combine_harvester",
                "name": "Preet 987 Self-Propelled Harvester",
                "hourly_rate": Decimal("1800.00"),
                "daily_rate": Decimal("14000.00"),
                "state": "Punjab",
                "district": "Ludhiana",
                "is_available": True,
            },
        ]
        for m in machineries:
            existing_m = session.execute(
                select(Machinery).where(
                    Machinery.provider_id == provider.id,
                    Machinery.name == m["name"],
                )
            ).scalar_one_or_none()
            if not existing_m:
                if not dry_run:
                    session.add(Machinery(**m))
                inserted_summary[f"machinery_{m['equipment_type']}"] = m["name"]

    # 5. Camp
    admin = user_objs.get("admin")
    if admin:
        camp_title = "Samrala Digital Agriculture & PM-KISAN Camp"
        existing_camp = session.execute(
            select(Camp).where(Camp.title == camp_title)
        ).scalar_one_or_none()
        if not existing_camp:
            start_time = datetime.now(timezone.utc) + timedelta(days=4, hours=10)
            end_time = start_time + timedelta(hours=6)
            if not dry_run:
                new_camp = Camp(
                    title=camp_title,
                    description="Community training on mobile mandi bidding, precision irrigation schedules, and direct government scheme verification.",
                    scheduled_start=start_time,
                    scheduled_end=end_time,
                    venue="Krishi Vigyan Kendra (KVK) Samrala",
                    village="Samrala",
                    district="Ludhiana",
                    state="Punjab",
                    topics="CropClock, FairQueue, WaterWindow, SchemeSaathi",
                    contact_person="Dr. Hardeep Sandhu",
                    contact_phone="+91 98765 43213",
                    is_cancelled=False,
                )
                session.add(new_camp)
            inserted_summary["camp"] = camp_title

    # 6. Harvest Listing
    if farmer and farm_obj:
        existing_h = session.execute(
            select(Harvest).where(
                Harvest.farm_id == farm_obj.id,
                Harvest.crop == "Sharbati Wheat",
            )
        ).scalar_one_or_none()
        if not existing_h:
            if not dry_run:
                new_harvest = Harvest(
                    farm_id=farm_obj.id,
                    crop="Sharbati Wheat",
                    quantity_kg=Decimal("3500.00"),
                    expected_harvest_date=date.today() + timedelta(days=12),
                    quality_grade="Grade A",
                    status="available",
                )
                session.add(new_harvest)
            inserted_summary["harvest"] = "Sharbati Wheat"

    if not dry_run:
        session.commit()

    return inserted_summary


def main():
    parser = argparse.ArgumentParser(description="Seed demo data for AnnData.")
    parser.add_argument(
        "--confirm",
        action="store_true",
        help="Execute confirmed database seeding. Defaults to dry-run mode.",
    )
    args = parser.parse_args()

    from app.database import SessionLocal

    if not args.confirm:
        print("DRY-RUN: Inspecting demo data seeding...")
        with SessionLocal() as db:
            preview = seed_demo_data(db, dry_run=True)
            print("Items to insert:", preview)
            print("Run with --confirm to commit to the database.")
        return

    print("Seeding confirmed demo records...")
    with SessionLocal() as db:
        result = seed_demo_data(db, dry_run=False)
        print("Demo seeding complete. Changes applied:", result)


if __name__ == "__main__":
    main()
