"""FairQueue module: Machinery listings and scheduling models.

Rate Representation:
Rates are stored as Decimal numbers (Numeric(10, 2)) in local currency (INR).
- `hourly_rate`: Pricing charged per hour of equipment usage.
- `daily_rate`: Pricing charged per full day of equipment usage.
A machine listing MUST have at least one valid pricing rate supplied (hourly, daily, or both).
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from sqlalchemy import String, Boolean, DateTime, Numeric, ForeignKey, func, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Machinery(Base):
    """Agricultural equipment listing for rental or custom hiring in FairQueue."""

    __tablename__ = "machinery"
    __table_args__ = (
        CheckConstraint(
            "(hourly_rate IS NOT NULL) OR (daily_rate IS NOT NULL)",
            name="ck_machinery_rate_present",
        ),
        CheckConstraint(
            "hourly_rate IS NULL OR hourly_rate >= 0",
            name="ck_machinery_hourly_rate_non_negative",
        ),
        CheckConstraint(
            "daily_rate IS NULL OR daily_rate >= 0",
            name="ck_machinery_daily_rate_non_negative",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    provider_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    equipment_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    hourly_rate: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    daily_rate: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    state: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    district: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    is_available: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default="true",
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    provider: Mapped["User"] = relationship("User", back_populates="machinery")
    bookings: Mapped[List["Booking"]] = relationship(
        "Booking",
        back_populates="machinery",
        cascade="all, delete-orphan",
    )


class Booking(Base):
    """Equipment reservation and rental schedule in FairQueue."""

    __tablename__ = "bookings"
    __table_args__ = (
        CheckConstraint(
            "end_time > start_time",
            name="ck_bookings_end_after_start",
        ),
        CheckConstraint(
            "status IN ('pending', 'confirmed', 'cancelled', 'completed')",
            name="ck_bookings_status",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    machinery_id: Mapped[int] = mapped_column(
        ForeignKey("machinery.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    farmer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )
    end_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        server_default="pending",
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    machinery: Mapped["Machinery"] = relationship("Machinery", back_populates="bookings")
    farmer: Mapped["User"] = relationship("User", back_populates="bookings")
