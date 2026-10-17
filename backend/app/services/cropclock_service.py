import math
from decimal import Decimal
from typing import Optional, List, Tuple

from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.farm import Farm
from app.models.harvest import Harvest, BuyerOffer
from app.schemas.cropclock import (
    HarvestCreate,
    HarvestResponse,
    PaginatedHarvestsResponse,
    OfferCreate,
    OfferStatusUpdate,
    OfferResponse,
    OfferComparisonItem,
    CompareOffersResponse,
)


def calculate_net_earnings(
    price_per_kg: Decimal,
    quantity_kg: Decimal,
    transport_cost: Decimal,
    other_costs: Decimal,
) -> Tuple[Decimal, Decimal, Decimal]:
    """Calculate gross value, total costs, and estimated net earnings using Decimal arithmetic.

    Formula:
        gross_value = price_per_kg * quantity_kg
        total_costs = transport_cost + other_costs
        estimated_net = gross_value - total_costs
    """
    two_places = Decimal("0.01")
    gross_value = (price_per_kg * quantity_kg).quantize(two_places)
    total_costs = (transport_cost + other_costs).quantize(two_places)
    estimated_net = (gross_value - total_costs).quantize(two_places)
    return gross_value, total_costs, estimated_net


def create_harvest(db: Session, data: HarvestCreate) -> HarvestResponse:
    """Create a new harvest listing after verifying farm ownership."""
    farm = db.get(Farm, data.farm_id)
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farm with ID {data.farm_id} does not exist",
        )

    farmer = db.get(User, data.farmer_id)
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farmer user with ID {data.farmer_id} does not exist",
        )

    if farm.farmer_id != data.farmer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Farmer with ID {data.farmer_id} does not own farm {data.farm_id}",
        )

    harvest = Harvest(
        farm_id=data.farm_id,
        crop=data.crop.strip(),
        quantity_kg=data.quantity_kg,
        expected_harvest_date=data.expected_harvest_date,
        quality_grade=data.quality_grade.strip() if data.quality_grade else None,
        status="available",
    )
    db.add(harvest)
    db.commit()
    db.refresh(harvest)

    return HarvestResponse(
        id=harvest.id,
        farm_id=harvest.farm_id,
        crop=harvest.crop,
        quantity_kg=harvest.quantity_kg,
        expected_harvest_date=harvest.expected_harvest_date,
        quality_grade=harvest.quality_grade,
        status=harvest.status,
        created_at=harvest.created_at,
        farm_name=farm.name,
        state=farm.state,
        district=farm.district,
    )


def list_harvests(
    db: Session,
    crop: Optional[str] = None,
    state: Optional[str] = None,
    district: Optional[str] = None,
    status_filter: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> PaginatedHarvestsResponse:
    """List harvests with filtering by crop, location (state/district), and status."""
    query = select(Harvest, Farm).join(Farm, Harvest.farm_id == Farm.id)

    if crop:
        query = query.where(Harvest.crop.ilike(f"%{crop.strip()}%"))
    if state:
        query = query.where(Farm.state.ilike(f"%{state.strip()}%"))
    if district:
        query = query.where(Farm.district.ilike(f"%{district.strip()}%"))
    if status_filter:
        query = query.where(Harvest.status == status_filter.strip())

    # Count total
    count_subquery = query.subquery()
    total = db.scalar(select(func.count()).select_from(count_subquery)) or 0

    # Paginate and order by newest
    offset = (page - 1) * page_size
    query = query.order_by(Harvest.created_at.desc()).offset(offset).limit(page_size)
    results = db.execute(query).all()

    items = [
        HarvestResponse(
            id=harvest.id,
            farm_id=harvest.farm_id,
            crop=harvest.crop,
            quantity_kg=harvest.quantity_kg,
            expected_harvest_date=harvest.expected_harvest_date,
            quality_grade=harvest.quality_grade,
            status=harvest.status,
            created_at=harvest.created_at,
            farm_name=farm.name,
            state=farm.state,
            district=farm.district,
        )
        for harvest, farm in results
    ]

    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return PaginatedHarvestsResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


def get_harvest(db: Session, harvest_id: int) -> HarvestResponse:
    """Retrieve details for a single harvest."""
    result = db.execute(
        select(Harvest, Farm).join(Farm, Harvest.farm_id == Farm.id).where(Harvest.id == harvest_id)
    ).first()

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Harvest with ID {harvest_id} not found",
        )

    harvest, farm = result
    return HarvestResponse(
        id=harvest.id,
        farm_id=harvest.farm_id,
        crop=harvest.crop,
        quantity_kg=harvest.quantity_kg,
        expected_harvest_date=harvest.expected_harvest_date,
        quality_grade=harvest.quality_grade,
        status=harvest.status,
        created_at=harvest.created_at,
        farm_name=farm.name,
        state=farm.state,
        district=farm.district,
    )


