from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, model_validator


# -----------------------------------------------------------------------------
# Machinery Schemas
# -----------------------------------------------------------------------------

class MachineryCreate(BaseModel):
    provider_id: int = Field(..., description="User ID of the machinery provider")
    equipment_type: str = Field(..., min_length=1, max_length=100, description="Equipment type (e.g., Tractor, Harvester, Seeder)")
    name: Optional[str] = Field(None, max_length=150, description="Optional machine name or model (e.g., John Deere 5050D)")
    hourly_rate: Optional[Decimal] = Field(None, ge=0, decimal_places=2, description="Rental rate per hour in INR")
    daily_rate: Optional[Decimal] = Field(None, ge=0, decimal_places=2, description="Rental rate per day in INR")
    state: str = Field(..., min_length=1, max_length=100, description="State where equipment is located")
    district: str = Field(..., min_length=1, max_length=100, description="District where equipment is located")

    @model_validator(mode="after")
    def validate_rates(self):
        hourly = self.hourly_rate
        daily = self.daily_rate

        has_positive_hourly = hourly is not None and hourly > 0
        has_positive_daily = daily is not None and daily > 0

        if not (has_positive_hourly or has_positive_daily):
            raise ValueError(
                "At least one positive pricing rate (hourly_rate > 0 or daily_rate > 0) must be supplied"
            )
        return self


# -----------------------------------------------------------------------------
# Booking Schemas
# -----------------------------------------------------------------------------

class BookingCreate(BaseModel):
    farmer_id: Optional[int] = Field(None, description="User ID of the farmer requesting the booking")
    start_time: datetime = Field(..., description="Timezone-aware start time of rental")
    end_time: datetime = Field(..., description="Timezone-aware end time of rental")

    @model_validator(mode="after")
    def validate_time_range(self):
        if self.start_time.tzinfo is None or self.end_time.tzinfo is None:
            raise ValueError("Both start_time and end_time must be timezone-aware timestamps")
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be strictly later than start_time")
        return self


class BookingStatusUpdate(BaseModel):
    user_id: int = Field(..., description="User ID of the actor performing the status update (farmer or provider)")
    status: str = Field(..., pattern="^(confirmed|cancelled|completed)$", description="Target status ('confirmed', 'cancelled', or 'completed')")


class BookingResponse(BaseModel):
    id: int
    machinery_id: int
    equipment_type: Optional[str] = None
    machinery_name: Optional[str] = None
    farmer_id: int
    farmer_name: Optional[str] = None
    start_time: datetime
    end_time: datetime
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# -----------------------------------------------------------------------------
# Machinery Schemas
# -----------------------------------------------------------------------------

class MachineryResponse(BaseModel):
    id: int
    provider_id: int
    provider_name: Optional[str] = None
    equipment_type: str
    name: Optional[str] = None
    hourly_rate: Optional[Decimal] = None
    daily_rate: Optional[Decimal] = None
    state: str
    district: str
    is_available: bool
    created_at: datetime
    active_bookings: List[BookingResponse] = Field(default_factory=list, description="Active or upcoming reservations")
    is_currently_reserved: bool = Field(default=False, description="Whether currently occupied in a reserved time slot")
    next_available_at: Optional[datetime] = Field(default=None, description="When the machine becomes available if currently reserved")

    model_config = ConfigDict(from_attributes=True)


class PaginatedMachineryResponse(BaseModel):
    items: List[MachineryResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
