import math
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, List, Set

from fastapi import HTTPException, status
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.farm import Farm
from app.models.scheme import Scheme, FarmerProfile
from app.schemas.scheme import (
    SchemeResponse,
    PaginatedSchemesResponse,
    FarmerProfileUpdate,
    FarmerProfileResponse,
    SchemeMatchItem,
    FarmerSchemeMatchesResponse,
)


# -----------------------------------------------------------------------------
# Scheme Catalogue Services
# -----------------------------------------------------------------------------

def list_schemes(
    db: Session,
    state: Optional[str] = None,
    category: Optional[str] = None,
    q: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> PaginatedSchemesResponse:
    """Browse active government schemes with optional state, category, and text search filters.

    - By default, only active schemes (`is_active = True`) are returned.
    - If `state` filter is supplied, returns schemes with `state_applicability == 'All India'`
      OR where `state_applicability` contains the given state name.
    - Supports standard pagination with `page` and `page_size`.
    """
    stmt = select(Scheme).where(Scheme.is_active.is_(True))

    if state and state.strip():
        state_clean = state.strip()
        stmt = stmt.where(
            or_(
                Scheme.state_applicability.ilike("All India"),
                Scheme.state_applicability.ilike(f"%{state_clean}%"),
            )
        )

    if category and category.strip():
        stmt = stmt.where(Scheme.category.ilike(f"%{category.strip()}%"))

    if q and q.strip():
        term = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Scheme.name.ilike(term),
                Scheme.short_description.ilike(term),
                Scheme.benefits_summary.ilike(term),
            )
        )

    # Compute total count
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.scalar(count_stmt) or 0

    # Apply ordering and pagination
    stmt = stmt.order_by(Scheme.name.asc(), Scheme.id.asc())
    offset = (page - 1) * page_size
    schemes = db.scalars(stmt.offset(offset).limit(page_size)).all()

    total_pages = math.ceil(total / page_size) if total > 0 else 0

    return PaginatedSchemesResponse(
        items=[SchemeResponse.model_validate(s) for s in schemes],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


def get_scheme_by_id(db: Session, scheme_id: int) -> SchemeResponse:
    """Return full details of an active scheme.

    Returns 404 if the scheme does not exist or is marked inactive.
    """
    scheme = db.get(Scheme, scheme_id)
    if not scheme or not scheme.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Active scheme with ID {scheme_id} not found",
        )

    return SchemeResponse.model_validate(scheme)


# -----------------------------------------------------------------------------
# Farmer Profile Services
# -----------------------------------------------------------------------------

def upsert_farmer_profile(
    db: Session,
    farmer_id: int,
    data: FarmerProfileUpdate,
) -> FarmerProfileResponse:
    """Create or update a farmer's SchemeSaathi profile (upsert).

    - Verifies user exists and possesses the 'farmer' role.
    - Updates only specified fields, preserving existing attributes for unspecified ones.
    - Does not collect or require sensitive personally identifiable information.
    """
    user = db.get(User, farmer_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {farmer_id} not found",
        )

    if user.role != "farmer":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User {farmer_id} has role '{user.role}', but must be 'farmer' to update farmer profile",
        )

    profile = db.scalar(select(FarmerProfile).where(FarmerProfile.farmer_id == farmer_id))

    if profile is None:
        profile = FarmerProfile(
            farmer_id=farmer_id,
            primary_crop_type=data.primary_crop_type.strip() if data.primary_crop_type else None,
            has_irrigation=data.has_irrigation,
            has_kcc=data.has_kcc,
            social_category=data.social_category,
            gender=data.gender,
        )
        db.add(profile)
    else:
        # Update fields where explicitly passed in payload
        update_dict = data.model_dump(exclude_unset=True)
        if "primary_crop_type" in update_dict:
            val = update_dict["primary_crop_type"]
            profile.primary_crop_type = val.strip() if val else None
        if "has_irrigation" in update_dict:
            profile.has_irrigation = update_dict["has_irrigation"]
        if "has_kcc" in update_dict:
            profile.has_kcc = update_dict["has_kcc"]
        if "social_category" in update_dict:
            profile.social_category = update_dict["social_category"]
        if "gender" in update_dict:
            profile.gender = update_dict["gender"]

    db.commit()
    db.refresh(profile)

    return FarmerProfileResponse.model_validate(profile)


