from typing import Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.farm import Farm
from decimal import Decimal

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=255)
    role: str = Field("farmer", description="Role: 'farmer' or 'buyer'")
    password: Optional[str] = None
    state: str = Field("Punjab", max_length=100)
    district: str = Field("Ludhiana", max_length=100)
    farm_name: Optional[str] = Field(None, max_length=150)
    farm_location: Optional[str] = Field(None, max_length=255)
    farm_size_acres: Optional[float] = Field(10.0, ge=0.1)


class LoginRequest(BaseModel):
    phone: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new farmer or buyer, persisting their record and farm in the shared database."""
    role = payload.role if payload.role in ("farmer", "buyer", "machinery_provider") else "farmer"
    
    # Check if user with this phone or email already exists
    existing = None
    if payload.phone:
        existing = db.scalar(select(User).where(User.phone == payload.phone.strip()))
    if not existing and payload.email:
        existing = db.scalar(select(User).where(User.email == payload.email.strip()))

    if existing:
        user = existing
    else:
        user = User(
            name=payload.name.strip(),
            email=payload.email.strip() if payload.email else f"user_{payload.phone or 'farmer'}@anndata.org",
            phone=payload.phone.strip() if payload.phone else None,
            role=role,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # If farmer, ensure a farm record is created or linked
    farm = None
    if role == "farmer":
        farm = db.scalar(select(Farm).where(Farm.farmer_id == user.id))
        if not farm:
            farm_name = payload.farm_name or payload.farm_location or f"{user.name}'s Farm"
            farm = Farm(
                farmer_id=user.id,
                name=farm_name.strip(),
                state=payload.state.strip(),
                district=payload.district.strip(),
                area_acres=Decimal(str(payload.farm_size_acres or 10.0)),
            )
            db.add(farm)
            db.commit()
            db.refresh(farm)

    return {
        "status": "success",
        "user": {
            "id": user.id,
            "name": user.name,
            "phone": user.phone,
            "email": user.email,
            "role": user.role,
        },
        "farm": {
            "id": farm.id,
            "name": farm.name,
            "state": farm.state,
            "district": farm.district,
            "area_acres": float(farm.area_acres) if farm.area_acres else 10.0,
        } if farm else None,
    }


@router.post("/login")
def login_user_endpoint(payload: LoginRequest, db: Session = Depends(get_db)):
    """Log in an existing farmer or buyer by phone or role."""
    user = None
    if payload.phone:
        user = db.scalar(select(User).where(User.phone == payload.phone.strip()))
    if not user and payload.email:
        user = db.scalar(select(User).where(User.email == payload.email.strip()))
    if not user and payload.role:
        user = db.scalar(select(User).where(User.role == payload.role).order_by(User.id.asc()))
    
    if not user:
        # Default to primary farmer
        user = db.scalar(select(User).order_by(User.id.asc()))

    farm = db.scalar(select(Farm).where(Farm.farmer_id == user.id)) if user else None

    return {
        "status": "success",
        "user": {
            "id": user.id,
            "name": user.name,
            "phone": user.phone,
            "email": user.email,
            "role": user.role,
        },
        "farm": {
            "id": farm.id,
            "name": farm.name,
            "state": farm.state,
            "district": farm.district,
            "area_acres": float(farm.area_acres) if farm and farm.area_acres else 10.0,
        } if farm else None,
    }
