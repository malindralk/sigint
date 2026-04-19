"""Application configuration loaded from environment variables."""

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application
    app_env: Literal["development", "production", "testing"] = "development"
    debug: bool = False
    frontend_url: str = "http://localhost:3000"

    # Database (SQLite for local dev, PostgreSQL for production)
    database_url: str = "sqlite+aiosqlite:///./sigint.db"
    db_pool_size: int = 5
    db_max_overflow: int = 10

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Content
    content_path: Path = Path("../content")

    # Embedding model
    embedding_model: str = "all-MiniLM-L6-v2"
    embedding_batch_size: int = 32
    embedding_dimension: int = 384  # all-MiniLM-L6-v2 dimension

    # Admin email — controls who gets admin role on OAuth login
    admin_email: str = "mail@malindra.lk"

    # OAuth providers
    google_client_id: str = ""
    google_client_secret: str = ""

    # SMTP settings for email
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "noreply@malindra.lk"

    # Security
    secret_key: str = Field(..., description="JWT secret key - must be set via SECRET_KEY env var")
    jwt_algorithm: str = "HS256"

    # Token expiration (in minutes for access, days for refresh)
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # Phase 3: External integrations
    resend_api_key: str = ""
    hubspot_api_key: str = ""
    export_token: str = ""         # CSV export auth token
    rebuild_webhook_url: str = ""  # Vercel/GitHub/CF rebuild hook

    # Phase 4: Enterprise & compliance
    monitor_token: str = ""        # GET /api/monitoring/metrics auth token
    enterprise_default_quota: int = 10_000  # Default monthly API quota
    data_retention_analytics_days: int = 90
    data_retention_leads_days: int = 365
    ai_model_version: str = "v1.0"
    connector_sync_enabled: bool = True

    # Phase 5: Subscriptions, Telemetry, Partners
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_signal_monthly: str = "price_signal_monthly"
    stripe_price_sovereign_monthly: str = "price_sovereign_monthly"
    stripe_price_enterprise_annual: str = "price_enterprise_annual"
    audit_chain_secret: str = ""       # HMAC secret for immutable audit chain
    telemetry_enabled: bool = True
    ab_testing_enabled: bool = True
    partner_webhook_secret: str = ""
    lemonsqueezy_api_key: str = ""     # Alternative to Stripe for LemonSqueezy

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
