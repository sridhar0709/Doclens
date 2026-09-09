"""Pipeline orchestration for POST /api/intake.

Sequence:
  1. Intake      — normalize + sanitize the validated CitizenProfile.
  2. Eligibility — deterministic rule engine -> eligible schemes + scores.
  3. Ranking     — assign priority_rank.
  4. DocGap      — attach missing_documents to each scheme.
  5. (optional)  — LLM polish of benefit_summary, with graceful fallback.

The Drafter agent is intentionally NOT called here — drafts are produced only via
GET /api/draft/{scheme_id}.

Returns an IntakeResponse plus a flag indicating whether any degradation occurred
(e.g. an attempted LLM polish that fell back), so the caller can set
processing_status to "partial_success".
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass

from ..llm.groq_client import GroqClient
from ..models.enums import ProcessingStatus
from ..models.request_models import CitizenProfile
from ..models.response_models import IntakeResponse, SchemeResult
from ..models.scheme_models import Scheme
from .docgap_agent import missing_documents_for_scheme
from .eligibility_agent import find_eligible_schemes
from .intake_agent import normalize_profile
from .ranking_agent import rank_schemes


@dataclass
class PipelineOutput:
    response: IntakeResponse
    normalized_profile: CitizenProfile


def _benefit_polish_prompt(scheme: Scheme) -> str:
    return (
        "Rewrite this welfare scheme benefit summary in one or two clear, friendly "
        "sentences for a citizen. Keep all facts and numbers accurate; do not invent "
        "eligibility claims. Return only the rewritten summary.\n\n"
        f"Scheme: {scheme.scheme_name}\nSummary: {scheme.benefit_summary}"
    )


async def run_intake_pipeline(
    profile: CitizenProfile,
    request_id: str,
    schemes: tuple[Scheme, ...],
    llm: GroqClient | None = None,
    user_id: str | None = None,
) -> PipelineOutput:
    """Run the full deterministic pipeline and assemble the IntakeResponse."""
    # 1. Intake normalization + sanitization.
    normalized = normalize_profile(profile)

    # 2. Deterministic eligibility.
    eligible = find_eligible_schemes(normalized, schemes)

    # 3. Ranking.
    ranked = rank_schemes(eligible)

    # 4. + 5. Build each SchemeResult (docgap + optional benefit polish).
    degraded = False

    # Optionally polish all benefit summaries concurrently; failures fall back.
    summaries: dict[str, str] = {}
    if llm is not None and llm.available and ranked:
        async def _polish(scheme: Scheme) -> tuple[str, str, bool]:
            text, used = await llm.polish(
                _benefit_polish_prompt(scheme), fallback=scheme.benefit_summary
            )
            return scheme.scheme_id, text, used

        results = await asyncio.gather(
            *(_polish(r.result.scheme) for r in ranked), return_exceptions=True
        )
        for item in results:
            if isinstance(item, Exception):
                degraded = True
                continue
            scheme_id, text, used = item
            summaries[scheme_id] = text
            if not used:
                degraded = True

    scheme_results: list[SchemeResult] = []
    all_missing_docs: set[str] = set()
    for ranked_scheme in ranked:
        scheme = ranked_scheme.result.scheme
        missing_docs = missing_documents_for_scheme(normalized, scheme, user_id=user_id)
        all_missing_docs.update(missing_docs)
        score_val = round(ranked_scheme.result.score, 2)
        scheme_results.append(
            SchemeResult(
                scheme_id=scheme.scheme_id,
                scheme_name=scheme.scheme_name,
                scheme_category=scheme.scheme_category,
                issuing_authority=scheme.issuing_authority,
                benefit_summary=summaries.get(scheme.scheme_id, scheme.benefit_summary),
                benefit_value_estimate=scheme.benefit_value_estimate,
                eligibility_match_score=score_val,
                match_score=score_val,
                priority_rank=ranked_scheme.priority_rank,
                missing_documents=missing_docs,
                application_url=scheme.application_url,
                drafted_application_text=None,  # populated only via /api/draft
            )
        )


    status = ProcessingStatus.PARTIAL_SUCCESS if degraded else ProcessingStatus.SUCCESS
    response = IntakeResponse(
        request_id=request_id,
        eligible_schemes=scheme_results,
        ranked_schemes=scheme_results,
        total_eligible_count=len(scheme_results),
        missing_documents_summary=sorted(list(all_missing_docs)),
        processing_status=status,
        error_message=None,
    )
    return PipelineOutput(response=response, normalized_profile=normalized)

