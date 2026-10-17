from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.fairqueue import (
    MachineryCreate,
    MachineryResponse,
    PaginatedMachineryResponse,
    BookingCreate,
    BookingStatusUpdate,
    BookingResponse,
)
from app.services import fairqueue_service

router = APIRouter(tags=["FairQueue - Machinery & Bookings"])


# -----------------------------------------------------------------------------
# Machinery Endpoints
# -----------------------------------------------------------------------------

@router.post(
    "/api/machinery",
    response_model=MachineryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new machinery listing",
)
def create_machinery_endpoint(
    payload: MachineryCreate,
    db: Session = Depends(get_db),
):
    """Create a new machinery listing for rental or custom hiring.

    - Verifies provider exists and has the 'machinery_provider' role.
    - Validates non-negative rates and requires at least one positive rate.
    - Sets initial listing availability to True.
    """
    return fairqueue_service.create_machinery(db=db, data=payload)


@router.get(
    "/api/machinery",
    response_model=PaginatedMachineryResponse,
    summary="Browse machinery listings with filters and pagination",
)
def list_machinery_endpoint(
    equipment_type: Optional[str] = Query(None, description="Filter by equipment type (case-insensitive substring)"),
    state: Optional[str] = Query(None, description="Filter by state (case-insensitive substring)"),
    district: Optional[str] = Query(None, description="Filter by district (case-insensitive substring)"),
    is_available: Optional[bool] = Query(None, description="Filter by availability status"),
    page: int = Query(1, ge=1, description="Page number, 1-indexed"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    db: Session = Depends(get_db),
):
    """Browse machinery listings with pagination without exposing private provider contact data."""
    return fairqueue_service.list_machinery(
        db=db,
        equipment_type=equipment_type,
        state=state,
        district=district,
        is_available=is_available,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/api/machinery/{machinery_id}",
    response_model=MachineryResponse,
    summary="Get machinery listing details",
)
def get_machinery_endpoint(
    machinery_id: int,
    db: Session = Depends(get_db),
):
    """Retrieve details for a single machinery listing by ID."""
    return fairqueue_service.get_machinery(db=db, machinery_id=machinery_id)


# -----------------------------------------------------------------------------
# Booking Endpoints
# -----------------------------------------------------------------------------

@router.post(
    "/api/machinery/{machinery_id}/bookings",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Request a machinery booking",
)
def create_booking_endpoint(
    machinery_id: int,
    payload: BookingCreate,
    db: Session = Depends(get_db),
):
    """Request a reservation for agricultural machinery.

    - Validates farmer exists and possesses 'farmer' role.
    - Validates machinery is currently available.
    - Requires timezone-aware timestamps with end_time > start_time.
    - Uses row-level locking to prevent concurrent overlapping bookings (pending/confirmed).
    - Returns 409 Conflict if the requested time slot overlaps with an existing reservation.
    """
    return fairqueue_service.create_booking(db=db, machinery_id=machinery_id, data=payload)


@router.get(
    "/api/machinery/{machinery_id}/bookings",
    response_model=List[BookingResponse],
    summary="List bookings for a machinery listing",
)
def list_machinery_bookings_endpoint(
    machinery_id: int,
    db: Session = Depends(get_db),
):
    """List bookings for a specific machinery listing without exposing private contact info."""
    return fairqueue_service.list_machinery_bookings(db=db, machinery_id=machinery_id)


@router.patch(
    "/api/bookings/{booking_id}/status",
    response_model=BookingResponse,
    summary="Update booking status (confirm, cancel, or complete)",
)
def update_booking_status_endpoint(
    booking_id: int,
    payload: BookingStatusUpdate,
    db: Session = Depends(get_db),
):
    """Update the status of a booking with role-based authorization.

    - Machinery provider:
      - Can confirm a pending booking ('confirmed').
      - Can reject/cancel a pending booking or cancel a confirmed booking ('cancelled').
      - Can mark a confirmed booking as finished ('completed').
    - Farmer:
      - Can cancel their own pending or confirmed booking ('cancelled').
    - Cancelling immediately frees the reserved time slot for future bookings.
    """
    return fairqueue_service.update_booking_status(db=db, booking_id=booking_id, data=payload)
