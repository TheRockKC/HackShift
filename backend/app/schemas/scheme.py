from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, field_validator


# -----------------------------------------------------------------------------
# Scheme Schemas
# -----------------------------------------------------------------------------

class SchemeResponse(BaseModel):
    id: int
    slug: str
    name: str
    short_description: str
    benefits_summary: str
    category: str
    nodal_ministry: str
    state_applicability: str
    min_land_acres: Optional[Decimal] = None
    max_land_acres: Optional[Decimal] = None
    target_gender: Optional[str] = None
    target_social_categories: Optional[str] = None
    official_portal_url: str
    verification_date: date
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedSchemesResponse(BaseModel):
    items: List[SchemeResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# -----------------------------------------------------------------------------
# Farmer Profile Schemas
# -----------------------------------------------------------------------------

class FarmerProfileUpdate(BaseModel):
    primary_crop_type: Optional[str] = Field(
        None,
        max_length=100,
        description="Optional primary crop category (e.g. cereals, horticulture, pulses, oilseeds, mixed)",
    )
    has_irrigation: Optional[bool] = Field(
        None,
        description="Optional flag indicating access to farm irrigation infrastructure",
    )
    has_kcc: Optional[bool] = Field(
        None,
        description="Optional flag indicating whether farmer possesses a Kisan Credit Card",
    )
    social_category: Optional[str] = Field(
        None,
        description="Optional social category for targeted schemes ('general', 'obc', 'sc', 'st')",
    )
    gender: Optional[str] = Field(
        None,
        description="Optional gender for women-farmer targeted schemes ('male', 'female', 'other')",
    )

    @field_validator("social_category")
    @classmethod
    def validate_social_category(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v_clean = v.strip().lower()
            if v_clean not in ("general", "obc", "sc", "st"):
                raise ValueError("social_category must be one of 'general', 'obc', 'sc', 'st'")
            return v_clean
        return None

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v_clean = v.strip().lower()
            if v_clean not in ("male", "female", "other"):
                raise ValueError("gender must be one of 'male', 'female', 'other'")
            return v_clean
        return None


class FarmerProfileResponse(BaseModel):
    id: int
    farmer_id: int
    primary_crop_type: Optional[str] = None
    has_irrigation: Optional[bool] = None
    has_kcc: Optional[bool] = None
    social_category: Optional[str] = None
    gender: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# -----------------------------------------------------------------------------
# Scheme Matching Schemas
# -----------------------------------------------------------------------------

class SchemeMatchItem(BaseModel):
    scheme_id: int
    slug: str
    name: str
    category: str
    nodal_ministry: str
    state_applicability: str
    official_portal_url: str
    verification_date: date
    match_status: str = "potential_match"
    match_reasons: List[str]
    missing_information: List[str]
    total_landholding_considered_acres: Optional[Decimal] = None
    landholding_calculation_basis: str


class FarmerSchemeMatchesResponse(BaseModel):
    farmer_id: int
    farmer_name: str
    profile_exists: bool
    total_registered_farms: int
    total_registered_acres: Optional[Decimal] = None
    matches: List[SchemeMatchItem]
    disclaimer: str = (
        "DISCLAIMER: All results are preliminary potential matches based solely on your registered farm "
        "and profile details. Official government departments and designated implementing agencies determine "
        "definitive eligibility, verification, and sanctioning."
    )
    profile_advice: Optional[str] = None
