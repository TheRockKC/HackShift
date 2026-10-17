from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


# -----------------------------------------------------------------------------
# Harvest Schemas
# -----------------------------------------------------------------------------

class HarvestCreate(BaseModel):
    farm_id: int = Field(..., description="ID of the farm where the crop is produced")
    farmer_id: int = Field(..., description="Farmer user ID requesting the listing creation")
    crop: str = Field(..., min_length=1, max_length=100, description="Crop name, e.g. Wheat, Basmati Rice")
    quantity_kg: Decimal = Field(..., gt=0, decimal_places=2, description="Available harvest quantity in kilograms")
    expected_harvest_date: date = Field(..., description="Date when the harvest is expected to be ready")
    quality_grade: Optional[str] = Field(None, max_length=50, description="Optional quality grade (e.g. Grade A, FAQ)")


class HarvestResponse(BaseModel):
    id: int
    farm_id: int
    crop: str
    quantity_kg: Decimal
    expected_harvest_date: date
    quality_grade: Optional[str]
    status: str
    created_at: datetime
    farm_name: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PaginatedHarvestsResponse(BaseModel):
    items: List[HarvestResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# -----------------------------------------------------------------------------
# Buyer Offer Schemas
# -----------------------------------------------------------------------------

class OfferCreate(BaseModel):
    buyer_id: int = Field(..., description="Buyer user ID submitting the offer")
    price_per_kg: Decimal = Field(..., gt=0, decimal_places=2, description="Bid price per kg in local currency (INR)")
    transport_cost: Decimal = Field(
        Decimal("0.00"),
        ge=0,
        decimal_places=2,
        description="Total transport cost assumed by the buyer for this offer",
    )
    other_costs: Decimal = Field(
        Decimal("0.00"),
        ge=0,
        decimal_places=2,
        description="Any other logistics, grading, or packaging costs for this offer",
    )
    collection_time: Optional[datetime] = Field(
        None,
        description="Proposed date and time for pickup/collection",
    )


class OfferStatusUpdate(BaseModel):
    farmer_id: int = Field(..., description="Farmer user ID performing the authorization/status change")
    status: str = Field(..., pattern="^(accepted|rejected)$", description="Target status ('accepted' or 'rejected')")


class OfferResponse(BaseModel):
    id: int
    harvest_id: int
    buyer_id: int
    buyer_name: Optional[str] = None
    price_per_kg: Decimal
    transport_cost: Decimal
    other_costs: Decimal
    collection_time: Optional[datetime]
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# -----------------------------------------------------------------------------
# Net-Earnings Comparison Schemas
# -----------------------------------------------------------------------------

class OfferComparisonItem(BaseModel):
    offer_id: int
    buyer_id: int
    buyer_name: Optional[str]
    price_per_kg: Decimal
    quantity_kg: Decimal
    gross_value: Decimal
    transport_cost: Decimal
    other_costs: Decimal
    total_costs: Decimal
    estimated_net: Decimal
    status: str
    collection_time: Optional[datetime]


class CompareOffersResponse(BaseModel):
    harvest_id: int
    crop: str
    quantity_kg: Decimal
    harvest_status: str
    disclaimer: str = (
        "These figures are estimates calculated from buyer-submitted rates and total offer costs. "
        "They do not constitute guaranteed final proceeds."
    )
    total_offers_evaluated: int
    offers: List[OfferComparisonItem]
