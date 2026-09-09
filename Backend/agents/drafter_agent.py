"""Application Drafter Agent — generate a pre-filled application draft on demand.

Called only via GET /api/draft/{scheme_id}, never upfront for all schemes. Builds
a deterministic template from the citizen profile + scheme data, then optionally
polishes the phrasing via Groq. If the LLM call fails, the raw template is
returned rather than erroring out.
"""

from __future__ import annotations

from ..llm.groq_client import GroqClient
from ..models.enums import GOV_ID_KEYS
from ..models.request_models import CitizenProfile
from ..models.scheme_models import Scheme

# Human-readable labels for the document keys.
DOC_LABELS = {
    "aadhaar": "Aadhaar card",
    "income_certificate": "Income certificate",
    "caste_certificate": "Caste certificate",
    "ration_card": "Ration card",
}


def _available_doc_labels(profile: CitizenProfile) -> list[str]:
    gov = profile.gov_id_available.model_dump()
    return [DOC_LABELS[k] for k in GOV_ID_KEYS if gov.get(k)]


def build_template(profile: CitizenProfile, scheme: Scheme) -> str:
    """Build the deterministic application draft text from profile + scheme."""
    docs = _available_doc_labels(profile)
    docs_line = ", ".join(docs) if docs else "None available"
    # annual_income may be a float; render whole rupees cleanly.
    income = int(profile.annual_income) if float(profile.annual_income).is_integer() else profile.annual_income
    return (
        f"To: {scheme.issuing_authority}\n"
        f"Subject: Application for {scheme.scheme_name}\n\n"
        f"I, {profile.full_name}, residing in {profile.district}, {profile.state}, "
        f"hereby apply for {scheme.scheme_name}.\n"
        f"My annual income is ₹{income} and I belong to the {profile.social_category.value} category.\n"
        f"Attached documents: {docs_line}"
    )


def build_next_steps(scheme: Scheme) -> list[str]:
    """Return a simple, generic set of next steps for submitting the application."""
    return [
        "Visit the nearest Common Service Centre (CSC) or the official portal.",
        f"Submit the application for {scheme.scheme_name} with the attached documents.",
        "Note your application reference number for tracking.",
    ]


def _polish_prompt(template: str, scheme: Scheme) -> str:
    return (
        "Rewrite the following government scheme application to read more naturally and "
        "politely in formal English. Keep ALL facts, names, numbers, and the recipient "
        "exactly as given. Do not invent details. Return only the rewritten letter.\n\n"
        f"{template}"
    )


async def draft_application(
    profile: CitizenProfile,
    scheme: Scheme,
    llm: GroqClient | None = None,
) -> tuple[str, bool]:
    """Return (drafted_text, used_llm).

    Builds the template deterministically, then optionally polishes via the LLM
    with graceful fallback to the raw template.
    """
    template = build_template(profile, scheme)
    if llm is None or not llm.available:
        return template, False

    text, used_llm = await llm.polish(_polish_prompt(template, scheme), fallback=template)
    return text, used_llm
