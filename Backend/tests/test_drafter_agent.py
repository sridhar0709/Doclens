"""Tests for the Application Drafter Agent, including LLM-failure fallback."""

from __future__ import annotations

import pytest

from Backend.agents.drafter_agent import (
    build_next_steps,
    build_template,
    draft_application,
)
from Backend.models.request_models import CitizenProfile
from Backend.models.scheme_models import Scheme

from .conftest import make_profile_dict


def make_scheme(scheme_id="pm-kisan-001", **overrides) -> Scheme:
    base = {
        "scheme_id": scheme_id,
        "scheme_name": "PM-KISAN Samman Nidhi",
        "scheme_category": "agriculture",
        "issuing_authority": "Ministry of Agriculture & Farmers Welfare",
        "eligibility_rules": {},
        "benefit_summary": "Income support for farmers.",
        "benefit_value_estimate": "₹6,000/year",
        "required_documents": ["aadhaar", "ration_card"],
        "application_url": "https://pmkisan.gov.in/",
    }
    base.update(overrides)
    return Scheme.model_validate(base)


def profile(**overrides) -> CitizenProfile:
    return CitizenProfile(**make_profile_dict(**overrides))


# ---------------------------------------------------------------------------
# Template filling — at least 3 different schemes
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "scheme_id,scheme_name,authority",
    [
        ("pm-kisan-001", "PM-KISAN Samman Nidhi", "Ministry of Agriculture & Farmers Welfare"),
        ("pmjay-006", "Ayushman Bharat PM-JAY", "National Health Authority"),
        ("nsap-igndps-old-005", "Old Age Pension Scheme", "Ministry of Rural Development"),
    ],
)
def test_template_fills_all_fields(scheme_id, scheme_name, authority):
    p = profile(full_name="Asha Devi", district="Patna", state="Bihar",
                annual_income=180000, social_category="obc")
    s = make_scheme(scheme_id=scheme_id, scheme_name=scheme_name, issuing_authority=authority)
    text = build_template(p, s)

    assert f"To: {authority}" in text
    assert scheme_name in text
    assert "Asha Devi" in text
    assert "Patna" in text
    assert "Bihar" in text
    assert "180000" in text
    assert "obc" in text


def test_template_lists_available_documents():
    p = profile(gov_id_available={
        "aadhaar": True, "income_certificate": False,
        "caste_certificate": True, "ration_card": False,
    })
    text = build_template(p, make_scheme())
    assert "Aadhaar card" in text
    assert "Caste certificate" in text
    assert "Ration card" not in text  # not available


def test_next_steps_present():
    steps = build_next_steps(make_scheme())
    assert isinstance(steps, list) and len(steps) >= 3


# ---------------------------------------------------------------------------
# LLM fallback behavior
# ---------------------------------------------------------------------------


class _FailingLLM:
    available = True

    async def polish(self, prompt, fallback):
        # Simulate an LLM that fails and yields the fallback text, no polish.
        return fallback, False


class _WorkingLLM:
    available = True

    async def polish(self, prompt, fallback):
        return "POLISHED: " + fallback, True


async def test_draft_falls_back_to_template_when_llm_fails():
    p = profile(full_name="Ravi Kumar")
    s = make_scheme()
    text, used_llm = await draft_application(p, s, llm=_FailingLLM())
    assert used_llm is False
    assert text == build_template(p, s)  # exact template, no error


async def test_draft_uses_llm_when_available():
    p = profile(full_name="Ravi Kumar")
    s = make_scheme()
    text, used_llm = await draft_application(p, s, llm=_WorkingLLM())
    assert used_llm is True
    assert text.startswith("POLISHED:")


async def test_draft_no_llm_returns_template():
    p = profile()
    s = make_scheme()
    text, used_llm = await draft_application(p, s, llm=None)
    assert used_llm is False
    assert text == build_template(p, s)
