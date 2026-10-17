from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class IrrigationPlanCreate(BaseModel):
    farm_id: int = Field(..., description="ID of the farm to irrigate")
    farmer_id: int = Field(..., description="Farmer user ID requesting the recommendation")
    crop: str = Field(..., min_length=1, max_length=100, description="Crop name, e.g. Wheat, Rice, Cotton, Maize, Tomato")
    growth_stage: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Growth stage: e.g. seedling, vegetative, flowering, fruiting, grain_filling, or maturity",
    )
    soil_type: Optional[str] = Field(
        None,
        max_length=50,
        description="Optional soil classification: clay, sandy, loam, black, or alluvial",
    )
    observed_soil_moisture: Optional[str] = Field(
        None,
        pattern="^(dry|adequate|wet)$",
        description="Observed field surface moisture: 'dry', 'adequate', or 'wet'",
    )
    forecasted_rain_expected: Optional[bool] = Field(
        None,
        description="True if farmer reports significant rain forecast in the next 24-48 hours",
    )


class IrrigationPlanResponse(BaseModel):
    id: int
    farm_id: int
    farm_name: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    crop: str
    growth_stage: str
    recommended_action: str
    scheduled_at: Optional[datetime] = None
    reason: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedIrrigationPlansResponse(BaseModel):
    items: List[IrrigationPlanResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
