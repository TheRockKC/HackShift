import math
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.camp import Camp
from app.schemas.camp import (
    CampCreate,
    CampResponse,
    PaginatedCampResponse,
)


def create_camp(db: Session, data: CampCreate) -> CampResponse:
    """Create a new digital literacy / awareness camp.

    Validates that:
    - The coordinator user exists in the database.
    - The coordinator holds the 'admin' role (prototype role authorization).
    - String fields are trimmed and sanitized.
    - The camp is initialized with is_cancelled=False.
    """
    coordinator = db.get(User, data.coordinator_id)
    if not coordinator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Coordinator user with ID {data.coordinator_id} not found",
        )

    if coordinator.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User {data.coordinator_id} has role '{coordinator.role}', but must be 'admin' to create camps",
        )

    camp = Camp(
        title=data.title.strip(),
        description=data.description.strip(),
        scheduled_start=data.scheduled_start,
        scheduled_end=data.scheduled_end,
        venue=data.venue.strip(),
        village=data.village.strip() if data.village and data.village.strip() else None,
        district=data.district.strip(),
        state=data.state.strip(),
        topics=data.topics.strip(),
        contact_person=data.contact_person.strip() if data.contact_person and data.contact_person.strip() else None,
        contact_phone=data.contact_phone.strip() if data.contact_phone and data.contact_phone.strip() else None,
        is_cancelled=False,
    )
    db.add(camp)
    db.commit()
    db.refresh(camp)

    return CampResponse.model_validate(camp)


def list_camps(
    db: Session,
    state: Optional[str] = None,
    district: Optional[str] = None,
    include_past: bool = False,
    page: int = 1,
    page_size: int = 20,
) -> PaginatedCampResponse:
    """List camps with optional state/district filtering and pagination.

    By default:
    - Only non-cancelled camps are returned.
    - Only upcoming camps (scheduled_end >= current UTC time) are returned unless include_past=True.
    - If include_past=True, past camps are included, but cancelled camps are ALWAYS excluded.
    - Results are ordered chronologically by scheduled_start ascending, then id ascending.
    """
    stmt = select(Camp).where(Camp.is_cancelled.is_(False))

    if not include_past:
        now_utc = datetime.now(timezone.utc)
        stmt = stmt.where(Camp.scheduled_end >= now_utc)

    if state and state.strip():
        stmt = stmt.where(Camp.state.ilike(f"%{state.strip()}%"))

    if district and district.strip():
        stmt = stmt.where(Camp.district.ilike(f"%{district.strip()}%"))

    # Compute total count
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.scalar(count_stmt) or 0

    # Apply ordering and pagination
    stmt = stmt.order_by(Camp.scheduled_start.asc(), Camp.id.asc())
    offset = (page - 1) * page_size
    camps = db.scalars(stmt.offset(offset).limit(page_size)).all()

    total_pages = math.ceil(total / page_size) if total > 0 else 0

    return PaginatedCampResponse(
        items=[CampResponse.model_validate(c) for c in camps],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


def get_next_camp(
    db: Session,
    state: Optional[str] = None,
    district: Optional[str] = None,
) -> CampResponse:
    """Return the earliest upcoming, non-cancelled camp.

    Treats a camp as upcoming if scheduled_end >= current UTC time.
    Returns 404 if no matching upcoming camp is found.
    """
    now_utc = datetime.now(timezone.utc)
    stmt = select(Camp).where(
        Camp.is_cancelled.is_(False),
        Camp.scheduled_end >= now_utc,
    )

    if state and state.strip():
        stmt = stmt.where(Camp.state.ilike(f"%{state.strip()}%"))

    if district and district.strip():
        stmt = stmt.where(Camp.district.ilike(f"%{district.strip()}%"))

    stmt = stmt.order_by(Camp.scheduled_start.asc(), Camp.id.asc()).limit(1)
    camp = db.scalar(stmt)

    if not camp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No upcoming camps found matching the criteria",
        )

    return CampResponse.model_validate(camp)


def get_camp_by_id(db: Session, camp_id: int) -> CampResponse:
    """Retrieve details for a single camp by its unique identifier.

    Returns 404 if the camp does not exist.
    """
    camp = db.get(Camp, camp_id)
    if not camp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Camp with ID {camp_id} not found",
        )

    return CampResponse.model_validate(camp)
