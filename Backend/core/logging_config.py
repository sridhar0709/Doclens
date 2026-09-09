"""structlog + Sentry configuration.

Logging policy (security requirement): we log request outcomes
(success/partial_success/error) with the request_id, but NEVER the citizen's full
profile in plaintext. Callers pass only the request_id and coarse counters.
"""

from __future__ import annotations

import logging
import sys

import structlog

from ..config import Settings

_configured = False


def configure_logging(settings: Settings) -> None:
    """Configure structlog and (optionally) Sentry. Idempotent."""
    global _configured
    if _configured:
        return

    level = getattr(logging, settings.log_level.upper(), logging.INFO)

    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=level,
    )

    processors: list = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
    ]
    if settings.log_json:
        processors.append(structlog.processors.JSONRenderer())
    else:
        processors.append(structlog.dev.ConsoleRenderer())

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(level),
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )

    _init_sentry(settings)
    _configured = True


def _init_sentry(settings: Settings) -> None:
    """Initialize Sentry only if a DSN is configured."""
    if not settings.sentry_dsn:
        return
    try:
        import sentry_sdk

        sentry_sdk.init(
            dsn=settings.sentry_dsn,
            environment=settings.environment,
            # Keep PII out of Sentry; we never send the citizen profile.
            send_default_pii=False,
            traces_sample_rate=0.0,
        )
    except Exception:  # pragma: no cover - defensive; never block startup on Sentry
        structlog.get_logger().warning("sentry_init_failed")


def get_logger(name: str = "doclens") -> structlog.stdlib.BoundLogger:
    return structlog.get_logger(name)


def capture_exception(exc: Exception) -> None:
    """Send an exception to Sentry if configured; safe no-op otherwise."""
    try:
        import sentry_sdk

        if sentry_sdk.Hub.current.client is not None:
            sentry_sdk.capture_exception(exc)
    except Exception:  # pragma: no cover
        pass