def create_buyer_offer(db: Session, harvest_id: int, data: OfferCreate) -> OfferResponse:
    """Submit a buyer offer on an available harvest."""
    harvest = db.get(Harvest, harvest_id)
    if not harvest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Harvest with ID {harvest_id} not found",
        )

    if harvest.status != "available":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Harvest is not available for offers (current status: '{harvest.status}')",
        )

    buyer = db.get(User, data.buyer_id)
    if not buyer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Buyer user with ID {data.buyer_id} not found",
        )

    if buyer.role not in ("buyer", "admin"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User {data.buyer_id} has role '{buyer.role}', but must be a 'buyer' to submit offers",
        )

    # Check for duplicate active offer
    existing_active = db.scalar(
        select(BuyerOffer).where(
            BuyerOffer.harvest_id == harvest_id,
            BuyerOffer.buyer_id == data.buyer_id,
            BuyerOffer.status.in_(["pending", "accepted"]),
        )
    )
    if existing_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Buyer {data.buyer_id} already has an active offer for harvest {harvest_id} (status: '{existing_active.status}')",
        )

    offer = BuyerOffer(
        harvest_id=harvest_id,
        buyer_id=data.buyer_id,
        price_per_kg=data.price_per_kg,
        transport_cost=data.transport_cost,
        other_costs=data.other_costs,
        collection_time=data.collection_time,
        status="pending",
    )
    db.add(offer)
    db.commit()
    db.refresh(offer)

    return OfferResponse(
        id=offer.id,
        harvest_id=offer.harvest_id,
        buyer_id=offer.buyer_id,
        buyer_name=buyer.name,
        price_per_kg=offer.price_per_kg,
        transport_cost=offer.transport_cost,
        other_costs=offer.other_costs,
        collection_time=offer.collection_time,
        status=offer.status,
        created_at=offer.created_at,
    )


def list_harvest_offers(db: Session, harvest_id: int) -> List[OfferResponse]:
    """List all offers for a specific harvest without leaking sensitive personal contact data."""
    harvest = db.get(Harvest, harvest_id)
    if not harvest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Harvest with ID {harvest_id} not found",
        )

    query = (
        select(BuyerOffer, User)
        .join(User, BuyerOffer.buyer_id == User.id)
        .where(BuyerOffer.harvest_id == harvest_id)
        .order_by(BuyerOffer.created_at.desc())
    )
    results = db.execute(query).all()

    return [
        OfferResponse(
            id=offer.id,
            harvest_id=offer.harvest_id,
            buyer_id=offer.buyer_id,
            buyer_name=user.name,
            price_per_kg=offer.price_per_kg,
            transport_cost=offer.transport_cost,
            other_costs=offer.other_costs,
            collection_time=offer.collection_time,
            status=offer.status,
            created_at=offer.created_at,
        )
        for offer, user in results
    ]


def update_offer_status(db: Session, offer_id: int, data: OfferStatusUpdate) -> OfferResponse:
    """Accept or reject a buyer offer with atomic transaction and validation."""
    result = db.execute(
        select(BuyerOffer, Harvest, Farm, User)
        .join(Harvest, BuyerOffer.harvest_id == Harvest.id)
        .join(Farm, Harvest.farm_id == Farm.id)
        .join(User, BuyerOffer.buyer_id == User.id)
        .where(BuyerOffer.id == offer_id)
        .with_for_update(of=BuyerOffer)
    ).first()

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Offer with ID {offer_id} not found",
        )

    offer, harvest, farm, buyer = result

    # Validate that requesting farmer owns the farm associated with the harvest
    if farm.farmer_id != data.farmer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the farmer who owns this harvest can accept or reject offers",
        )

    # State transition validation: can only decide on pending offers
    if offer.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition offer from current status '{offer.status}'",
        )

    if data.status == "accepted":
        # Ensure harvest is still available and not reserved by another offer
        if harvest.status != "available":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Harvest is already '{harvest.status}'; another offer may have been accepted",
            )
        offer.status = "accepted"
        harvest.status = "reserved"
    elif data.status == "rejected":
        offer.status = "rejected"

    db.commit()
    db.refresh(offer)

    return OfferResponse(
        id=offer.id,
        harvest_id=offer.harvest_id,
        buyer_id=offer.buyer_id,
        buyer_name=buyer.name,
        price_per_kg=offer.price_per_kg,
        transport_cost=offer.transport_cost,
        other_costs=offer.other_costs,
        collection_time=offer.collection_time,
        status=offer.status,
        created_at=offer.created_at,
    )


def compare_harvest_offers(db: Session, harvest_id: int) -> CompareOffersResponse:
    """Calculate net proceeds for each eligible offer and return them ranked by highest net earnings."""
    harvest = db.get(Harvest, harvest_id)
    if not harvest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Harvest with ID {harvest_id} not found",
        )

    # Consider active offers: pending and accepted
    query = (
        select(BuyerOffer, User)
        .join(User, BuyerOffer.buyer_id == User.id)
        .where(
            BuyerOffer.harvest_id == harvest_id,
            BuyerOffer.status.in_(["pending", "accepted"]),
        )
    )
    results = db.execute(query).all()

    compared_offers: List[OfferComparisonItem] = []
    for offer, buyer in results:
        gross_value, total_costs, estimated_net = calculate_net_earnings(
            price_per_kg=offer.price_per_kg,
            quantity_kg=harvest.quantity_kg,
            transport_cost=offer.transport_cost,
            other_costs=offer.other_costs,
        )

        compared_offers.append(
            OfferComparisonItem(
                offer_id=offer.id,
                buyer_id=buyer.id,
                buyer_name=buyer.name,
                price_per_kg=offer.price_per_kg,
                quantity_kg=harvest.quantity_kg,
                gross_value=gross_value,
                transport_cost=offer.transport_cost,
                other_costs=offer.other_costs,
                total_costs=total_costs,
                estimated_net=estimated_net,
                status=offer.status,
                collection_time=offer.collection_time,
            )
        )

    # Sort by estimated net earnings, highest first
    compared_offers.sort(key=lambda x: x.estimated_net, reverse=True)

    return CompareOffersResponse(
        harvest_id=harvest.id,
        crop=harvest.crop,
        quantity_kg=harvest.quantity_kg,
        harvest_status=harvest.status,
        total_offers_evaluated=len(compared_offers),
        offers=compared_offers,
    )
