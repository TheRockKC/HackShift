from typing import Optional
from fastapi import APIRouter, Depends, Query, Path, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.scheme import (
    SchemeResponse,
    PaginatedSchemesResponse,
    FarmerProfileUpdate,
    FarmerProfileResponse,
    FarmerSchemeMatchesResponse,
)
from app.services import scheme_service

router = APIRouter(tags=["SchemeSaathi - Government Schemes"])


@router.get(
    "/api/schemes",
    response_model=PaginatedSchemesResponse,
    summary="Browse active government agricultural schemes",
)
def list_schemes_endpoint(
    state: Optional[str] = Query(None, description="Filter by state applicability (e.g. Punjab, All India)"),
    category: Optional[str] = Query(None, description="Filter by scheme category (e.g. credit, subsidy, irrigation)"),
    q: Optional[str] = Query(None, description="Search query across scheme name, description, and benefits"),
    page: int = Query(1, ge=1, description="Page number, 1-indexed"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    db: Session = Depends(get_db),
):
    """Browse verified active schemes with optional state, category, and text filters."""
    return scheme_service.list_schemes(
        db=db,
        state=state,
        category=category,
        q=q,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/api/schemes/farmer/{farmer_id}/matches",
    response_model=FarmerSchemeMatchesResponse,
    summary="Find potential scheme matches for a farmer",
)
def get_farmer_scheme_matches_endpoint(
    farmer_id: int = Path(..., description="Unique ID of the farmer"),
    db: Session = Depends(get_db),
):
    """Calculate transparent preliminary potential scheme matches for a farmer.

    Evaluates:
    - Registered farm location(s) and aggregated total landholding.
    - Non-sensitive profile attributes (crop type, irrigation access, social category, gender).
    - Guarantees that omitted profile attributes do not lead to false disqualifications.
    - Returns potential matches with explicit reasons and missing items to verify.
    """
    return scheme_service.get_farmer_scheme_matches(db=db, farmer_id=farmer_id)


@router.get(
    "/api/schemes/{scheme_id}",
    response_model=SchemeResponse,
    summary="Get full details of an active scheme",
)
def get_scheme_endpoint(
    scheme_id: int = Path(..., description="Unique ID of the scheme"),
    db: Session = Depends(get_db),
):
    """Retrieve full details of an active scheme by ID. Returns 404 if not found or inactive."""
    return scheme_service.get_scheme_by_id(db=db, scheme_id=scheme_id)


@router.put(
    "/api/farmer/{farmer_id}/profile",
    response_model=FarmerProfileResponse,
    summary="Create or update a farmer's SchemeSaathi profile",
)
def upsert_farmer_profile_endpoint(
    farmer_id: int = Path(..., description="Unique ID of the farmer"),
    payload: FarmerProfileUpdate = ...,
    db: Session = Depends(get_db),
):
    """Create or update privacy-first profile attributes for scheme matching.

    - Verifies user exists and possesses the 'farmer' role.
    - All attributes are optional and non-sensitive.
    - Does not collect Aadhaar, PAN, or financial account numbers.
    """
    return scheme_service.upsert_farmer_profile(
        db=db,
        farmer_id=farmer_id,
        data=payload,
    )
