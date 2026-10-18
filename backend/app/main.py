import logging
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.config import settings
from contextlib import asynccontextmanager
from app.database import get_db, Base, engine
import app.models  # noqa: F401
from fastapi.middleware.cors import CORSMiddleware
from app.routers.cropclock import router as cropclock_router
from app.routers.fairqueue import router as fairqueue_router
from app.routers.waterwindow import router as waterwindow_router
from app.routers.camp import router as camp_router
from app.routers.scheme import router as scheme_router
from app.routers.disease import router as disease_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create tables if they don't already exist
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as exc:
        logger.warning("Could not auto-create tables: %s", exc)
    yield


app = FastAPI(
    title="AnnData API",
    description="Backend services for AnnData: CropClock, FairQueue, WaterWindow, FarmConnect Camps, SchemeSaathi, and Crop Disease Detection.",
    version="0.1.0",
    lifespan=lifespan,
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
app.include_router(disease_router)


@app.get("/")
def read_root():
    return {
        "message": "Welcome to AnnData API",
        "docs_url": "/docs",
        "health_check": "/api/health",
    }


@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    db_status = "unavailable"
    db_version = ""
    try:
        try:
            db_version = db.execute(text("SELECT version();")).scalar()
        except Exception:
            db_version = f"SQLite {db.execute(text('SELECT sqlite_version();')).scalar()}"
        db_status = "connected"
    except Exception as exc:
        logger.error("Database health check failed: %s", exc, exc_info=True)
        db_status = "unavailable"

    return {
        "status": "ok",
        "service": "anndata-backend",
        "database": {
            "status": db_status,
            "branch": settings.NEON_BRANCH if db_status == "connected" else "unknown",
            "server_version": db_version[:50] if db_version else "",
        },
    }
