from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, model_validator


class CampCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=150, description="Title of the digital literacy / scheme awareness camp")
    description: str = Field(..., min_length=1, description="Detailed agenda and description of the camp")
    scheduled_start: datetime = Field(..., description="Timezone-aware start time of the camp")
    scheduled_end: datetime = Field(..., description="Timezone-aware end time of the camp")
    venue: str = Field(..., min_length=1, max_length=200, description="Venue location (e.g., Panchayat Bhawan, Community Hall)")
    village: Optional[str] = Field(None, max_length=100, description="Optional village name")
    district: str = Field(..., min_length=1, max_length=100, description="District where the camp is conducted")
    state: str = Field(..., min_length=1, max_length=100, description="State where the camp is conducted")
    topics: str = Field(..., min_length=1, description="Topics covered (e.g. PM-KISAN eKYC, digital mandis, mobile banking)")
    contact_person: Optional[str] = Field(None, max_length=150, description="Optional contact coordinator name")
    contact_phone: Optional[str] = Field(None, max_length=50, description="Optional coordinator phone number")
    coordinator_id: int = Field(..., description="User ID of the organizer creating this camp. Prototype check requires 'admin' role.")

    @model_validator(mode="after")
    def validate_camp_inputs(self):
        # Verify timezone awareness
        if self.scheduled_start.tzinfo is None or self.scheduled_start.tzinfo.utcoffset(self.scheduled_start) is None:
            raise ValueError("scheduled_start must be a timezone-aware timestamp")
        if self.scheduled_end.tzinfo is None or self.scheduled_end.tzinfo.utcoffset(self.scheduled_end) is None:
            raise ValueError("scheduled_end must be a timezone-aware timestamp")

        # Verify scheduled_end > scheduled_start
        if self.scheduled_end <= self.scheduled_start:
            raise ValueError("scheduled_end must be strictly later than scheduled_start")

        # Verify non-empty required strings
        for field_name in ("title", "description", "venue", "district", "state", "topics"):
            val = getattr(self, field_name)
            if not val or not val.strip():
                raise ValueError(f"{field_name} must not be blank")

        return self


class CampResponse(BaseModel):
    id: int
    title: str
    description: str
    scheduled_start: datetime
    scheduled_end: datetime
    venue: str
    village: Optional[str] = None
    district: str
    state: str
    topics: str
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    is_cancelled: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedCampResponse(BaseModel):
    items: List[CampResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# Alias for naming consistency
PaginatedCampsResponse = PaginatedCampResponse
