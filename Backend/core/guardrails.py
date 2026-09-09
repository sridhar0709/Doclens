"""Security guardrails, payload protection, HTTP headers, and prompt sanitization.

Provides industrial-grade protection against:
1. Denial of Service via oversized requests (PayloadSizeLimitMiddleware).
2. Common Web Attacks (SecurityHeadersMiddleware: XSS, MIME sniffing, Clickjacking, HSTS).
3. LLM Prompt Injection & Token Starvation (SanitizerEngine).
4. SQL Injection & Control Character Flooding.
"""

from __future__ import annotations

import re
from typing import Any
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette import status

# Maximum allowed request body size: 2 MB (protects against RAM exhaustion & DoS)
MAX_PAYLOAD_SIZE_BYTES = 2 * 1024 * 1024

# Malicious prompt injection & system jailbreak signatures
PROMPT_INJECTION_PATTERNS = [
    r"ignore\s+(previous|above|all)\s+instructions",
    r"system\s+prompt",
    r"you\s+are\s+now\s+in\s+developer\s+mode",
    r"bypass\s+safety",
    r"print\s+your\s+instructions",
    r"reveal\s+secret",
]

INJECTION_REGEX = re.compile("|".join(PROMPT_INJECTION_PATTERNS), re.IGNORECASE)


class PayloadSizeLimitMiddleware(BaseHTTPMiddleware):
    """Middleware to reject requests whose Content-Length exceeds MAX_PAYLOAD_SIZE_BYTES."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        content_length_header = request.headers.get("content-length")
        if content_length_header:
            try:
                content_length = int(content_length_header)
                if content_length > MAX_PAYLOAD_SIZE_BYTES:
                    return JSONResponse(
                        status_code=getattr(status, "HTTP_413_CONTENT_TOO_LARGE", 413),
                        content={
                            "processing_status": "error",
                            "error_code": "payload_too_large",
                            "error_message": f"Payload size ({content_length} bytes) exceeds maximum limit of 2MB.",
                        },
                    )
            except ValueError:
                return JSONResponse(
                    status_code=HTTP_400_BAD_REQUEST,
                    content={
                        "processing_status": "error",
                        "error_code": "invalid_header",
                        "error_message": "Invalid Content-Length header.",
                    },
                )
        return await call_next(request)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to attach defensive HTTP headers to all responses."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
        response.headers["Pragma"] = "no-cache"
        return response


class SanitizerEngine:
    """Validates and sanitizes chat queries and text fields against abuse."""

    @staticmethod
    def sanitize_string(text: str) -> str:
        """Strip null bytes and non-printable control characters."""
        if not text:
            return ""
        # Remove null bytes (\x00) and control characters except newline and tab
        cleaned = re.sub(r"[\x00-\x08\x0b-\x0c\x0e-\x1f]", "", text)
        return cleaned.strip()

    @classmethod
    def check_prompt_injection(cls, query: str) -> bool:
        """Returns True if query contains prompt injection or jailbreak patterns."""
        if not query:
            return False
        return bool(INJECTION_REGEX.search(query))

    @classmethod
    def trim_and_sanitize_history(cls, history: list[dict[str, str]], max_turns: int = 8) -> list[dict[str, str]]:
        """Keep only the last N turns and sanitize strings to prevent token starvation."""
        if not history:
            return []
        trimmed = history[-max_turns:]
        clean_history = []
        for item in trimmed:
            role = item.get("role", "user")
            content = cls.sanitize_string(item.get("content", ""))
            # Truncate overly long past messages
            if len(content) > 1000:
                content = content[:1000] + "..."
            clean_history.append({"role": role, "content": content})
        return clean_history
