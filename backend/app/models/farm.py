from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from sqlalchemy import String, DateTime, Numeric, ForeignKey, func, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Farm(Base):
    """Farm entity associated with a farmer user, holding geographical and field data."""

    __tablename__ = "farms"
    __table_args__ = (
        CheckConstraint(
            "area_acres IS NULL OR area_acres > 0",
            name="ck_farms_area_acres_positive",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    farmer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    state: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    district: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    latitude: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 7), nullable=True)
    longitude: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 7), nullable=True)
    area_acres: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    farmer: Mapped["User"] = relationship("User", back_populates="farms")
    harvests: Mapped[List["Harvest"]] = relationship(
        "Harvest",
        back_populates="farm",
        cascade="all, delete-orphan",
    )
    irrigation_plans: Mapped[List["IrrigationPlan"]] = relationship(
        "IrrigationPlan",
        back_populates="farm",
        cascade="all, delete-orphan",
    )
    disease_detections: Mapped[List["DiseaseDetection"]] = relationship(
        "DiseaseDetection",
        back_populates="farm",
    )
