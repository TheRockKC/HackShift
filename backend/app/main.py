import logging
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.config import settings
from app.database import get_db
from fastapi.middleware.cors import CORSMiddleware
from app.routers.cropclock import router as cropclock_router
from app.routers.fairqueue import router as fairqueue_router
from app.routers.waterwindow import router as waterwindow_router
from app.routers.camp import router as camp_router
from app.routers.scheme import router as scheme_router

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Smart Farming Platform API",
    description="Backend services for CropClock, FairQueue, WaterWindow, FarmConnect Camps, and SchemeSaathi.",
    version="0.1.0",
)

# Enable CORS for local and staging frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register module routers
app.include_router(cropclock_router)
app.include_router(fairqueue_router)
app.include_router(waterwindow_router)
app.include_router(camp_router)
app.include_router(scheme_router)


@app.get("/")
def read_root():
    return {
        "message": "Welcome to Smart Farming Platform API",
        "docs_url": "/docs",
        "health_check": "/api/health",
    }


@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    db_status = "unavailable"
    db_version = ""
    try:
        db_version = db.execute(text("SELECT version();")).scalar()
        db_status = "connected"
    except Exception as exc:
        logger.error("Database health check failed: %s", exc, exc_info=True)
        db_status = "unavailable"

    return {
        "status": "ok",
        "service": "smart-farming-backend",
        "database": {
            "status": db_status,
            "branch": settings.NEON_BRANCH if db_status == "connected" else "unknown",
            "server_version": db_version[:50] if db_version else "",
        },
    }
