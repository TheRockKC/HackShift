import logging
import math
from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.farm import Farm
from app.models.irrigation import IrrigationPlan
from app.schemas.waterwindow import (
    IrrigationPlanCreate,
    IrrigationPlanResponse,
    PaginatedIrrigationPlansResponse,
)
from app.services import weather_service

logger = logging.getLogger(__name__)


def evaluate_irrigation_recommendation(
    crop: str,
    growth_stage: str,
    soil_type: Optional[str] = None,
    observed_soil_moisture: Optional[str] = None,
    forecasted_rain_expected: Optional[bool] = None,
    weather_summary: Optional[str] = None,
) -> Tuple[str, Optional[datetime], str]:
    """Deterministic, explainable rule engine for prototype irrigation planning.

    Generates recommended action, proposed scheduled time (timezone-aware UTC),
    and a clear agronomic rationale based on crop growth stage, soil characteristics,
    and farmer-reported moisture/weather alerts.
    """
    stage = growth_stage.strip().lower()
    crop_name = crop.strip().capitalize()
    now = datetime.now(timezone.utc)

    # Base rule evaluation by physiological growth stage
    if any(k in stage for k in ("maturity", "harvest", "ripening")):
        action = f"Withhold irrigation for {crop_name}. Facilitate natural field drying and pre-harvest crop ripening."
        scheduled_at = None
        base_reason = (
            f"At the {growth_stage} stage for {crop_name}, continued irrigation delays maturity, "
            f"dilutes sugar/dry matter concentration, and increases vulnerability to fungal rot and lodging."
        )
    elif any(k in stage for k in ("flower", "heading", "tassel", "anthesis")):
        action = f"Apply full-depth irrigation cycle (approx. 45-50mm) within 24 hours during early morning hours."
        scheduled_at = (now + timedelta(days=1)).replace(hour=6, minute=0, second=0, microsecond=0)
        base_reason = (
            f"Flowering is the most moisture-critical physiological phase for {crop_name}. "
            f"Moisture deficit during anthesis impairs pollination and causes irreversible yield reduction."
        )
    elif any(k in stage for k in ("fruit", "grain", "pod", "milk", "dough", "filling")):
        action = f"Maintain consistent root-zone moisture with moderate irrigation (approx. 35-40mm) every 4-5 days."
        scheduled_at = (now + timedelta(days=1)).replace(hour=6, minute=0, second=0, microsecond=0)
        base_reason = (
            f"Grain/fruit filling in {crop_name} requires uniform soil water potential to support dry matter "
            f"translocation and prevent grain shriveling."
        )
    elif any(k in stage for k in ("seedling", "germination", "nursery", "sprout")):
        action = f"Apply light, frequent surface irrigation (approx. 15-20mm) to prevent crusting without standing water."
        scheduled_at = (now + timedelta(days=1)).replace(hour=6, minute=0, second=0, microsecond=0)
        base_reason = (
            f"Seedlings of {crop_name} possess shallow root systems. Light applications keep topsoil pliable "
            f"while mitigating damping-off and root hypoxia."
        )
    else:
        # Default / Vegetative stage
        action = f"Apply routine vegetative irrigation (approx. 30-35mm) to support stem elongation and foliage expansion."
        scheduled_at = (now + timedelta(days=2)).replace(hour=6, minute=0, second=0, microsecond=0)
        base_reason = (
            f"Vegetative stage for {crop_name} requires balanced hydration to sustain transpiration "
            f"and support active canopy development."
        )

    # Modifier adjustments: Rain alerts
    modifiers = []
    if forecasted_rain_expected:
        action = (
            f"Postpone scheduled irrigation by 48-72 hours. Rely on natural precipitation and inspect field "
            f"accumulation before supplementary pumping."
        )
        scheduled_at = (now + timedelta(days=3)).replace(hour=6, minute=0, second=0, microsecond=0)
        modifiers.append("Weather alert: Significant rainfall forecasted; postponing conserves water and prevents waterlogging.")

    # Modifier adjustments: Surface soil moisture
    if observed_soil_moisture == "wet":
        action = "Suspend irrigation immediately. Re-evaluate root-zone drainage in 48 hours."
        scheduled_at = None
        modifiers.append("Moisture observation: Field soil is saturated; additional irrigation risks root asphyxiation.")
    elif observed_soil_moisture == "dry" and not forecasted_rain_expected:
        action = f"Priority irrigation: {action}"
        scheduled_at = (now + timedelta(hours=12)).replace(minute=0, second=0, microsecond=0)
        modifiers.append("Moisture observation: Topsoil is severely dry; expedited watering recommended to alleviate wilting.")

    # Modifier adjustments: Soil texture
    if soil_type:
        st = soil_type.strip().lower()
        if "sandy" in st:
            modifiers.append(f"Soil texture ({soil_type}): High hydraulic conductivity; split total water into shorter, more frequent cycles.")
        elif "clay" in st or "black" in st:
            modifiers.append(f"Soil texture ({soil_type}): High clay retention; lengthen intervals between cycles to ensure root aeration.")
        elif "loam" in st:
            modifiers.append(f"Soil texture ({soil_type}): Ideal balanced water holding capacity.")

    if weather_summary:
        modifiers.append(weather_summary)

    # Assemble explainable rationale
    reason_parts = [base_reason]
    if modifiers:
        reason_parts.extend(modifiers)
    reason_parts.append(
        "[WaterWindow Prototype Engine: Deterministic rule-based agronomic heuristic. "
        "Consult local agricultural extension officers or in-situ tensiometers before execution.]"
    )

    full_reason = " ".join(reason_parts)
    return action, scheduled_at, full_reason


