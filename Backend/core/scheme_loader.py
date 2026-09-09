"""Load and validate scheme definitions from data/schemes.json.

Schemes are loaded once and cached. Every entry is validated against the
``Scheme`` model at load time, and duplicate ``scheme_id`` values are rejected,
so a malformed data file fails loudly at startup rather than producing a subtle
eligibility bug at request time.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from ..models.scheme_models import Scheme

# data/schemes.json lives alongside this package's data directory.
DEFAULT_SCHEMES_PATH = Path(__file__).resolve().parent.parent / "data" / "schemes.json"


class SchemeDataError(RuntimeError):
    """Raised when the scheme data file is missing or invalid."""


def load_schemes(path: Path | None = None) -> list[Scheme]:
    """Read, parse, and validate all schemes from ``path`` (default schemes.json).

    Raises ``SchemeDataError`` on a missing file, invalid JSON, a schema
    validation failure, or a duplicate scheme_id.
    """
    schemes_path = path or DEFAULT_SCHEMES_PATH

    try:
        raw = schemes_path.read_text(encoding="utf-8-sig")
    except OSError as exc:  # missing/unreadable file
        raise SchemeDataError(f"Cannot read schemes file at {schemes_path}: {exc}") from exc

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise SchemeDataError(f"schemes.json is not valid JSON: {exc}") from exc

    if not isinstance(data, list):
        raise SchemeDataError("schemes.json must contain a top-level JSON array")

    schemes: list[Scheme] = []
    seen_ids: set[str] = set()
    for index, entry in enumerate(data):
        try:
            scheme = Scheme.model_validate(entry)
        except Exception as exc:  # pydantic ValidationError et al.
            raise SchemeDataError(f"Invalid scheme at index {index}: {exc}") from exc

        if scheme.scheme_id in seen_ids:
            raise SchemeDataError(f"Duplicate scheme_id: {scheme.scheme_id!r}")
        seen_ids.add(scheme.scheme_id)
        schemes.append(scheme)

    return schemes


@lru_cache(maxsize=1)
def get_schemes() -> tuple[Scheme, ...]:
    """Return the cached, validated tuple of schemes (loaded on first call)."""
    return tuple(load_schemes())
