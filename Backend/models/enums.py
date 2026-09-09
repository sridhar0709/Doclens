"""Shared enum types for the frozen API contract.

These enums encode the exact lowercase snake_case values shared by the backend
Pydantic models and frontend TypeScript types.
Any value outside these sets must be rejected with a 422 by Pydantic.
"""

from __future__ import annotations

from enum import Enum


class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class Occupation(str, Enum):
    FARMER = "farmer"
    DAILY_WAGE = "daily_wage"
    STUDENT = "student"
    SELF_EMPLOYED = "self_employed"
    SALARIED = "salaried"
    UNEMPLOYED = "unemployed"
    OTHER = "other"

    @classmethod
    def _missing_(cls, value: object) -> "Occupation | None":
        """Map common non-standard occupation strings to valid enum values."""
        if not isinstance(value, str):
            return None
        val = value.strip().lower()
        _ALIASES: dict[str, "Occupation"] = {
            "salaried_private": cls.SALARIED,
            "salaried_govt": cls.SALARIED,
            "government": cls.SALARIED,
            "govt": cls.SALARIED,
            "business": cls.SELF_EMPLOYED,
            "shopkeeper": cls.SELF_EMPLOYED,
            "artisan": cls.SELF_EMPLOYED,
            "labour": cls.DAILY_WAGE,
            "labourer": cls.DAILY_WAGE,
            "daily_labour": cls.DAILY_WAGE,
            "agriculture": cls.FARMER,
            "cultivator": cls.FARMER,
            "homemaker": cls.UNEMPLOYED,
        }
        if val in _ALIASES:
            return _ALIASES[val]
        for member in cls:
            if member.value == val:
                return member
        return cls.OTHER  # safe fallback


class SocialCategory(str, Enum):
    GENERAL = "general"
    OBC = "obc"
    SC = "sc"
    ST = "st"
    EWS = "ews"


class DisabilityStatus(str, Enum):
    NONE = "none"
    PHYSICAL = "physical"
    VISUAL = "visual"
    HEARING = "hearing"
    INTELLECTUAL = "intellectual"
    MULTIPLE = "multiple"


class EducationLevel(str, Enum):
    NONE = "none"
    PRIMARY = "primary"
    SECONDARY = "secondary"
    HIGHER_SECONDARY = "higher_secondary"
    GRADUATE = "graduate"
    POSTGRADUATE = "postgraduate"

    @classmethod
    def _missing_(cls, value: object) -> "EducationLevel | None":
        """Map common non-standard frontend strings to valid enum values."""
        if not isinstance(value, str):
            return None
        val = value.strip().lower()
        _ALIASES: dict[str, "EducationLevel"] = {
            "below_10th": cls.SECONDARY,
            "10th_pass": cls.SECONDARY,
            "10th": cls.SECONDARY,
            "matric": cls.SECONDARY,
            "12th_pass": cls.HIGHER_SECONDARY,
            "12th": cls.HIGHER_SECONDARY,
            "inter": cls.HIGHER_SECONDARY,
            "intermediate": cls.HIGHER_SECONDARY,
            "ug": cls.GRADUATE,
            "undergraduate": cls.GRADUATE,
            "pg": cls.POSTGRADUATE,
            "post_graduate": cls.POSTGRADUATE,
            "postgrad": cls.POSTGRADUATE,
            "masters": cls.POSTGRADUATE,
            "illiterate": cls.NONE,
        }
        if val in _ALIASES:
            return _ALIASES[val]
        for member in cls:
            if member.value == val:
                return member
        return cls.SECONDARY  # safe fallback


class SchemeCategory(str, Enum):
    EDUCATION = "education"
    HEALTH = "health"
    AGRICULTURE = "agriculture"
    DISABILITY = "disability"
    WOMEN_CHILD = "women_child"
    HOUSING = "housing"
    PENSION = "pension"
    OTHER = "other"

    @classmethod
    def _missing_(cls, value: object) -> SchemeCategory | None:
        if isinstance(value, str):
            val = value.strip().lower()
            for member in cls:
                if member.value == val:
                    return member
            return cls.OTHER
        return None


class ProcessingStatus(str, Enum):
    SUCCESS = "success"
    PARTIAL_SUCCESS = "partial_success"
    ERROR = "error"


class ErrorCode(str, Enum):
    INVALID_INPUT = "INVALID_INPUT"
    AGENT_TIMEOUT = "AGENT_TIMEOUT"
    INTERNAL_ERROR = "INTERNAL_ERROR"


class GenderRestriction(str, Enum):
    """Scheme-side gender restriction; 'any' means no restriction."""

    MALE = "male"
    FEMALE = "female"
    ANY = "any"

    @classmethod
    def _missing_(cls, value: object) -> GenderRestriction | None:
        if isinstance(value, str):
            val = value.strip().lower()
            if val in ("male", "m"):
                return cls.MALE
            if val in ("female", "f"):
                return cls.FEMALE
            return cls.ANY
        return cls.ANY


# The extensible government-ID document keys, used by both gov_id_available (request)
# and required_documents / missing_documents (response). Order is canonical.
GOV_ID_KEYS: tuple[str, ...] = (
    "aadhaar",
    "income_certificate",
    "caste_certificate",
    "ration_card",
    "domicile_certificate",
    "disability_certificate",
    "land_record",
    "bank_passbook",
    "voter_id",
    "education_marksheet",
)
