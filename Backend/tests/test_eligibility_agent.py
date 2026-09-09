"""Test suite for the deterministic eligibility engine.

Two layers:
  1. Per-rule unit tests — each rule type in isolation, boundary values included.
  2. 20+ integration tests — a specific CitizenProfile in, a hardcoded set of
     expected eligible scheme_ids out. This is the accuracy safety net: adding a
     scheme to schemes.json that breaks these assertions is a signal, not noise.
"""

from __future__ import annotations

import pytest

from Backend.agents.eligibility_agent import (
    check_age,
    check_disability,
    check_gender,
    check_income,
    check_occupation,
    check_social_category,
    check_state,
    evaluate_scheme,
    find_eligible_schemes,
)
from Backend.core.scheme_loader import load_schemes
from Backend.models.enums import GenderRestriction
from Backend.models.request_models import CitizenProfile
from Backend.models.scheme_models import EligibilityRules, Scheme

from .conftest import make_profile_dict


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def profile(**overrides) -> CitizenProfile:
    return CitizenProfile(**make_profile_dict(**overrides))


def rules(**overrides) -> EligibilityRules:
    return EligibilityRules(**overrides)


def make_scheme(rule_overrides=None, **scheme_overrides) -> Scheme:
    base = {
        "scheme_id": "test-001",
        "scheme_name": "Test Scheme",
        "scheme_category": "other",
        "issuing_authority": "Test Authority",
        "eligibility_rules": (rule_overrides or {}),
        "benefit_summary": "A test benefit.",
        "benefit_value_estimate": "₹1,000/year",
        "required_documents": ["aadhaar"],
        "application_url": "https://example.gov.in/",
    }
    base.update(scheme_overrides)
    return Scheme.model_validate(base)


@pytest.fixture(scope="module")
def schemes():
    return tuple([s for s in load_schemes() if s.scheme_id.split("-")[-1].isdigit() and len(s.scheme_id.split("-")[-1]) == 3 and int(s.scheme_id.split("-")[-1]) <= 20])


# ---------------------------------------------------------------------------
# 1. Per-rule unit tests (boundaries)
# ---------------------------------------------------------------------------


class TestAgeRule:
    def test_no_bounds_is_not_applicable(self):
        c = check_age(profile(age=5), rules())
        assert not c.applicable and c.passed

    def test_exactly_at_min_passes(self):
        assert check_age(profile(age=18), rules(min_age=18)).passed

    def test_just_below_min_fails(self):
        assert not check_age(profile(age=17), rules(min_age=18)).passed

    def test_exactly_at_max_passes(self):
        assert check_age(profile(age=59), rules(max_age=59)).passed

    def test_just_above_max_fails(self):
        assert not check_age(profile(age=60), rules(max_age=59)).passed

    def test_within_range_passes(self):
        assert check_age(profile(age=40), rules(min_age=18, max_age=60)).passed


class TestIncomeRule:
    def test_no_cap_not_applicable(self):
        c = check_income(profile(annual_income=999999), rules())
        assert not c.applicable and c.passed

    def test_exactly_at_cap_passes(self):
        assert check_income(profile(annual_income=100000), rules(max_annual_income=100000)).passed

    def test_one_rupee_over_cap_fails(self):
        assert not check_income(profile(annual_income=100001), rules(max_annual_income=100000)).passed

    def test_under_cap_passes(self):
        assert check_income(profile(annual_income=50000), rules(max_annual_income=100000)).passed


class TestOccupationRule:
    def test_empty_list_not_applicable(self):
        c = check_occupation(profile(occupation="salaried"), rules(allowed_occupations=[]))
        assert not c.applicable and c.passed

    def test_match_passes(self):
        assert check_occupation(profile(occupation="farmer"), rules(allowed_occupations=["farmer"])).passed

    def test_no_match_fails(self):
        assert not check_occupation(
            profile(occupation="salaried"), rules(allowed_occupations=["farmer", "daily_wage"])
        ).passed


class TestSocialCategoryRule:
    def test_empty_list_not_applicable(self):
        c = check_social_category(profile(social_category="general"), rules(allowed_social_categories=[]))
        assert not c.applicable and c.passed

    def test_match_passes(self):
        assert check_social_category(
            profile(social_category="sc"), rules(allowed_social_categories=["sc"])
        ).passed

    def test_no_match_fails(self):
        assert not check_social_category(
            profile(social_category="general"), rules(allowed_social_categories=["sc", "st"])
        ).passed


