import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent

# Load environment variables: backend-specific first, then project root fallback
for env_file in [
    BASE_DIR / ".env.local",
    BASE_DIR / ".env",
    ROOT_DIR / ".env.local",
    ROOT_DIR / ".env",
]:
    if env_file.exists():
        load_dotenv(dotenv_path=env_file, override=False)


def normalize_db_url(url: str) -> str:
    """Ensure PostgreSQL URL uses Psycopg 3 driver for SQLAlchemy 2."""
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    return url


class Settings:
    PROJECT_NAME: str = "Smart Farming Platform API"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PORT: int = int(os.getenv("PORT", "8000"))
    NEON_BRANCH: str = os.getenv("NEON_BRANCH", "production")

    _cors_origins_env: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173",
    )

    @property
    def CORS_ORIGINS(self) -> list[str]:
        return [origin.strip() for origin in self._cors_origins_env.split(",") if origin.strip()]

    # Pooled connection URL (for application queries)
    _raw_db_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://postgres:your_password_here@localhost:5432/smart_farming",
    )

    # Unpooled direct connection URL (recommended for Alembic migrations)
    _raw_db_url_unpooled: str = os.getenv(
        "DATABASE_URL_UNPOOLED",
        "",
    )

    @property
    def DATABASE_URL(self) -> str:
        return normalize_db_url(self._raw_db_url)

    @property
    def DATABASE_URL_UNPOOLED(self) -> str:
        if self._raw_db_url_unpooled:
            return normalize_db_url(self._raw_db_url_unpooled)
        return self.DATABASE_URL


settings = Settings()
