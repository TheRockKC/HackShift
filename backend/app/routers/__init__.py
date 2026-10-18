from app.routers.cropclock import router as cropclock_router
from app.routers.fairqueue import router as fairqueue_router
from app.routers.waterwindow import router as waterwindow_router
from app.routers.camp import router as camp_router
from app.routers.scheme import router as scheme_router
from app.routers.disease import router as disease_router

__all__ = [
    "cropclock_router",
    "fairqueue_router",
    "waterwindow_router",
    "camp_router",
    "scheme_router",
    "disease_router",
]
