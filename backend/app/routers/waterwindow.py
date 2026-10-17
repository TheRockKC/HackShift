from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.waterwindow import (
    IrrigationPlanCreate,
    IrrigationPlanResponse,
    PaginatedIrrigationPlansResponse,
)
from app.services import waterwindow_service

router = APIRouter(tags=["WaterWindow - Intelligent Irrigation Planning"])


@router.post(
    "/api/irrigation/plan",
    response_model=IrrigationPlanResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate and persist an irrigation plan recommendation",
)
def create_irrigation_plan_endpoint(
    payload: IrrigationPlanCreate,
    db: Session = Depends(get_db),
):
    """Generate an explainable irrigation recommendation and schedule for a farm.

    - Verifies farm and farmer existence.
    - Ensures farmer ownership of the specified farm.
    - Evaluates deterministic, stage-specific crop water requirements.
    - Integrates optional soil texture, observed moisture, and rainfall alerts.
    - Persists and returns the generated plan.
    """
    return waterwindow_service.create_irrigation_plan(db=db, data=payload)


@router.get(
    "/api/irrigation/plans",
    response_model=PaginatedIrrigationPlansResponse,
    summary="Retrieve saved irrigation plans with filters and pagination",
)
def list_irrigation_plans_endpoint(
    farm_id: Optional[int] = Query(None, description="Filter by farm ID"),
    crop: Optional[str] = Query(None, description="Filter by crop name (case-insensitive substring)"),
    growth_stage: Optional[str] = Query(None, description="Filter by growth stage (case-insensitive substring)"),
    page: int = Query(1, ge=1, description="Page number, 1-indexed"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    db: Session = Depends(get_db),
):
    """List historical and scheduled irrigation plans with optional filters and pagination."""
    return waterwindow_service.list_irrigation_plans(
        db=db,
        farm_id=farm_id,
        crop=crop,
        growth_stage=growth_stage,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/api/irrigation/plans/{plan_id}",
    response_model=IrrigationPlanResponse,
    summary="Retrieve details for a single saved irrigation plan",
)
def get_irrigation_plan_endpoint(
    plan_id: int,
    db: Session = Depends(get_db),
):
    """Retrieve details for a specific irrigation plan by ID."""
    return waterwindow_service.get_irrigation_plan(db=db, plan_id=plan_id)
