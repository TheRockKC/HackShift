from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List
from sqlalchemy import String, DateTime, Date, Numeric, ForeignKey, func, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Harvest(Base):
    """Harvest listing for the CropClock module representing crops ready or scheduled for harvest."""

    __tablename__ = "harvests"
    __table_args__ = (
        CheckConstraint(
            "quantity_kg > 0",
            name="ck_harvests_quantity_kg_positive",
        ),
        CheckConstraint(
            "status IN ('available', 'reserved', 'sold', 'cancelled')",
            name="ck_harvests_status",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    farm_id: Mapped[int] = mapped_column(
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    crop: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    quantity_kg: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    expected_harvest_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    quality_grade: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        server_default="available",
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    farm: Mapped["Farm"] = relationship("Farm", back_populates="harvests")
    buyer_offers: Mapped[List["BuyerOffer"]] = relationship(
        "BuyerOffer",
        back_populates="harvest",
        cascade="all, delete-orphan",
    )


class BuyerOffer(Base):
    """Bid or purchase offer submitted by a buyer on a specific harvest in CropClock."""

    __tablename__ = "buyer_offers"
    __table_args__ = (
        CheckConstraint(
            "price_per_kg > 0",
            name="ck_buyer_offers_price_per_kg_positive",
        ),
        CheckConstraint(
            "transport_cost >= 0",
            name="ck_buyer_offers_transport_cost_non_negative",
        ),
        CheckConstraint(
            "other_costs >= 0",
            name="ck_buyer_offers_other_costs_non_negative",
        ),
        CheckConstraint(
            "status IN ('pending', 'accepted', 'rejected', 'withdrawn')",
            name="ck_buyer_offers_status",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    harvest_id: Mapped[int] = mapped_column(
        ForeignKey("harvests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    buyer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    price_per_kg: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    transport_cost: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        server_default="0.00",
    )
    other_costs: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        server_default="0.00",
    )
    collection_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
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
    harvest: Mapped["Harvest"] = relationship("Harvest", back_populates="buyer_offers")
    buyer: Mapped["User"] = relationship("User", back_populates="buyer_offers")
