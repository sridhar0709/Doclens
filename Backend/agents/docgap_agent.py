"""Document Gap Agent — compute which required documents a citizen is missing.

For each eligible scheme, the missing set is the scheme's required_documents
minus the documents the citizen has marked as available (True) in
gov_id_available. The result preserves the canonical GOV_ID_KEYS ordering so the
output is stable and deterministic.
"""

from __future__ import annotations

from ..models.enums import GOV_ID_KEYS
from ..models.request_models import CitizenProfile
from ..models.scheme_models import Scheme


def available_documents(profile: CitizenProfile | None, user_id: str | None = None) -> set[str]:
    """Return the set of document keys the citizen has (value is True or verified in DB)."""
    if user_id:
        try:
            from ..core.supabase_client import get_service_role_client
            supabase = get_service_role_client()
            res = (
                supabase.table("documents")
                .select("doc_type")
                .eq("user_id", user_id)
                .neq("verification_status", "rejected")
                .execute()
            )
            return {row["doc_type"] for row in res.data}
        except Exception:
            # Fall back to profile on database errors
            pass

    if profile is not None:
        gov = profile.gov_id_available
        return {doc for doc, has in gov.model_dump().items() if has is True}
    return set()


def missing_documents_for_scheme(
    profile: CitizenProfile | None, scheme: Scheme, user_id: str | None = None
) -> list[str]:
    """Return the ordered list of required documents the citizen is missing.

    Empty list means the citizen has every document the scheme requires.
    """
    have = available_documents(profile, user_id)
    required = set(scheme.required_documents)
    missing = required - have
    # Return in canonical key order for a stable, deterministic response.
    return [doc for doc in GOV_ID_KEYS if doc in missing]

