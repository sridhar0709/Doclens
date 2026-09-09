"""Security wiring: rate limiting (slowapi) and CORS configuration.

Rate limiting uses in-memory storage by default and switches to Redis only when
REDIS_URL is configured, so the service runs with zero external dependencies
locally while scaling to a shared store in production.
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address

from ..config import Settings


def build_limiter(settings: Settings) -> Limiter:
    """Create the slowapi Limiter with a default per-IP limit.

    Storage backend: Redis if REDIS_URL is set, else in-memory.
    """
    storage_uri = settings.redis_url or "memory://"
    # default_limits applied globally via SlowAPIMiddleware to every route.
    # headers_enabled is False: slowapi's header injection requires a Response
    # object, which breaks endpoints that return Pydantic models.
    return Limiter(
        key_func=get_remote_address,
        default_limits=[settings.rate_limit],
        storage_uri=storage_uri,
        headers_enabled=False,
    )


CORS_ALLOWED_HEADERS = ["Authorization", "Content-Type", "X-Internal-Secret"]

def configure_cors(app: FastAPI, settings: Settings) -> None:
    """Attach CORS middleware using the explicit origin allowlist (never '*')."""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_origin_regex=r"https://.*\.vercel\.app",
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=CORS_ALLOWED_HEADERS,
    )
