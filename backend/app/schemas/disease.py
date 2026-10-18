from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class TopPredictionItem(BaseModel):
    class_name: str
    score: float


class DiseaseDiagnosisResponse(BaseModel):
    """Full diagnosis and preliminary advisory response returned to the client."""

    id: int = Field(..., description="Persisted diagnosis record ID in database")
    farm_id: Optional[int] = Field(None, description="Associated farm ID if provided")
    crop: str = Field(..., description="Crop category evaluated: tomato, wheat, or rice")
    predicted_class: str = Field(..., description="Model predicted disease or healthy classification")
    confidence: Decimal = Field(..., description="Softmax relative confidence score (0.0000 to 1.0000)")
    top_predictions: List[TopPredictionItem] = Field(
        default_factory=list, description="Top-3 candidate predictions with softmax scores"
    )
    treatment: Dict[str, Any] = Field(
        default_factory=dict, description="Treatment recommendation dictionary from guide or safe fallback"
    )
    needs_expert_review: bool = Field(
        ..., description="Indicates if physical inspection by an agronomic specialist is recommended"
    )
    guidance_available: bool = Field(
        ..., description="True if verified treatment guidance was found in the treatment catalogue"
    )
    image_reference: Optional[str] = Field(None, description="Uploaded image filename reference")
    score_interpretation: str = Field(..., description="Disclaimer regarding raw softmax confidence scores")
    disclaimer: str = Field(..., description="Agronomic safety disclaimer")
    created_at: datetime = Field(..., description="UTC creation timestamp")

    model_config = ConfigDict(from_attributes=True)


class DiseaseDetectionItem(BaseModel):
    """Historical diagnosis record schema."""

    id: int
    farm_id: Optional[int] = None
    image_reference: Optional[str] = None
    predicted_class: str
    confidence: Decimal
    needs_expert_review: bool
    guidance_available: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedDiseaseDetectionResponse(BaseModel):
    """Paginated list of historical crop disease diagnoses."""

    items: List[DiseaseDetectionItem]
    total: int
    page: int
    page_size: int
    total_pages: int
