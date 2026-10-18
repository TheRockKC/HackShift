from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from app.config import settings

# In SQLAlchemy 2.x, pool_pre_ping checks connection health before checkout
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy 2.x declarative models."""
    pass


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a database session and ensuring reliable cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
