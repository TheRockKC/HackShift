"""SchemeSaathi module: Government scheme catalogue and privacy-first farmer profiles."""

from datetime import datetime, date
from decimal import Decimal
from typing import Optional
from sqlalchemy import (
    String,
    Text,
    Date,
    DateTime,
    Numeric,
    Boolean,
    ForeignKey,
    func,
    CheckConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Scheme(Base):
    """Catalogue of official central and state agricultural support schemes."""

    __tablename__ = "schemes"
    __table_args__ = (
        CheckConstraint(
            "min_land_acres IS NULL OR min_land_acres >= 0",
            name="ck_schemes_min_land_non_negative",
        ),
        CheckConstraint(
            "max_land_acres IS NULL OR max_land_acres >= 0",
            name="ck_schemes_max_land_non_negative",
        ),
        CheckConstraint(
            "(min_land_acres IS NULL OR max_land_acres IS NULL) OR max_land_acres >= min_land_acres",
            name="ck_schemes_land_range",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    short_description: Mapped[str] = mapped_column(Text, nullable=False)
    benefits_summary: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    nodal_ministry: Mapped[str] = mapped_column(String(200), nullable=False)
    state_applicability: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )  # e.g., "All India", "Punjab", "Haryana", "Maharashtra"
    min_land_acres: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    max_land_acres: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    target_gender: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # e.g., "female", "all"
    target_social_categories: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )  # e.g., "all", "sc,st", "small_marginal"
    official_portal_url: Mapped[str] = mapped_column(String(255), nullable=False)
    verification_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_active: Mapped[bool] = mapped_column(
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
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class FarmerProfile(Base):
    """Non-sensitive profile attributes for matching farmers with eligible government schemes.

    Optionality & Privacy Notice:
    - All demographic and agricultural attributes are completely optional.
    - No high-risk personal identifiers (Aadhaar, PAN, bank account numbers) are ever stored.
    - Landholding size is dynamically derived from the farmer's registered Farm entities.
    """

    __tablename__ = "farmer_profiles"
    __table_args__ = (
        CheckConstraint(
            "social_category IS NULL OR social_category IN ('general', 'obc', 'sc', 'st')",
            name="ck_farmer_profiles_social_category",
        ),
        CheckConstraint(
            "gender IS NULL OR gender IN ('male', 'female', 'other')",
            name="ck_farmer_profiles_gender",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    farmer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    primary_crop_type: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )  # e.g. "cereals", "horticulture", "pulses", "oilseeds", "mixed"
    has_irrigation: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    has_kcc: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)  # Holds Kisan Credit Card
    social_category: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )  # "general", "obc", "sc", "st"
    gender: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # "male", "female", "other"
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    farmer: Mapped["User"] = relationship("User")
