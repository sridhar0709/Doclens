"""Request contract models for POST /api/intake.

FROZEN - field names, types, and shape must match the frontend TypeScript
contract exactly.
All models forbid unknown fields (extra="forbid") per the security requirements.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .enums import (
    DisabilityStatus,
    EducationLevel,
    Gender,
    Occupation,
    SocialCategory,
)


class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    message: str = Field(min_length=1, max_length=2000)
    history: list[dict[str, str]] = Field(default_factory=list)


class GovIdAvailable(BaseModel):
    """Boolean flags for each government ID the citizen has available."""

    model_config = ConfigDict(extra="forbid")

    aadhaar: bool
    income_certificate: bool
    caste_certificate: bool
    ration_card: bool


class CitizenProfile(BaseModel):
    """The citizen welfare-eligibility profile submitted to POST /api/intake.

    All fields are required EXCEPT ``land_owned_acres`` (default 0) and
    ``disability_status`` (default "none").
    All models forbid unknown fields per security requirements.
    """

    model_config = ConfigDict(extra="forbid")

    full_name: str = Field(min_length=1, max_length=200)
    age: int = Field(ge=0, le=120)
    gender: Gender
    state: str = Field(min_length=1, max_length=100)
    district: str = Field(min_length=1, max_length=100)
    annual_income: float = Field(ge=0)
    occupation: Occupation
    social_category: SocialCategory
    disability_status: DisabilityStatus = DisabilityStatus.NONE
    family_size: int = Field(ge=1, le=50)
    has_bpl_card: bool
    land_owned_acres: float = Field(default=0, ge=0)
    education_level: EducationLevel
    gov_id_available: GovIdAvailable

    @field_validator("annual_income", "land_owned_acres", mode="before")
    @classmethod
    def _reject_string_numbers(cls, v: Any) -> Any:
        """Numeric fields must be JSON numbers, never strings.

        Pydantic would otherwise coerce "180000" -> 180000; the contract states
        annual_income is a number, never a string, so reject str/bool explicitly.
        (bool is a subclass of int and must not masquerade as a number here.)
        """
        if isinstance(v, str) or isinstance(v, bool):
            raise ValueError("must be a number, not a string or boolean")
        return v
