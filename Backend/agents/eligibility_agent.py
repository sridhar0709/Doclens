"""Eligibility Reasoning Agent — the deterministic core of the system.

THIS IS A DETERMINISTIC RULE ENGINE, NOT AN LLM DECISION. An LLM is never asked
"is this person eligible?" — that judgment is unacceptable for a system touching
real legal entitlements. Every eligibility verdict here is fully auditable and
reproducible from the rules in schemes.json.

Rule semantics (critical): a rule field that is ``None`` (numbers) or an empty
list means "NO RESTRICTION" on that dimension — it does NOT mean "nobody
qualifies". Each applicable check must pass for a scheme to be eligible.

Confidence scoring (eligibility_match_score, 0.0-1.0):
  - Start at 1.0 for a fully-matched scheme.
  - Subtract a penalty for each "near-boundary" condition (income within 10% of
    the cap; age within 2 years of a min/max bound). This yields an honest
    signal: >=0.95 clearly eligible, ~0.70-0.85 eligible but close to a boundary
    worth double-checking with the issuing authority.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from ..models.enums import GenderRestriction
from ..models.request_models import CitizenProfile
from ..models.scheme_models import EligibilityRules, Scheme

# Confidence penalties for near-boundary conditions.
INCOME_NEAR_BOUNDARY_FRACTION = 0.10  # within 10% of the income cap
INCOME_BOUNDARY_PENALTY = 0.10
AGE_NEAR_BOUNDARY_YEARS = 2  # within 2 years of a min/max age bound
AGE_BOUNDARY_PENALTY = 0.05
MIN_SCORE = 0.0
MAX_SCORE = 1.0


@dataclass(frozen=True)
class RuleCheck:
    """Outcome of a single eligibility rule check."""

    name: str
    applicable: bool  # was the rule active (not "no restriction")?
    passed: bool  # did the citizen satisfy it? (True by definition if not applicable)
    detail: str = ""


@dataclass(frozen=True)
class EligibilityResult:
    """Full deterministic evaluation of one scheme for one citizen."""

    scheme: Scheme
    eligible: bool
    score: float
    checks: list[RuleCheck] = field(default_factory=list)
    boundary_flags: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Individual rule checks. Each returns a RuleCheck and is unit-tested in
# isolation. "applicable=False" always implies "passed=True".
# ---------------------------------------------------------------------------


def check_age(profile: CitizenProfile, rules: EligibilityRules) -> RuleCheck:
    lo, hi = rules.min_age, rules.max_age
    if lo is None and hi is None:
        return RuleCheck("age", applicable=False, passed=True)
    ok = True
    if lo is not None and profile.age < lo:
        ok = False
    if hi is not None and profile.age > hi:
        ok = False
    return RuleCheck("age", applicable=True, passed=ok, detail=f"age={profile.age} in [{lo},{hi}]")


def check_income(profile: CitizenProfile, rules: EligibilityRules) -> RuleCheck:
    cap = rules.max_annual_income
    if cap is None:
        return RuleCheck("income", applicable=False, passed=True)
    ok = profile.annual_income <= cap
    return RuleCheck(
        "income", applicable=True, passed=ok, detail=f"income={profile.annual_income} cap={cap}"
    )


def check_occupation(profile: CitizenProfile, rules: EligibilityRules) -> RuleCheck:
    allowed = rules.allowed_occupations
    if not allowed:
        return RuleCheck("occupation", applicable=False, passed=True)
    ok = profile.occupation.value in allowed
    return RuleCheck("occupation", applicable=True, passed=ok, detail=f"occupation={profile.occupation.value}")


def check_social_category(profile: CitizenProfile, rules: EligibilityRules) -> RuleCheck:
    allowed = rules.allowed_social_categories
    if not allowed:
        return RuleCheck("social_category", applicable=False, passed=True)
    ok = profile.social_category.value in allowed
    return RuleCheck(
        "social_category", applicable=True, passed=ok, detail=f"category={profile.social_category.value}"
    )


def check_disability(profile: CitizenProfile, rules: EligibilityRules) -> RuleCheck:
    required = rules.required_disability_status
    if not required:
        return RuleCheck("disability", applicable=False, passed=True)
    ok = profile.disability_status.value in required
    return RuleCheck(
        "disability", applicable=True, passed=ok, detail=f"disability={profile.disability_status.value}"
    )


def check_state(profile: CitizenProfile, rules: EligibilityRules) -> RuleCheck:
    allowed = rules.state_restricted_to
    if not allowed:
        return RuleCheck("state", applicable=False, passed=True)
    # Case-insensitive comparison so "bihar" matches "Bihar".
    citizen_state = profile.state.strip().casefold()
    ok = any(citizen_state == s.strip().casefold() for s in allowed)
    return RuleCheck("state", applicable=True, passed=ok, detail=f"state={profile.state}")


def check_gender(profile: CitizenProfile, rules: EligibilityRules) -> RuleCheck:
    restriction = rules.gender_restricted_to
    if restriction is GenderRestriction.ANY:
        return RuleCheck("gender", applicable=False, passed=True)
    ok = profile.gender.value == restriction.value
    return RuleCheck("gender", applicable=True, passed=ok, detail=f"gender={profile.gender.value}")


ALL_CHECKS = (
    check_age,
    check_income,
    check_occupation,
    check_social_category,
    check_disability,
    check_state,
    check_gender,
)


# ---------------------------------------------------------------------------
# Confidence scoring
# ---------------------------------------------------------------------------


def _boundary_flags(profile: CitizenProfile, rules: EligibilityRules) -> list[str]:
    """Identify near-boundary conditions for an ALREADY-eligible scheme."""
    flags: list[str] = []

    cap = rules.max_annual_income
    if cap is not None and cap > 0:
        # Within 10% below the cap (income can't exceed cap for an eligible scheme).
        if profile.annual_income >= cap * (1 - INCOME_NEAR_BOUNDARY_FRACTION):
            flags.append("income_near_cap")

    if rules.min_age is not None and 0 <= (profile.age - rules.min_age) <= AGE_NEAR_BOUNDARY_YEARS:
        flags.append("age_near_min")
    if rules.max_age is not None and 0 <= (rules.max_age - profile.age) <= AGE_NEAR_BOUNDARY_YEARS:
        flags.append("age_near_max")

    return flags


def _score_from_flags(flags: list[str]) -> float:
    penalty = 0.0
    for flag in flags:
        if flag == "income_near_cap":
            penalty += INCOME_BOUNDARY_PENALTY
        elif flag in ("age_near_min", "age_near_max"):
            penalty += AGE_BOUNDARY_PENALTY
    return max(MIN_SCORE, min(MAX_SCORE, MAX_SCORE - penalty))


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def evaluate_scheme(profile: CitizenProfile, scheme: Scheme) -> EligibilityResult:
    """Deterministically evaluate a single scheme for a citizen."""
    rules = scheme.eligibility_rules
    checks = [check(profile, rules) for check in ALL_CHECKS]
    eligible = all(c.passed for c in checks)

    if eligible:
        flags = _boundary_flags(profile, rules)
        score = _score_from_flags(flags)
    else:
        flags = []
        score = 0.0

    return EligibilityResult(
        scheme=scheme, eligible=eligible, score=score, checks=checks, boundary_flags=flags
    )


def find_eligible_schemes(
    profile: CitizenProfile, schemes: tuple[Scheme, ...] | list[Scheme]
) -> list[EligibilityResult]:
    """Return EligibilityResults for every scheme the citizen qualifies for.

    Returns an empty list when nobody matches — an empty match is a valid
    outcome, never an error.
    """
    results = [evaluate_scheme(profile, s) for s in schemes]
    return [r for r in results if r.eligible]
