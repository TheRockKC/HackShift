"""AI Disease Detection module: Crop disease classification records.

Note: Image binaries are NOT stored in the database. Instead, an external file/storage
URI reference is maintained in `image_reference`.
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from sqlalchemy import String, Boolean, DateTime, Numeric, ForeignKey, func, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DiseaseDetection(Base):
    """Crop disease diagnosis and agricultural advice records."""

    __tablename__ = "disease_detections"
    __table_args__ = (
        CheckConstraint(
            "confidence >= 0 AND confidence <= 1",
            name="ck_disease_confidence_range",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    farm_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("farms.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    image_reference: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    predicted_class: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    confidence: Mapped[Decimal] = mapped_column(Numeric(5, 4), nullable=False)
    needs_expert_review: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default="true",
        index=True,
    )
    guidance_available: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default="false",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    farm: Mapped[Optional["Farm"]] = relationship("Farm", back_populates="disease_detections")
