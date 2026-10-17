from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.cropclock import (
    HarvestCreate,
    HarvestResponse,
    PaginatedHarvestsResponse,
    OfferCreate,
    OfferStatusUpdate,
    OfferResponse,
    CompareOffersResponse,
)
from app.services import cropclock_service

router = APIRouter(tags=["CropClock - Harvests & Buyer Offers"])


# -----------------------------------------------------------------------------
# Harvest Endpoints
# -----------------------------------------------------------------------------

@router.post(
    "/api/harvests",
    response_model=HarvestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new harvest listing",
)
def create_harvest_endpoint(
    payload: HarvestCreate,
    db: Session = Depends(get_db),
):
    """Create a new harvest listing.

    - Validates that the referenced farm and farmer exist.
    - Validates that the farmer owns the farm.
    - Sets initial listing status to 'available'.
    """
    return cropclock_service.create_harvest(db=db, data=payload)


@router.get(
    "/api/harvests",
    response_model=PaginatedHarvestsResponse,
    summary="List harvests with optional filters and pagination",
)
def list_harvests_endpoint(
    crop: Optional[str] = Query(None, description="Filter by crop name (case-insensitive substring)"),
    state: Optional[str] = Query(None, description="Filter by state (case-insensitive substring)"),
    district: Optional[str] = Query(None, description="Filter by district (case-insensitive substring)"),
    status: Optional[str] = Query(None, description="Filter by status ('available', 'reserved', 'sold', 'cancelled')"),
    page: int = Query(1, ge=1, description="Page number, 1-indexed"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    db: Session = Depends(get_db),
):
    """List harvests with filtering by crop, location, or status with pagination."""
    return cropclock_service.list_harvests(
        db=db,
        crop=crop,
        state=state,
        district=district,
        status_filter=status,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/api/harvests/{harvest_id}",
    response_model=HarvestResponse,
    summary="Get single harvest details",
)
def get_harvest_endpoint(
    harvest_id: int,
    db: Session = Depends(get_db),
):
    """Retrieve details for a single harvest by ID."""
    return cropclock_service.get_harvest(db=db, harvest_id=harvest_id)


# -----------------------------------------------------------------------------
# Buyer Offer Endpoints
# -----------------------------------------------------------------------------

@router.post(
    "/api/harvests/{harvest_id}/offers",
    response_model=OfferResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit an offer on an available harvest",
)
def submit_offer_endpoint(
    harvest_id: int,
    payload: OfferCreate,
    db: Session = Depends(get_db),
):
    """Submit a buyer bid/offer on an available harvest.

    - Verifies harvest exists and is in 'available' status.
    - Verifies user exists and possesses the 'buyer' role.
    - Prevents duplicate active offers by the same buyer on the same harvest.
    """
    return cropclock_service.create_buyer_offer(db=db, harvest_id=harvest_id, data=payload)


@router.get(
    "/api/harvests/{harvest_id}/offers",
    response_model=List[OfferResponse],
    summary="List all offers submitted for a harvest",
)
def list_harvest_offers_endpoint(
    harvest_id: int,
    db: Session = Depends(get_db),
):
    """List all offers for a specific harvest without exposing buyer personal contact info."""
    return cropclock_service.list_harvest_offers(db=db, harvest_id=harvest_id)


@router.patch(
    "/api/offers/{offer_id}/status",
    response_model=OfferResponse,
    summary="Accept or reject a buyer offer",
)
def update_offer_status_endpoint(
    offer_id: int,
    payload: OfferStatusUpdate,
    db: Session = Depends(get_db),
):
    """Allow a farmer to accept or reject an offer on a harvest they own.

    - Validates farmer ownership of the harvest.
    - Rejects invalid state transitions (only pending offers can be decided).
    - When accepting, updates the harvest status to 'reserved' atomically.
    - Rejects acceptance if the harvest was already reserved by another offer.
    """
    return cropclock_service.update_offer_status(db=db, offer_id=offer_id, data=payload)


# -----------------------------------------------------------------------------
# Net-Earnings Comparison Endpoint
# -----------------------------------------------------------------------------

@router.get(
    "/api/harvests/{harvest_id}/compare-offers",
    response_model=CompareOffersResponse,
    summary="Compare buyer offers ranked by estimated net proceeds",
)
def compare_offers_endpoint(
    harvest_id: int,
    db: Session = Depends(get_db),
):
    """Evaluate and rank all active buyer offers for a harvest.

    Calculates:
        gross_value = price_per_kg * harvest_quantity_kg
        total_costs = transport_cost + other_costs
        estimated_net = gross_value - total_costs

    Uses pure Decimal arithmetic and ranks offers highest net earnings first.
    """
    return cropclock_service.compare_harvest_offers(db=db, harvest_id=harvest_id)
