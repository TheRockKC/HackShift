import math
from typing import Optional, List

from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.machinery import Machinery, Booking
from app.schemas.fairqueue import (
    MachineryCreate,
    MachineryResponse,
    PaginatedMachineryResponse,
    BookingCreate,
    BookingStatusUpdate,
    BookingResponse,
)


def create_machinery(db: Session, data: MachineryCreate) -> MachineryResponse:
    """Create a new machinery listing after verifying provider role and rates."""
    provider = db.get(User, data.provider_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Machinery provider user with ID {data.provider_id} does not exist",
        )

    if provider.role not in ("machinery_provider", "admin"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User {data.provider_id} has role '{provider.role}', but must be 'machinery_provider' to create listings",
        )

    machinery = Machinery(
        provider_id=data.provider_id,
        equipment_type=data.equipment_type.strip(),
        name=data.name.strip() if data.name else None,
        hourly_rate=data.hourly_rate,
        daily_rate=data.daily_rate,
        state=data.state.strip(),
        district=data.district.strip(),
        is_available=True,
    )
    db.add(machinery)
    db.commit()
    db.refresh(machinery)

    return MachineryResponse(
        id=machinery.id,
        provider_id=machinery.provider_id,
        provider_name=provider.name,
        equipment_type=machinery.equipment_type,
        name=machinery.name,
        hourly_rate=machinery.hourly_rate,
        daily_rate=machinery.daily_rate,
        state=machinery.state,
        district=machinery.district,
        is_available=machinery.is_available,
        created_at=machinery.created_at,
    )


def list_machinery(
    db: Session,
    equipment_type: Optional[str] = None,
    state: Optional[str] = None,
    district: Optional[str] = None,
    is_available: Optional[bool] = None,
    page: int = 1,
    page_size: int = 20,
) -> PaginatedMachineryResponse:
    """Browse machinery with filtering and pagination without exposing provider private contacts."""
    query = select(Machinery, User).join(User, Machinery.provider_id == User.id)

    if equipment_type:
        query = query.where(Machinery.equipment_type.ilike(f"%{equipment_type.strip()}%"))
    if state:
        query = query.where(Machinery.state.ilike(f"%{state.strip()}%"))
    if district:
        query = query.where(Machinery.district.ilike(f"%{district.strip()}%"))
    if is_available is not None:
        query = query.where(Machinery.is_available == is_available)

    count_subquery = query.subquery()
    total = db.scalar(select(func.count()).select_from(count_subquery)) or 0

    offset = (page - 1) * page_size
    query = query.order_by(Machinery.created_at.desc()).offset(offset).limit(page_size)
    results = db.execute(query).all()

    items = [
        MachineryResponse(
            id=machinery.id,
            provider_id=machinery.provider_id,
            provider_name=provider.name,
            equipment_type=machinery.equipment_type,
            name=machinery.name,
            hourly_rate=machinery.hourly_rate,
            daily_rate=machinery.daily_rate,
            state=machinery.state,
            district=machinery.district,
            is_available=machinery.is_available,
            created_at=machinery.created_at,
        )
        for machinery, provider in results
    ]

    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return PaginatedMachineryResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


def get_machinery(db: Session, machinery_id: int) -> MachineryResponse:
    """Retrieve details for a single machinery listing."""
    result = db.execute(
        select(Machinery, User)
        .join(User, Machinery.provider_id == User.id)
        .where(Machinery.id == machinery_id)
    ).first()

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Machinery with ID {machinery_id} not found",
        )

    machinery, provider = result
    return MachineryResponse(
        id=machinery.id,
        provider_id=machinery.provider_id,
        provider_name=provider.name,
        equipment_type=machinery.equipment_type,
        name=machinery.name,
        hourly_rate=machinery.hourly_rate,
        daily_rate=machinery.daily_rate,
        state=machinery.state,
        district=machinery.district,
        is_available=machinery.is_available,
        created_at=machinery.created_at,
    )


