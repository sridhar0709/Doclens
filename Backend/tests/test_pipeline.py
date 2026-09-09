"""Tests for the intake pipeline orchestration, including partial_success."""

from __future__ import annotations

from Backend.agents.pipeline import run_intake_pipeline
from Backend.core.scheme_loader import load_schemes
from Backend.models.enums import ProcessingStatus
from Backend.models.request_models import CitizenProfile

from .conftest import make_profile_dict


def profile(**overrides) -> CitizenProfile:
    return CitizenProfile(**make_profile_dict(**overrides))


SCHEMES = tuple([s for s in load_schemes() if s.scheme_id.split("-")[-1].isdigit() and len(s.scheme_id.split("-")[-1]) == 3 and int(s.scheme_id.split("-")[-1]) <= 20])


class _DegradingLLM:
    """LLM that is 'available' but always falls back (polish fails)."""

    available = True

    async def polish(self, prompt, fallback):
        return fallback, False  # used_llm=False -> degradation


class _WorkingLLM:
    available = True

    async def polish(self, prompt, fallback):
        return "Friendlier: " + fallback, True


async def test_pipeline_success_without_llm():
    out = await run_intake_pipeline(
        profile(gender="female", age=34, occupation="farmer", social_category="obc", state="Bihar"),
        request_id="req-1",
        schemes=SCHEMES,
        llm=None,
    )
    r = out.response
    assert r.processing_status is ProcessingStatus.SUCCESS
    assert r.request_id == "req-1"
    assert r.total_eligible_count == len(r.eligible_schemes) > 0
    # priority_rank contiguous from 1.
    assert [s.priority_rank for s in r.eligible_schemes] == list(range(1, len(r.eligible_schemes) + 1))


async def test_pipeline_partial_success_when_llm_degrades():
    out = await run_intake_pipeline(
        profile(gender="female", age=34, occupation="farmer", social_category="obc", state="Bihar"),
        request_id="req-2",
        schemes=SCHEMES,
        llm=_DegradingLLM(),
    )
    # Results still populated, but status reflects degradation.
    assert out.response.processing_status is ProcessingStatus.PARTIAL_SUCCESS
    assert out.response.total_eligible_count > 0


async def test_pipeline_uses_polished_summaries_when_llm_works():
    out = await run_intake_pipeline(
        profile(gender="female", age=34, occupation="farmer", social_category="obc", state="Bihar"),
        request_id="req-3",
        schemes=SCHEMES,
        llm=_WorkingLLM(),
    )
    assert out.response.processing_status is ProcessingStatus.SUCCESS
    assert all(s.benefit_summary.startswith("Friendlier: ") for s in out.response.eligible_schemes)


async def test_pipeline_zero_match_is_success_not_error():
    out = await run_intake_pipeline(
        profile(gender="male", age=40, annual_income=5000000, occupation="salaried",
                social_category="general", state="Goa"),
        request_id="req-4",
        schemes=SCHEMES,
        llm=_DegradingLLM(),  # even with a degrading LLM, no schemes -> no polish attempted
    )
    assert out.response.eligible_schemes == []
    assert out.response.processing_status is ProcessingStatus.SUCCESS


async def test_pipeline_normalizes_profile_for_cache():
    out = await run_intake_pipeline(
        profile(full_name="<b>Neha</b> Sharma"),
        request_id="req-5",
        schemes=SCHEMES,
        llm=None,
    )
    assert out.normalized_profile.full_name == "Neha Sharma"
