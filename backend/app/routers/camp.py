from typing import Optional
from fastapi import APIRouter, Depends, Query, Path, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.camp import (
    CampCreate,
    CampResponse,
    PaginatedCampResponse,
)
from app.services import camp_service

router = APIRouter(tags=["FarmConnect Camps"])


@router.post(
    "/api/camps",
    response_model=CampResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a digital literacy / awareness camp",
)
def create_camp_endpoint(
    payload: CampCreate,
    db: Session = Depends(get_db),
):
    """Create a new digital literacy and scheme awareness camp for farmers.

    Requirements:
    - `scheduled_start` and `scheduled_end` must both be timezone-aware.
    - `scheduled_end` must be strictly later than `scheduled_start`.
    - Required string fields must be non-empty and respect length boundaries.
    - `coordinator_id` must reference an existing user with the `admin` role.

    > **Note on Authentication**: For this hackathon prototype, coordinator authorization
    > is verified against the `users` table via `coordinator_id`. Production-grade authentication
    > (e.g. JWT / OAuth) will be layered onto these endpoints in a subsequent security phase.
    """
    return camp_service.create_camp(db=db, data=payload)


@router.get(
    "/api/camps",
    response_model=PaginatedCampResponse,
    summary="List upcoming digital literacy camps with filtering and pagination",
)
def list_camps_endpoint(
    state: Optional[str] = Query(None, description="Filter by state (case-insensitive substring)"),
    district: Optional[str] = Query(None, description="Filter by district (case-insensitive substring)"),
    include_past: bool = Query(False, description="Whether to include past camps. Past camps exclude cancelled ones."),
    page: int = Query(1, ge=1, description="Page number, 1-indexed"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    db: Session = Depends(get_db),
):
    """List camps organized chronologically.

    - Returns upcoming, non-cancelled camps by default (`scheduled_end >= current UTC time`).
    - Excludes cancelled camps under all circumstances, even when `include_past=true`.
    - Supports state and district substring filtering.
    - Standard pagination with `page` (default 1) and `page_size` (default 20, max 100).
    """
    return camp_service.list_camps(
        db=db,
        state=state,
        district=district,
        include_past=include_past,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/api/camps/next",
    response_model=CampResponse,
    summary="Get the earliest upcoming digital literacy camp",
)
def get_next_camp_endpoint(
    state: Optional[str] = Query(None, description="Filter by state (case-insensitive substring)"),
    district: Optional[str] = Query(None, description="Filter by district (case-insensitive substring)"),
    db: Session = Depends(get_db),
):
    """Retrieve the next upcoming, non-cancelled camp.

    - Considers a camp upcoming if `scheduled_end >= current UTC time`.
    - Supports optional state and district filters.
    - Returns 404 if no upcoming camps match the criteria.
    """
    return camp_service.get_next_camp(
        db=db,
        state=state,
        district=district,
    )


@router.get(
    "/api/camps/{camp_id}",
    response_model=CampResponse,
    summary="Get details for a single camp by ID",
)
def get_camp_endpoint(
    camp_id: int = Path(..., description="Unique ID of the camp"),
    db: Session = Depends(get_db),
):
    """Retrieve public details for a single camp.

    Returns 404 if the camp does not exist.
    """
    return camp_service.get_camp_by_id(db=db, camp_id=camp_id)
