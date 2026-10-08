import json
import logging
from typing import List, Optional, Union
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger("spendiq.config")


class Settings(BaseSettings):
    # Application Info
    PROJECT_NAME: str = "SpendIQ AI Financial Intelligence Platform"
    APP_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"  # "development" | "staging" | "production" | "testing"

    # Server Binding
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 2

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./spendiq.db"
    
    # Security
    # WARNING: In production, JWT_SECRET_KEY MUST be set via environment variable.
    # Generate with: python -c "import secrets; print(secrets.token_hex(32))"
    JWT_SECRET_KEY: str = "spendiq_super_secret_jwt_key_for_development_purposes_only_32char"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # CORS — comma-separated or JSON list in environment variables
    ALLOWED_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    # AI Provider Settings
    LLM_PROVIDER: str = "mock"  # "mock" | "openai" | "gemini" | "anthropic"
    LLM_API_KEY: Optional[str] = None

    # Logging
    LOG_LEVEL: str = "INFO"

    # Background Tasks & Cache
    REDIS_URL: Optional[str] = None

    # Error Tracking & Telemetry
    SENTRY_DSN: Optional[str] = None

    # Connection Pooling
    DB_POOL_RECYCLE: int = 1800  # seconds (30 min)
    DB_POOL_TIMEOUT: int = 30    # seconds
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    parsed = json.loads(v)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed if str(item).strip()]
                except json.JSONDecodeError:
                    pass
            # Comma-separated string support (e.g., "http://localhost:5173,https://spendiq.ai")
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        elif isinstance(v, (list, tuple)):
            return [str(item).strip() for item in v if str(item).strip()]
        return ["*"]

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        """
        Enforce strict security standards when running in production environment.
        Rejects default development secrets and warns on SQLite in production.
        """
        if self.ENVIRONMENT.lower() == "production":
            dev_default = "spendiq_super_secret_jwt_key_for_development_purposes_only_32char"
            if self.JWT_SECRET_KEY == dev_default:
                raise ValueError(
                    "CRITICAL SECURITY VIOLATION: Default development JWT_SECRET_KEY cannot be used "
                    "in production. Set a cryptographically secure key (at least 32 characters) "
                    "via the JWT_SECRET_KEY environment variable."
                )
            if len(self.JWT_SECRET_KEY) < 32:
                raise ValueError(
                    "CRITICAL SECURITY VIOLATION: JWT_SECRET_KEY must be at least 32 characters long."
                )
            if self.DATABASE_URL.startswith("sqlite"):
                logger.warning(
                    "PRODUCTION WARNING: SpendIQ is configured with SQLite in production. "
                    "For production concurrency, high availability, and performance, "
                    "PostgreSQL (postgresql+asyncpg://...) is strongly recommended."
                )
        return self

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        extra="ignore",
    )


settings = Settings()