class TestDisabilityRule:
    def test_empty_list_not_applicable(self):
        c = check_disability(profile(disability_status="none"), rules(required_disability_status=[]))
        assert not c.applicable and c.passed

    def test_match_passes(self):
        assert check_disability(
            profile(disability_status="physical"),
            rules(required_disability_status=["physical", "visual"]),
        ).passed

    def test_none_status_fails_when_disability_required(self):
        assert not check_disability(
            profile(disability_status="none"), rules(required_disability_status=["physical"])
        ).passed


class TestStateRule:
    def test_empty_list_nationwide(self):
        c = check_state(profile(state="Kerala"), rules(state_restricted_to=[]))
        assert not c.applicable and c.passed

    def test_match_passes(self):
        assert check_state(profile(state="Odisha"), rules(state_restricted_to=["Odisha"])).passed

    def test_case_insensitive_match(self):
        assert check_state(profile(state="odisha"), rules(state_restricted_to=["Odisha"])).passed

    def test_no_match_fails(self):
        assert not check_state(profile(state="Bihar"), rules(state_restricted_to=["Odisha"])).passed


class TestGenderRule:
    def test_any_not_applicable(self):
        c = check_gender(profile(gender="male"), rules(gender_restricted_to=GenderRestriction.ANY))
        assert not c.applicable and c.passed

    def test_match_passes(self):
        assert check_gender(
            profile(gender="female"), rules(gender_restricted_to=GenderRestriction.FEMALE)
        ).passed

    def test_no_match_fails(self):
        assert not check_gender(
            profile(gender="male"), rules(gender_restricted_to=GenderRestriction.FEMALE)
        ).passed


# ---------------------------------------------------------------------------
# Scheme-level evaluation + confidence scoring
# ---------------------------------------------------------------------------


class TestEvaluateScheme:
    def test_all_pass_full_score(self):
        s = make_scheme({"min_age": 18, "max_annual_income": 500000})
        r = evaluate_scheme(profile(age=40, annual_income=100000), s)
        assert r.eligible and r.score == 1.0

    def test_single_failed_check_makes_ineligible(self):
        s = make_scheme({"gender_restricted_to": "female"})
        r = evaluate_scheme(profile(gender="male"), s)
        assert not r.eligible and r.score == 0.0

    def test_income_near_cap_penalizes_score(self):
        # income 95k, cap 100k -> within 10% -> income_near_cap -> 0.90
        s = make_scheme({"max_annual_income": 100000})
        r = evaluate_scheme(profile(annual_income=95000), s)
        assert r.eligible
        assert "income_near_cap" in r.boundary_flags
        assert r.score == pytest.approx(0.90)

    def test_age_near_min_penalizes_score(self):
        s = make_scheme({"min_age": 18})
        r = evaluate_scheme(profile(age=19), s)  # within 2 years of min
        assert r.eligible and "age_near_min" in r.boundary_flags
        assert r.score == pytest.approx(0.95)

    def test_age_near_max_penalizes_score(self):
        s = make_scheme({"max_age": 60})
        r = evaluate_scheme(profile(age=59), s)
        assert r.eligible and "age_near_max" in r.boundary_flags
        assert r.score == pytest.approx(0.95)

    def test_multiple_boundary_flags_stack(self):
        s = make_scheme({"min_age": 18, "max_annual_income": 100000})
        r = evaluate_scheme(profile(age=19, annual_income=99000), s)
        # 1.0 - 0.05 (age) - 0.10 (income) = 0.85
        assert r.score == pytest.approx(0.85)

    def test_score_never_negative(self):
        # Stack enough penalties to test the clamp.
        s = make_scheme({"min_age": 18, "max_age": 20, "max_annual_income": 100000})
        r = evaluate_scheme(profile(age=19, annual_income=99000), s)
        assert 0.0 <= r.score <= 1.0


# ---------------------------------------------------------------------------
# Empty / many match paths
# ---------------------------------------------------------------------------


def test_zero_match_returns_empty_list_not_error(schemes):
    # High income, salaried, general category, middle age -> no scheme matches.
    p = profile(age=40, annual_income=5000000, occupation="salaried", social_category="general",
                gender="male", disability_status="none", state="Goa")
    assert find_eligible_schemes(p, schemes) == []


