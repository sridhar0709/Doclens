"""Ranking Agent — assign priority_rank to the eligible schemes.

Deterministic ordering:
  1. Estimate a benefit-value tier (low/medium/high) from benefit_value_estimate
     using simple, auditable heuristics (largest rupee figure + keywords).
  2. Combine the value tier with the eligibility_match_score into one score.
  3. Sort descending; assign priority_rank starting at 1 (highest priority).
  4. Tie-breaker on equal combined score: a fixed category priority order, then
     scheme_id for full determinism.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from ..agents.eligibility_agent import EligibilityResult
from ..models.enums import SchemeCategory

# Value-tier numeric weights.
TIER_LOW = 1
TIER_MEDIUM = 2
TIER_HIGH = 3

# Rupee-amount thresholds (annualized-ish) for tiering the largest figure found.
HIGH_VALUE_THRESHOLD = 100000
MEDIUM_VALUE_THRESHOLD = 10000

# Keywords that imply a high-value, recurring/insurance benefit regardless of the
# printed number (e.g. "insurance cover" or "pension" phrasing).
HIGH_VALUE_KEYWORDS = ("insurance", "pension", "cover", "subsidy")

# Weights for the combined score. Benefit tier dominates, match score refines.
TIER_WEIGHT = 1.0
MATCH_WEIGHT = 1.0

# Fixed category priority for tie-breaking (lower index = higher priority).
CATEGORY_PRIORITY: dict[SchemeCategory, int] = {
    SchemeCategory.PENSION: 0,
    SchemeCategory.HEALTH: 1,
    SchemeCategory.AGRICULTURE: 2,
    SchemeCategory.DISABILITY: 3,
    SchemeCategory.WOMEN_CHILD: 4,
    SchemeCategory.EDUCATION: 5,
    SchemeCategory.HOUSING: 6,
    SchemeCategory.OTHER: 7,
}

_NUMBER_RE = re.compile(r"[\d][\d,]*")


@dataclass(frozen=True)
class RankedScheme:
    """An eligibility result decorated with ranking metadata."""

    result: EligibilityResult
    value_tier: int
    combined_score: float
    priority_rank: int


def _largest_rupee_amount(text: str) -> int:
    """Return the largest integer figure appearing in the benefit text, or 0."""
    amounts = []
    for match in _NUMBER_RE.findall(text):
        digits = match.replace(",", "")
        if digits.isdigit():
            amounts.append(int(digits))
    return max(amounts) if amounts else 0


def estimate_value_tier(benefit_value_estimate: str) -> int:
    """Classify a benefit_value_estimate string into LOW/MEDIUM/HIGH tiers."""
    text = benefit_value_estimate.lower()
    largest = _largest_rupee_amount(text)

    if largest >= HIGH_VALUE_THRESHOLD or any(k in text for k in HIGH_VALUE_KEYWORDS):
        return TIER_HIGH
    if largest >= MEDIUM_VALUE_THRESHOLD:
        return TIER_MEDIUM
    return TIER_LOW


def _combined_score(value_tier: int, match_score: float) -> float:
    """Blend the value tier and the eligibility match score into one number."""
    return TIER_WEIGHT * value_tier + MATCH_WEIGHT * match_score


def _sort_key(ranked: tuple[int, float, EligibilityResult]):
    value_tier, combined, result = ranked
    category = result.scheme.scheme_category
    # Primary: higher combined score first (negate for ascending sort).
    # Tie-break 1: fixed category priority (lower index first).
    # Tie-break 2: scheme_id, for total determinism.
    return (
        -combined,
        CATEGORY_PRIORITY.get(category, len(CATEGORY_PRIORITY)),
        result.scheme.scheme_id,
    )


def rank_schemes(results: list[EligibilityResult]) -> list[RankedScheme]:
    """Rank eligible schemes, assigning priority_rank starting at 1.

    An empty input yields an empty list.
    """
    scored = [
        (estimate_value_tier(r.scheme.benefit_value_estimate), 0.0, r) for r in results
    ]
    # Fill in combined score now that we have the tier.
    scored = [
        (tier, _combined_score(tier, r.score), r) for (tier, _placeholder, r) in scored
    ]
    scored.sort(key=_sort_key)

    ranked: list[RankedScheme] = []
    for rank, (tier, combined, result) in enumerate(scored, start=1):
        ranked.append(
            RankedScheme(
                result=result,
                value_tier=tier,
                combined_score=combined,
                priority_rank=rank,
            )
        )
    return ranked