def create_irrigation_plan(db: Session, data: IrrigationPlanCreate) -> IrrigationPlanResponse:
    """Validate farm ownership and generate a deterministic irrigation plan."""
    farm = db.get(Farm, data.farm_id)
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farm with ID {data.farm_id} not found",
        )

    farmer = db.get(User, data.farmer_id)
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farmer user with ID {data.farmer_id} not found",
        )

    if farmer.role not in ("farmer", "admin"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User {data.farmer_id} has role '{farmer.role}', but must be 'farmer' to generate irrigation plans",
        )

    if farm.farmer_id != data.farmer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Farmer with ID {data.farmer_id} does not own farm {data.farm_id}",
        )

    # Autonomous Weather Integration:
    rain_expected = data.forecasted_rain_expected
    weather_summary = None

    try:
        weather_data = weather_service.fetch_weather_and_predict_rain(
            district=farm.district,
            state=farm.state,
            latitude=float(farm.latitude) if farm.latitude is not None else None,
            longitude=float(farm.longitude) if farm.longitude is not None else None,
        )
        if rain_expected is None:
            # Self-predict rain using meteorological forecast
            rain_expected = weather_data.get("is_rain_forecasted", False)

        weather_summary = (
            f"Weather AI Radar ({weather_data.get('location')}): {weather_data.get('condition')} {weather_data.get('icon')}, "
            f"Temp: {weather_data.get('temperature')}°C, Humidity: {weather_data.get('humidity')}%, "
            f"48h Rain Risk: {weather_data.get('rain_probability_48h')}% ({weather_data.get('rainfall_48h_mm')}mm in 48h). "
            f"{weather_data.get('tubewell_advice')}"
        )
    except Exception as exc:
        logger.warning("Could not auto-fetch live weather for farm %s: %s", farm.id, exc)
        if rain_expected is None:
            rain_expected = False

    action, scheduled_at, reason = evaluate_irrigation_recommendation(
        crop=data.crop,
        growth_stage=data.growth_stage,
        soil_type=data.soil_type,
        observed_soil_moisture=data.observed_soil_moisture,
        forecasted_rain_expected=rain_expected,
        weather_summary=weather_summary,
    )

    plan = IrrigationPlan(
        farm_id=data.farm_id,
        crop=data.crop.strip(),
        growth_stage=data.growth_stage.strip(),
        recommended_action=action,
        scheduled_at=scheduled_at,
        reason=reason,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    return IrrigationPlanResponse(
        id=plan.id,
        farm_id=plan.farm_id,
        farm_name=farm.name,
        state=farm.state,
        district=farm.district,
        crop=plan.crop,
        growth_stage=plan.growth_stage,
        recommended_action=plan.recommended_action,
        scheduled_at=plan.scheduled_at,
        reason=plan.reason,
        created_at=plan.created_at,
    )


def list_irrigation_plans(
    db: Session,
    farm_id: Optional[int] = None,
    crop: Optional[str] = None,
    growth_stage: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> PaginatedIrrigationPlansResponse:
    """Retrieve saved irrigation plans with filtering and pagination."""
    query = select(IrrigationPlan, Farm).join(Farm, IrrigationPlan.farm_id == Farm.id)

    if farm_id is not None:
        query = query.where(IrrigationPlan.farm_id == farm_id)
    if crop:
        query = query.where(IrrigationPlan.crop.ilike(f"%{crop.strip()}%"))
    if growth_stage:
        query = query.where(IrrigationPlan.growth_stage.ilike(f"%{growth_stage.strip()}%"))

    count_subquery = query.subquery()
    total = db.scalar(select(func.count()).select_from(count_subquery)) or 0

    offset = (page - 1) * page_size
    query = query.order_by(IrrigationPlan.created_at.desc()).offset(offset).limit(page_size)
    results = db.execute(query).all()

    items = [
        IrrigationPlanResponse(
            id=plan.id,
            farm_id=plan.farm_id,
            farm_name=farm.name,
            state=farm.state,
            district=farm.district,
            crop=plan.crop,
            growth_stage=plan.growth_stage,
            recommended_action=plan.recommended_action,
            scheduled_at=plan.scheduled_at,
            reason=plan.reason,
            created_at=plan.created_at,
        )
        for plan, farm in results
    ]

    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return PaginatedIrrigationPlansResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


def get_irrigation_plan(db: Session, plan_id: int) -> IrrigationPlanResponse:
    """Retrieve details for a single saved irrigation plan."""
    result = db.execute(
        select(IrrigationPlan, Farm)
        .join(Farm, IrrigationPlan.farm_id == Farm.id)
        .where(IrrigationPlan.id == plan_id)
    ).first()

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Irrigation plan with ID {plan_id} not found",
        )

    plan, farm = result
    return IrrigationPlanResponse(
        id=plan.id,
        farm_id=plan.farm_id,
        farm_name=farm.name,
        state=farm.state,
        district=farm.district,
        crop=plan.crop,
        growth_stage=plan.growth_stage,
        recommended_action=plan.recommended_action,
        scheduled_at=plan.scheduled_at,
        reason=plan.reason,
        created_at=plan.created_at,
    )
