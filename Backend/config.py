"""Application configuration — single source of truth for all settings.

Loads from environment variables (and a local .env file for development via
python-dotenv / pydantic-settings). NO secret is ever hardcoded here; only
variable NAMES and safe non-secret defaults appear in code.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


from pathlib import Path

_ENV_FILE = Path(__file__).parent / ".env"

class Settings(BaseSettings):
    """Typed application settings, populated from the environment."""

    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",  # ignore unrelated env vars in the process
        case_sensitive=False,
    )

    # --- Core app ---
    app_name: str = "DocLens"
    environment: str = Field(default="development")  # development | production
    debug: bool = Field(default=False)

    # --- CORS: explicit allowlist, NEVER "*" ---
    # Comma-separated list in the env var, e.g. "http://localhost:3000,https://app.example.com"
    allowed_origins: str = Field(default="http://localhost:3000,https://doclens-seven.vercel.app,https://doclens.vercel.app")

    # --- Rate limiting ---
    rate_limit: str = Field(default="20/minute")
    # If set, slowapi uses Redis as the storage backend; otherwise in-memory.
    redis_url: str | None = Field(default=None)

    # --- LLM (Groq) — optional; the system degrades gracefully without it ---
    groq_api_key: str | None = Field(default=None)
    groq_model: str = Field(default="llama-3.3-70b-versatile")
    groq_fallback_model: str = Field(default="llama-3.1-8b-instant")
    groq_timeout_seconds: float = Field(default=10.0)
    llm_enabled: bool = Field(default=True)

    # --- Observability ---
    sentry_dsn: str | None = Field(default=None)
    log_level: str = Field(default="INFO")
    log_json: bool = Field(default=True)

    # --- Request state cache (request_id -> profile) for /api/draft ---
    request_cache_ttl_seconds: int = Field(default=1800)  # 30 minutes
    request_cache_max_size: int = Field(default=1000)

    # --- Supabase & OCR ---
    supabase_url: str = ""
    supabase_service_role_key: str = "placeholder_service_role_key"
    supabase_jwt_secret: str = "placeholder_jwt_secret"
    ocr_space_api_key: str = "helloworld"
    internal_api_secret: str = "placeholder_internal_api_secret"




    @field_validator("allowed_origins")
    @classmethod
    def _reject_wildcard_origin(cls, v: str) -> str:
        """A literal '*' CORS allowlist is forbidden by the security policy."""
        origins = [o.strip() for o in v.split(",") if o.strip()]
        if "*" in origins:
            raise ValueError("ALLOWED_ORIGINS must not be '*' — use an explicit allowlist")
        return v

    @property
    def cors_origins(self) -> list[str]:
        """Parsed list of allowed CORS origins."""
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def llm_active(self) -> bool:
        """LLM polish is used only when explicitly enabled AND a key is present."""
        return bool(self.llm_enabled and self.groq_api_key)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the cached Settings instance."""
    return Settings()
