"""Intake Agent — validate and normalize the raw request into a clean profile.

Pydantic's CitizenProfile model is the primary validation layer (FastAPI rejects
malformed requests with a 422 automatically). This agent performs the additional
normalization and defensive sanitization steps that are not expressible as pure
schema validation:

  - default disability_status -> "none"      (handled by the model default)
  - default land_owned_acres  -> 0           (handled by the model default)
  - strip HTML/script markup from free-text  (full_name, state, district)

It returns a validated, normalized CitizenProfile object.
"""

from __future__ import annotations

from ..core.sanitization import sanitize_text
from ..models.request_models import CitizenProfile


def normalize_profile(profile: CitizenProfile) -> CitizenProfile:
    """Return a normalized copy of ``profile`` with free-text fields sanitized.

    Defaults for ``disability_status`` and ``land_owned_acres`` are already
    applied by the Pydantic model; this function additionally strips any
    HTML/script content from the free-text fields.

    Raises ``ValueError`` if a free-text field is empty after sanitization
    (e.g. the input was nothing but markup), so we never proceed with a blank
    name/state/district.
    """
    full_name = sanitize_text(profile.full_name)
    state = sanitize_text(profile.state)
    district = sanitize_text(profile.district)

    for field_name, value in (
        ("full_name", full_name),
        ("state", state),
        ("district", district),
    ):
        if not value:
            raise ValueError(f"{field_name} is empty after sanitization")

    # model_copy(update=...) re-validates nothing by default, but the values are
    # already-validated strings, so the resulting object stays contract-valid.
    return profile.model_copy(
        update={
            "full_name": full_name,
            "state": state,
            "district": district,
        }
    )
