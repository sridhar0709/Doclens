"""Tests for the Intake Agent and the CitizenProfile validation layer."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from Backend.agents.intake_agent import normalize_profile
from Backend.core.sanitization import sanitize_text
from Backend.models.enums import DisabilityStatus
from Backend.models.request_models import CitizenProfile

from .conftest import make_profile_dict


def test_complete_valid_profile_passes_unchanged():
    data = make_profile_dict()
    profile = CitizenProfile(**data)
    result = normalize_profile(profile)

    assert result.full_name == "Asha Devi"
    assert result.state == "Bihar"
    assert result.district == "Patna"
    assert result.age == 34
    assert result.annual_income == 180000
    assert result.land_owned_acres == 2.5
    assert result.disability_status is DisabilityStatus.NONE


def test_missing_optional_fields_apply_defaults():
    data = make_profile_dict()
    del data["disability_status"]
    del data["land_owned_acres"]

    profile = CitizenProfile(**data)
    result = normalize_profile(profile)

    assert result.disability_status is DisabilityStatus.NONE
    assert result.land_owned_acres == 0


def test_invalid_enum_value_raises_validation_error():
    data = make_profile_dict(gender="Male")  # wrong case, not in enum
    with pytest.raises(ValidationError) as exc:
        CitizenProfile(**data)
    assert "gender" in str(exc.value)


def test_unknown_field_rejected():
    data = make_profile_dict(unexpected_field="x")
    with pytest.raises(ValidationError):
        CitizenProfile(**data)


def test_annual_income_as_string_rejected():
    data = make_profile_dict(annual_income="180000")
    with pytest.raises(ValidationError):
        CitizenProfile(**data)


def test_gov_id_available_must_have_exactly_four_keys():
    data = make_profile_dict()
    data["gov_id_available"]["pan_card"] = True  # 5th key
    with pytest.raises(ValidationError):
        CitizenProfile(**data)

    data2 = make_profile_dict()
    del data2["gov_id_available"]["ration_card"]  # only 3 keys
    with pytest.raises(ValidationError):
        CitizenProfile(**data2)


def test_html_injection_in_full_name_sanitized():
    data = make_profile_dict(
        full_name="<script>alert('xss')</script>Rahul Kumar",
        state="Bihar<img src=x onerror=alert(1)>",
        district="<b>Patna</b>",
    )
    profile = CitizenProfile(**data)
    result = normalize_profile(profile)

    assert "<" not in result.full_name and ">" not in result.full_name
    assert "script" not in result.full_name.lower()
    assert result.full_name == "Rahul Kumar"
    assert result.state == "Bihar"
    assert result.district == "Patna"


def test_encoded_html_entity_payload_sanitized():
    data = make_profile_dict(full_name="&lt;script&gt;evil&lt;/script&gt; Meena")
    profile = CitizenProfile(**data)
    result = normalize_profile(profile)
    assert "<" not in result.full_name and ">" not in result.full_name
    assert "script" not in result.full_name.lower()
    assert "Meena" in result.full_name


def test_name_that_is_only_markup_rejected():
    data = make_profile_dict(full_name="<p></p>")
    profile = CitizenProfile(**data)
    with pytest.raises(ValueError):
        normalize_profile(profile)


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("Plain Name", "Plain Name"),
        ("  spaced   out  ", "spaced out"),
        ("<script>x</script>Amit", "Amit"),
        ("Nested <<b>>bold", "Nested bold"),
    ],
)
def test_sanitize_text_cases(raw, expected):
    assert sanitize_text(raw) == expected
