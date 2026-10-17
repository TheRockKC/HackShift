"""FarmConnect Camps module: Digital literacy and scheme awareness camps for farmers."""

from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, Boolean, DateTime, func, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Camp(Base):
    """Digital literacy, scheme awareness, and platform training camps organized for rural communities."""

    __tablename__ = "camps"
    __table_args__ = (
        CheckConstraint(
            "scheduled_end > scheduled_start",
            name="ck_camps_end_after_start",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    scheduled_start: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )
    scheduled_end: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )
    venue: Mapped[str] = mapped_column(String(200), nullable=False)
    village: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    district: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    state: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    topics: Mapped[str] = mapped_column(Text, nullable=False)
    contact_person: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_cancelled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default="false",
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