# -----------------------------------------------------------------------------
# Scheme Matching Services
# -----------------------------------------------------------------------------

def get_farmer_scheme_matches(db: Session, farmer_id: int) -> FarmerSchemeMatchesResponse:
    """Calculate potential government scheme matches for a farmer.

    Matching Principles:
    1. Transparency:
       - Results are explicitly designated as 'potential_match', never guaranteed eligibility.
       - Every match includes transparent reasons and missing criteria that require farmer verification.
    2. Landholding Aggregation:
       - Landholding is calculated across the farmer's TOTAL registered farms (`sum(farm.area_acres)`).
       - Individual farms are not silently treated as the entire landholding.
       - The exact calculation basis is explicitly returned in every match item.
    3. Inclusive Privacy:
       - Omitted/unknown profile attributes NEVER cause a scheme to be silently excluded.
       - Missing attributes are highlighted as verification steps rather than disqualifications.
    4. State Geography:
       - 'All India' schemes apply nationwide to all farmers.
       - State-specific schemes match if any registered farm is in the corresponding state.
       - If no farms are registered, state-specific schemes are retained with missing-info advice.
    """
    user = db.get(User, farmer_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {farmer_id} not found",
        )

    if user.role != "farmer":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User {farmer_id} has role '{user.role}', but must be 'farmer' to query scheme matches",
        )

    # Load farmer's registered farms
    farms: List[Farm] = db.scalars(select(Farm).where(Farm.farmer_id == farmer_id)).all()
    farm_count = len(farms)

    # Derive total registered landholding
    known_acres: List[Decimal] = [
        Decimal(str(f.area_acres)) for f in farms if f.area_acres is not None
    ]
    total_acres: Optional[Decimal] = sum(known_acres) if known_acres else None

    # Farm states set
    farm_states: Set[str] = {f.state.strip().lower() for f in farms if f.state and f.state.strip()}

    # Load farmer's optional SchemeSaathi profile
    profile: Optional[FarmerProfile] = db.scalar(
        select(FarmerProfile).where(FarmerProfile.farmer_id == farmer_id)
    )

    profile_exists = profile is not None
    profile_advice = None
    if not profile_exists:
        profile_advice = (
            "No SchemeSaathi profile found for this farmer. You can update your profile via "
            f"PUT /api/farmer/{farmer_id}/profile with optional attributes (crop type, irrigation access, "
            "social category) to discover more targeted schemes."
        )

    # Retrieve all active schemes
    active_schemes: List[Scheme] = db.scalars(
        select(Scheme).where(Scheme.is_active.is_(True)).order_by(Scheme.name.asc(), Scheme.id.asc())
    ).all()

    matches: List[SchemeMatchItem] = []

    for scheme in active_schemes:
        is_eligible = True
        match_reasons: List[str] = []
        missing_info: List[str] = []

        # 1. State Applicability Evaluation
        scheme_state = scheme.state_applicability.strip()
        is_nationwide = scheme_state.lower() in ("all india", "national", "pan india", "all")

        if is_nationwide:
            match_reasons.append("Nationwide applicability (All India)")
        else:
            if farm_count > 0 and farm_states:
                # Check if any registered farm is located in the target state
                matches_state = any(
                    scheme_state.lower() in fs or fs in scheme_state.lower()
                    for fs in farm_states
                )
                if matches_state:
                    match_reasons.append(f"Applicable in your registered farm state ({scheme_state})")
                else:
                    # Explicit exclusion: farmer's farms are solely in other states
                    is_eligible = False
            else:
                # No farms or no state registered: retain scheme, prompt farmer to verify
                missing_info.append(
                    f"Scheme is restricted to '{scheme_state}'. Farm location is unverified because "
                    "no registered farms were found."
                )

        if not is_eligible:
            continue

        # 2. Landholding Evaluation (Aggregated total registered landholding)
        has_min_land = scheme.min_land_acres is not None
        has_max_land = scheme.max_land_acres is not None

        if has_min_land or has_max_land:
            min_val = Decimal(str(scheme.min_land_acres)) if has_min_land else None
            max_val = Decimal(str(scheme.max_land_acres)) if has_max_land else None

            if total_acres is not None:
                if min_val is not None and total_acres < min_val:
                    # Definite exclusion: below required minimum holding
                    is_eligible = False
                elif max_val is not None and total_acres > max_val:
                    # Definite exclusion: exceeds maximum cap (e.g. small/marginal farmer schemes)
                    is_eligible = False
                else:
                    range_desc = f"{min_val or 0} to {max_val or 'unlimited'} acres"
                    match_reasons.append(
                        f"Total registered landholding ({total_acres} acres across {farm_count} farm(s)) "
                        f"satisfies scheme land requirement ({range_desc})"
                    )
            else:
                # Unknown landholding: do NOT exclude, list as missing info
                range_desc = f"{min_val or 0} to {max_val or 'unlimited'} acres"
                missing_info.append(
                    f"Scheme requires {range_desc} landholding. Verification needed as your total "
                    "registered farm area is currently unknown."
                )

        if not is_eligible:
            continue

        # 3. Target Gender Evaluation
        target_g = scheme.target_gender.strip().lower() if scheme.target_gender else None
        if target_g and target_g not in ("all", "both"):
            if profile and profile.gender:
                if profile.gender.lower() == target_g:
                    match_reasons.append(f"Matches targeted gender ({scheme.target_gender})")
                else:
                    # Definite gender mismatch
                    is_eligible = False
            else:
                # Gender unknown: do not exclude, add verification prompt
                missing_info.append(
                    f"Scheme specifically targets {scheme.target_gender} farmers. Gender is "
                    "unspecified in your profile."
                )

        if not is_eligible:
            continue

        # 4. Target Social Category Evaluation
        target_sc = scheme.target_social_categories.strip().lower() if scheme.target_social_categories else None
        if target_sc and target_sc not in ("all",):
            allowed_cats = [c.strip() for c in target_sc.split(",") if c.strip()]
            if profile and profile.social_category:
                if profile.social_category.lower() in allowed_cats:
                    match_reasons.append(f"Matches targeted social category ({profile.social_category})")
                else:
                    # Definite category mismatch
                    is_eligible = False
            else:
                # Category unknown: do not exclude, add verification prompt
                missing_info.append(
                    f"Scheme targets specific social categories ({scheme.target_social_categories}). "
                    "Category is unspecified in your profile."
                )

        if not is_eligible:
            continue

        # 5. Contextual Alignment Highlights
        if profile and profile.primary_crop_type:
            match_reasons.append(
                f"Aligned with your primary crop category ({profile.primary_crop_type})"
            )

        if profile and profile.has_kcc is not None:
            if "kcc" in scheme.slug.lower() or "credit" in scheme.category.lower():
                if profile.has_kcc:
                    match_reasons.append("Leverages your existing Kisan Credit Card (KCC)")
                else:
                    match_reasons.append("Opportunity to apply under Kisan Credit Card provisions")

        if profile and profile.has_irrigation is not None:
            if "irrigation" in scheme.category.lower() or "water" in scheme.slug.lower():
                if not profile.has_irrigation:
                    match_reasons.append("Provides irrigation subsidy for non-irrigated farmland")
                else:
                    match_reasons.append("Subsidies available for irrigation modernization and micro-sprinklers")

        # Fallback reason if none triggered
        if not match_reasons:
            match_reasons.append("Preliminary match based on public eligibility catalogue criteria")

        land_basis = (
            f"Aggregated total area across {farm_count} registered farm(s)"
            if total_acres is not None
            else "Unknown (no farm area recorded)"
        )

        matches.append(
            SchemeMatchItem(
                scheme_id=scheme.id,
                slug=scheme.slug,
                name=scheme.name,
                category=scheme.category,
                nodal_ministry=scheme.nodal_ministry,
                state_applicability=scheme.state_applicability,
                official_portal_url=scheme.official_portal_url,
                verification_date=scheme.verification_date,
                match_status="potential_match",
                match_reasons=match_reasons,
                missing_information=missing_info,
                total_landholding_considered_acres=total_acres,
                landholding_calculation_basis=land_basis,
            )
        )

    return FarmerSchemeMatchesResponse(
        farmer_id=farmer_id,
        farmer_name=user.name,
        profile_exists=profile_exists,
        total_registered_farms=farm_count,
        total_registered_acres=total_acres,
        matches=matches,
        profile_advice=profile_advice,
    )
