"""Thin Groq client for LANGUAGE GENERATION ONLY.

Hard rule: the LLM is used exclusively to make benefit summaries and application
drafts read more naturally, or to answer chat questions. It is NEVER asked to make an eligibility decision.
Every call has a timeout and a fallback model, and ANY failure (missing key,
timeout, API error, empty response) results in the caller's deterministic
fallback text being used instead of an error.
"""

from __future__ import annotations

import asyncio
import httpx

from ..config import Settings
from ..core.logging_config import get_logger

logger = get_logger(__name__)


class GroqClient:
    """Async wrapper around Groq API with timeout + fallback + graceful degradation."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._api_key = settings.groq_api_key
        self._init_error: str | None = None
        if not self._api_key or not settings.llm_enabled:
            logger.warning("groq_init_skipped", reason="missing API key or disabled")

    @property
    def available(self) -> bool:
        return bool(self._settings.llm_enabled and self._api_key)

    async def _generate_once(self, model: str, prompt: str) -> str | None:
        """One generation attempt against a specific Groq model, bounded by timeout."""
        if not self.available or not self._api_key:
            return None

        try:
            try:
                from groq import AsyncGroq
                client = AsyncGroq(api_key=self._api_key, timeout=self._settings.groq_timeout_seconds)
                response = await client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.7,
                )
                return (response.choices[0].message.content or "").strip() or None
            except ImportError:
                # Fallback to direct async REST call to Groq API via httpx (no SDK required)
                async with httpx.AsyncClient(timeout=self._settings.groq_timeout_seconds) as client:
                    response = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {self._api_key}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "model": model,
                            "messages": [{"role": "user", "content": prompt}],
                            "temperature": 0.7,
                        },
                    )
                    response.raise_for_status()
                    data = response.json()
                    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    return content.strip() or None
        except asyncio.TimeoutError:
            logger.warning("groq_timeout", model=model)
            return None
        except Exception as exc:  # any API/network error
            logger.warning("groq_error", model=model, error=str(exc))
            return None

    async def polish(self, prompt: str, fallback: str) -> tuple[str, bool]:
        """Return (text, used_llm).

        Tries the primary model, then the fallback model, then returns the
        provided deterministic ``fallback`` text. ``used_llm`` is True only when
        the LLM produced the returned text.
        """
        if not self.available:
            return fallback, False

        for model in (self._settings.groq_model, self._settings.groq_fallback_model):
            text = await self._generate_once(model, prompt)
            if text:
                return text, True

        return fallback, False

    async def _generate_with_messages(self, model: str, messages: list[dict[str, str]], temperature: float = 0.2) -> str | None:
        """Generation attempt using structured messages (e.g. system + user), bounded by timeout."""
        if not self.available or not self._api_key:
            return None

        try:
            try:
                from groq import AsyncGroq
                client = AsyncGroq(api_key=self._api_key, timeout=self._settings.groq_timeout_seconds)
                response = await client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=800,
                )
                return (response.choices[0].message.content or "").strip() or None
            except ImportError:
                async with httpx.AsyncClient(timeout=self._settings.groq_timeout_seconds) as client:
                    response = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {self._api_key}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "model": model,
                            "messages": messages,
                            "temperature": temperature,
                            "max_tokens": 800,
                        },
                    )
                    response.raise_for_status()
                    data = response.json()
                    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    return content.strip() or None
        except asyncio.TimeoutError:
            logger.warning("groq_timeout", model=model)
            return None
        except Exception as exc:
            logger.warning("groq_error", model=model, error=str(exc))
            return None

    async def generate_chat(self, system_prompt: str, user_prompt: str, fallback: str = "") -> tuple[str, bool]:
        """Generate AI response with system persona and low-latency temperature."""
        if not self.available:
            return fallback, False

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        for model in (self._settings.groq_model, self._settings.groq_fallback_model):
            text = await self._generate_with_messages(model, messages, temperature=0.2)
            if text:
                return text, True

        return fallback, False