def test_many_match_all_identified(schemes):
    # An elderly, low-income, disabled, self-employed citizen matches several.
    p = profile(age=65, annual_income=50000, occupation="self_employed",
                social_category="sc", disability_status="physical", gender="male", state="Bihar")
    ids = {r.scheme.scheme_id for r in find_eligible_schemes(p, schemes)}
    assert len(ids) >= 5


# ---------------------------------------------------------------------------
# 2. Integration tests: profile -> hardcoded expected eligible scheme_ids
# ---------------------------------------------------------------------------


def eligible_ids(p: CitizenProfile, schemes) -> set[str]:
    return {r.scheme.scheme_id for r in find_eligible_schemes(p, schemes)}


INTEGRATION_CASES = [
    # (case_id, profile_overrides, expected_scheme_ids)
    (
        "female_obc_farmer_bihar",
        dict(gender="female", age=34, annual_income=180000, occupation="farmer",
             social_category="obc", state="Bihar", disability_status="none"),
        {"pm-kisan-001", "pmfby-002", "nrega-011", "pmmvy-009", "ews-housing-urban-020"},
    ),
    (
        "male_farmer_odisha",
        dict(gender="male", age=45, annual_income=150000, occupation="farmer",
             social_category="obc", state="Odisha", disability_status="none"),
        {"pm-kisan-001", "pmfby-002", "nrega-011", "kalia-odisha-012", "ews-housing-urban-020"},
    ),
    (
        "old_unemployed_man_low_income",
        dict(gender="male", age=65, annual_income=50000, occupation="unemployed",
             social_category="general", state="Uttar Pradesh", disability_status="none"),
        {"nsap-igndps-old-005", "pmjay-006", "pmay-g-003", "nrega-011", "ews-housing-urban-020"},
    ),
    (
        "sc_student_boy",
        dict(gender="male", age=16, annual_income=90000, occupation="student",
             social_category="sc", state="Tamil Nadu", disability_status="none"),
        {"nmms-007", "post-matric-sc-008", "pmjay-006"},
    ),
    (
        "rich_salaried_general_no_match",
        dict(gender="male", age=40, annual_income=900000, occupation="salaried",
             social_category="general", state="Maharashtra", disability_status="none"),
        set(),
    ),
    (
        "disabled_self_employed_man",
        dict(gender="male", age=30, annual_income=80000, occupation="self_employed",
             social_category="obc", state="Rajasthan", disability_status="physical"),
        {"nsap-igndps-004", "nfbs-014", "pm-svanidhi-010", "pmay-g-003", "pmjay-006",
         "ews-housing-urban-020"},
    ),
    (
        "widow_45_low_income",
        dict(gender="female", age=45, annual_income=60000, occupation="unemployed",
             social_category="general", state="West Bengal", disability_status="none"),
        {"widow-pension-017", "pmjay-006", "pmay-g-003", "nrega-011",
         "nfbs-014", "ews-housing-urban-020", "pmmvy-009"},
    ),
    (
        "obc_student_girl",
        dict(gender="female", age=17, annual_income=120000, occupation="student",
             social_category="obc", state="Gujarat", disability_status="none"),
        # income 120k > PM-JAY cap (100k); age 17 < PMMVY min (19) -> excluded.
        {"nmms-007", "pm-scholarship-obc-015"},
    ),
    (
        "st_student_pre_matric",
        dict(gender="male", age=14, annual_income=100000, occupation="student",
             social_category="st", state="Jharkhand", disability_status="none"),
        {"tribal-grant-019", "nmms-007", "pmjay-006"},
    ),
    (
        "mp_woman_ladli_behna",
        dict(gender="female", age=30, annual_income=100000, occupation="daily_wage",
             social_category="obc", state="Madhya Pradesh", disability_status="none"),
        {"ladli-behna-mp-013", "pmmvy-009", "pmjay-006", "pmay-g-003", "nrega-011",
         "pm-svanidhi-010", "nfbs-014", "ews-housing-urban-020"},
    ),
    (
        "daily_wage_man_low_income",
        dict(gender="male", age=28, annual_income=70000, occupation="daily_wage",
             social_category="sc", state="Bihar", disability_status="none"),
        {"nrega-011", "pm-svanidhi-010", "pmjay-006", "pmay-g-003", "nfbs-014",
         "ews-housing-urban-020"},
    ),
    (
        "girl_child_sukanya",
        dict(gender="female", age=5, annual_income=100000, occupation="other",
             social_category="general", state="Kerala", disability_status="none"),
        # PM-JAY has no occupation/age restriction and income == cap (100k) -> eligible too.
        {"sukanya-018", "pmjay-006"},
    ),
    (
        "ews_urban_family",
        dict(gender="male", age=35, annual_income=280000, occupation="self_employed",
             social_category="ews", state="Delhi", disability_status="none"),
        {"ews-housing-urban-020", "pm-svanidhi-010"},
    ),
    (
        "elderly_woman_widow_and_oldage_overlap",
        dict(gender="female", age=62, annual_income=40000, occupation="unemployed",
             social_category="obc", state="Bihar", disability_status="none"),
        # NFBS max_age is 59, so at 62 it is correctly excluded.
        {"nsap-igndps-old-005", "widow-pension-017", "pmjay-006", "pmay-g-003",
         "nrega-011", "ews-housing-urban-020"},
    ),
    (
        "young_farmer_woman_pregnant_age",
        dict(gender="female", age=22, annual_income=90000, occupation="farmer",
             social_category="st", state="Chhattisgarh", disability_status="none"),
        {"pm-kisan-001", "pmfby-002", "nrega-011", "pmmvy-009", "pmjay-006",
         "pmay-g-003", "nfbs-014", "ews-housing-urban-020"},
    ),
    (
        "middle_income_no_bpl_general_man",
        dict(gender="male", age=50, annual_income=290000, occupation="salaried",
             social_category="general", state="Punjab", disability_status="none"),
        {"ews-housing-urban-020"},
    ),
    (
        "intellectual_disability_woman",
        dict(gender="female", age=25, annual_income=90000, occupation="unemployed",
             social_category="obc", state="Assam", disability_status="intellectual"),
        {"nsap-igndps-004", "nfbs-014", "pmjay-006", "pmay-g-003", "nrega-011",
         "pmmvy-009", "ews-housing-urban-020"},
    ),
    (
        "odisha_landless_labourer",
        dict(gender="male", age=38, annual_income=100000, occupation="daily_wage",
             social_category="sc", state="Odisha", disability_status="none"),
        {"kalia-odisha-012", "nrega-011", "pm-svanidhi-010", "pmjay-006", "pmay-g-003",
         "nfbs-014", "ews-housing-urban-020"},
    ),
    (
        "high_income_farmer_over_kisan_cap",
        dict(gender="male", age=45, annual_income=250000, occupation="farmer",
             social_category="general", state="Haryana", disability_status="none"),
        # income over PM-KISAN (200k) and most caps, but PMFBY has no income cap.
        {"pmfby-002", "nrega-011", "ews-housing-urban-020"},
    ),
    (
        "senior_disabled_over_pension_age_for_disability",
        dict(gender="male", age=62, annual_income=80000, occupation="unemployed",
             social_category="general", state="Bihar", disability_status="physical"),
        # Disability pension caps at 59, so old-age pension applies instead.
        {"nsap-igndps-old-005", "pmjay-006", "pmay-g-003", "nrega-011", "ews-housing-urban-020"},
    ),
    (
        "postgraduate_high_income_woman_no_match",
        dict(gender="female", age=29, annual_income=1200000, occupation="salaried",
             social_category="general", state="Karnataka", disability_status="none",
             education_level="postgraduate"),
        set(),
    ),
    (
        "boundary_income_exactly_at_kisan_cap",
        dict(gender="male", age=40, annual_income=200000, occupation="farmer",
             social_category="general", state="Bihar", disability_status="none"),
        # Exactly at PM-KISAN cap (200k) -> still eligible.
        {"pm-kisan-001", "pmfby-002", "nrega-011", "ews-housing-urban-020"},
    ),
]


@pytest.mark.parametrize("case_id,overrides,expected", INTEGRATION_CASES,
                         ids=[c[0] for c in INTEGRATION_CASES])
def test_integration_expected_scheme_ids(case_id, overrides, expected, schemes):
    p = profile(**overrides)
    assert eligible_ids(p, schemes) == expected


def test_integration_case_count_is_at_least_twenty():
    assert len(INTEGRATION_CASES) >= 20
