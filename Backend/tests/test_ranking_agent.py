"""Tests for the Ranking Agent."""

from __future__ import annotations

from Backend.agents.eligibility_agent import EligibilityResult
from Backend.agents.ranking_agent import (
    TIER_HIGH,
    TIER_LOW,
    TIER_MEDIUM,
    estimate_value_tier,
    rank_schemes,
)
from Backend.models.scheme_models import Scheme


def make_scheme(scheme_id, category, value_estimate) -> Scheme:
    return Scheme.model_validate(
        {
            "scheme_id": scheme_id,
            "scheme_name": scheme_id.upper(),
            "scheme_category": category,
            "issuing_authority": "Test",
            "eligibility_rules": {},
            "benefit_summary": "Test",
            "benefit_value_estimate": value_estimate,
            "required_documents": ["aadhaar"],
            "application_url": "https://example.gov.in/",
        }
    )


def result(scheme, score=1.0) -> EligibilityResult:
    return EligibilityResult(scheme=scheme, eligible=True, score=score, checks=[], boundary_flags=[])


# ---------------------------------------------------------------------------
# Value-tier heuristics
# ---------------------------------------------------------------------------


def test_high_tier_from_large_number():
    assert estimate_value_tier("₹500,000/year health insurance") == TIER_HIGH


def test_high_tier_from_keyword_even_with_small_number():
    assert estimate_value_tier("₹300/month pension") == TIER_HIGH


def test_medium_tier():
    assert estimate_value_tier("₹12,000/year") == TIER_MEDIUM


def test_low_tier():
    assert estimate_value_tier("₹6,000/year") == TIER_LOW


def test_low_tier_when_no_number_and_no_keyword():
    assert estimate_value_tier("8.2% annual interest") == TIER_LOW


# ---------------------------------------------------------------------------
# Ranking order
# ---------------------------------------------------------------------------


def test_ranks_are_ascending_and_start_at_one():
    schemes = [
        result(make_scheme("low-001", "other", "₹6,000/year"), score=1.0),
        result(make_scheme("high-002", "health", "₹500,000/year insurance"), score=1.0),
        result(make_scheme("med-003", "education", "₹12,000/year"), score=1.0),
    ]
    ranked = rank_schemes(schemes)
    assert [r.priority_rank for r in ranked] == [1, 2, 3]
    # Highest value tier should be rank 1.
    assert ranked[0].result.scheme.scheme_id == "high-002"
    assert ranked[-1].result.scheme.scheme_id == "low-001"


def test_higher_match_score_breaks_within_same_tier():
    # Both medium tier, same category -> higher eligibility_match_score wins.
    schemes = [
        result(make_scheme("a-001", "education", "₹12,000/year"), score=0.80),
        result(make_scheme("b-002", "education", "₹15,000/year"), score=1.0),
    ]
    ranked = rank_schemes(schemes)
    # b-002 has both a slightly higher number (still medium) and higher score.
    assert ranked[0].result.scheme.scheme_id == "b-002"


def test_category_tiebreak_when_scores_equal():
    # Same value tier (high via keyword) and same match score -> category order:
    # pension > health > agriculture > disability > women_child > education > housing > other
    schemes = [
        result(make_scheme("housing-x", "housing", "₹200,000 subsidy"), score=1.0),
        result(make_scheme("pension-x", "pension", "₹500/month pension"), score=1.0),
        result(make_scheme("health-x", "health", "₹500,000 insurance"), score=1.0),
    ]
    ranked = rank_schemes(schemes)
    order = [r.result.scheme.scheme_category.value for r in ranked]
    assert order == ["pension", "health", "housing"]


def test_deterministic_scheme_id_final_tiebreak():
    # Identical tier, score, and category -> scheme_id decides, deterministically.
    schemes = [
        result(make_scheme("zzz-001", "other", "₹6,000/year"), score=1.0),
        result(make_scheme("aaa-002", "other", "₹6,000/year"), score=1.0),
    ]
    ranked = rank_schemes(schemes)
    assert ranked[0].result.scheme.scheme_id == "aaa-002"


def test_empty_input_returns_empty():
    assert rank_schemes([]) == []
