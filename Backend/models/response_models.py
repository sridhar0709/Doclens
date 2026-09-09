"""Response contract models for all endpoints.

FROZEN - field names, types, and shape must match the frontend TypeScript
contract exactly.
All models forbid unknown fields (extra="forbid").
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from .enums import ErrorCode, ProcessingStatus, SchemeCategory


class SchemeResult(BaseModel):
    """One eligible scheme in the IntakeResponse.eligible_schemes array."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    scheme_id: str
    scheme_name: str
    scheme_category: SchemeCategory
    issuing_authority: str = ""
    benefit_summary: str
    benefit_value_estimate: str
    eligibility_match_score: float = Field(ge=0.0, le=1.0)
    match_score: float = Field(default=0.0, ge=0.0, le=1.0)
    priority_rank: int = Field(ge=1)
    missing_documents: list[str]
    application_url: str
    # Always null in the intake response; populated only via GET /api/draft.
    drafted_application_text: str | None = None


class IntakeResponse(BaseModel):
    """Response body for POST /api/intake."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    request_id: str
    # ALWAYS an array, never null — empty list when nobody matches.
    eligible_schemes: list[SchemeResult]
    ranked_schemes: list[SchemeResult] = Field(default_factory=list)
    total_eligible_count: int = Field(ge=0)
    missing_documents_summary: list[str] = Field(default_factory=list)
    processing_time_ms: int = 0
    processing_status: ProcessingStatus
    error_message: str | None = None



class DraftResponse(BaseModel):
    """Response body for GET /api/draft/{scheme_id}."""

    model_config = ConfigDict(extra="forbid")

    scheme_id: str
    drafted_application_text: str
    required_documents: list[str]
    next_steps: list[str]


class HealthResponse(BaseModel):
    """Response body for GET /api/health."""

    model_config = ConfigDict(extra="forbid")

    status: str
    agents_online: list[str]


class ChatResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reply: str
    sources: list[str] = Field(default_factory=list)


class ErrorResponse(BaseModel):
    """Standard error shape returned on any failure, for all endpoints."""

    model_config = ConfigDict(extra="forbid")

    processing_status: ProcessingStatus = ProcessingStatus.ERROR
    error_message: str
    error_code: ErrorCode