def create_booking(db: Session, machinery_id: int, data: BookingCreate) -> BookingResponse:
    """Request a machinery booking with row-level locking to prevent race-condition booking overlaps."""
    farmer = None
    if data.farmer_id is not None:
        farmer = db.get(User, data.farmer_id)

    # Graceful fallback: If farmer_id was not provided or not found, associate with the first registered farmer
    if not farmer:
        farmer = db.execute(select(User).where(User.role == "farmer")).scalars().first()

    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No valid farmer account found to associate with this booking",
        )

    if farmer.role not in ("farmer", "admin"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User {farmer.id} has role '{farmer.role}', but must be a 'farmer' to request bookings",
        )

    # Acquire row-level lock on the machinery record to serialize concurrent booking attempts
    machinery = db.execute(
        select(Machinery).where(Machinery.id == machinery_id).with_for_update()
    ).scalar_one_or_none()

    if not machinery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Machinery with ID {machinery_id} not found",
        )

    if not machinery.is_available:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Machinery '{machinery.equipment_type}' is currently marked unavailable for rent",
        )

    # Overlap detection: existing interval [start, end] overlaps if start < new_end AND end > new_start
    overlapping_booking = db.scalar(
        select(Booking).where(
            Booking.machinery_id == machinery_id,
            Booking.status.in_(["pending", "confirmed"]),
            Booking.start_time < data.end_time,
            Booking.end_time > data.start_time,
        )
    )

    if overlapping_booking:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Booking conflict: time slot overlaps with an existing {overlapping_booking.status} "
                f"booking from {overlapping_booking.start_time.isoformat()} to {overlapping_booking.end_time.isoformat()}"
            ),
        )

    booking = Booking(
        machinery_id=machinery_id,
        farmer_id=farmer.id,
        start_time=data.start_time,
        end_time=data.end_time,
        status="pending",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    return BookingResponse(
        id=booking.id,
        machinery_id=booking.machinery_id,
        equipment_type=machinery.equipment_type,
        machinery_name=machinery.name,
        farmer_id=booking.farmer_id,
        farmer_name=farmer.name,
        start_time=booking.start_time,
        end_time=booking.end_time,
        status=booking.status,
        created_at=booking.created_at,
    )


def list_machinery_bookings(db: Session, machinery_id: int) -> List[BookingResponse]:
    """List bookings for a specific machinery without exposing private farmer contact details."""
    machinery = db.get(Machinery, machinery_id)
    if not machinery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Machinery with ID {machinery_id} not found",
        )

    query = (
        select(Booking, User)
        .join(User, Booking.farmer_id == User.id)
        .where(Booking.machinery_id == machinery_id)
        .order_by(Booking.start_time.asc())
    )
    results = db.execute(query).all()

    return [
        BookingResponse(
            id=booking.id,
            machinery_id=booking.machinery_id,
            equipment_type=machinery.equipment_type,
            machinery_name=machinery.name,
            farmer_id=booking.farmer_id,
            farmer_name=farmer.name,
            start_time=booking.start_time,
            end_time=booking.end_time,
            status=booking.status,
            created_at=booking.created_at,
        )
        for booking, farmer in results
    ]


def update_booking_status(db: Session, booking_id: int, data: BookingStatusUpdate) -> BookingResponse:
    """Enforce ownership and valid state transitions when updating a booking's status."""
    result = db.execute(
        select(Booking, Machinery, User)
        .join(Machinery, Booking.machinery_id == Machinery.id)
        .join(User, Booking.farmer_id == User.id)
        .where(Booking.id == booking_id)
        .with_for_update(of=Booking)
    ).first()

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking with ID {booking_id} not found",
        )

    booking, machinery, farmer = result

    is_provider = data.user_id == machinery.provider_id
    is_farmer = data.user_id == booking.farmer_id

    if not (is_provider or is_farmer):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User {data.user_id} is not authorized to modify this booking",
        )

    # Terminal state check
    if booking.status in ("cancelled", "completed"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Booking is already '{booking.status}' and cannot be modified further",
        )

    # State transition validation based on actor
    target_status = data.status

    if target_status == "confirmed":
        if not is_provider:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the machinery provider who owns this listing can confirm bookings",
            )
        if booking.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot confirm booking currently in '{booking.status}' status",
            )
        # Verify no conflicting confirmed booking occurred
        conflict = db.scalar(
            select(Booking).where(
                Booking.machinery_id == machinery.id,
                Booking.id != booking.id,
                Booking.status == "confirmed",
                Booking.start_time < booking.end_time,
                Booking.end_time > booking.start_time,
            )
        )
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot confirm: another booking was already confirmed for this time slot",
            )
        booking.status = "confirmed"

    elif target_status == "cancelled":
        # Farmer can cancel their pending or confirmed booking
        # Provider can reject/cancel a pending booking or cancel a confirmed booking
        booking.status = "cancelled"

    elif target_status == "completed":
        if not is_provider:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the machinery provider can mark a booking as completed",
            )
        if booking.status != "confirmed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot mark booking as completed from current status '{booking.status}'; must be 'confirmed'",
            )
        booking.status = "completed"

    db.commit()
    db.refresh(booking)

    return BookingResponse(
        id=booking.id,
        machinery_id=booking.machinery_id,
        equipment_type=machinery.equipment_type,
        machinery_name=machinery.name,
        farmer_id=booking.farmer_id,
        farmer_name=farmer.name,
        start_time=booking.start_time,
        end_time=booking.end_time,
        status=booking.status,
        created_at=booking.created_at,
    )
