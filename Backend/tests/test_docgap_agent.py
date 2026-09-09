"""Tests for the Document Gap Agent."""

from __future__ import annotations

from Backend.agents.docgap_agent import available_documents, missing_documents_for_scheme
from Backend.models.request_models import CitizenProfile
from Backend.models.scheme_models import Scheme

from .conftest import make_profile_dict


def make_scheme(required) -> Scheme:
    return Scheme.model_validate(
        {
            "scheme_id": "doc-001",
            "scheme_name": "Doc Test",
            "scheme_category": "other",
            "issuing_authority": "Test",
            "eligibility_rules": {},
            "benefit_summary": "Test",
            "benefit_value_estimate": "₹1,000",
            "required_documents": required,
            "application_url": "https://example.gov.in/",
        }
    )


def profile_with_docs(aadhaar, income_certificate, caste_certificate, ration_card) -> CitizenProfile:
    data = make_profile_dict(
        gov_id_available={
            "aadhaar": aadhaar,
            "income_certificate": income_certificate,
            "caste_certificate": caste_certificate,
            "ration_card": ration_card,
        }
    )
    return CitizenProfile(**data)


def test_citizen_missing_two_of_four():
    # Has aadhaar + ration_card; missing income_certificate + caste_certificate.
    p = profile_with_docs(True, False, False, True)
    scheme = make_scheme(["aadhaar", "income_certificate", "caste_certificate", "ration_card"])
    assert missing_documents_for_scheme(p, scheme) == ["income_certificate", "caste_certificate"]


def test_all_documents_available_empty_missing():
    p = profile_with_docs(True, True, True, True)
    scheme = make_scheme(["aadhaar", "income_certificate"])
    assert missing_documents_for_scheme(p, scheme) == []


def test_missing_only_required_subset():
    # Scheme requires only aadhaar; citizen has it -> nothing missing even though
    # other docs are absent.
    p = profile_with_docs(True, False, False, False)
    scheme = make_scheme(["aadhaar"])
    assert missing_documents_for_scheme(p, scheme) == []


def test_missing_document_not_required_is_ignored():
    # Citizen lacks caste_certificate but the scheme doesn't need it.
    p = profile_with_docs(True, True, False, True)
    scheme = make_scheme(["aadhaar", "income_certificate", "ration_card"])
    assert missing_documents_for_scheme(p, scheme) == []


def test_missing_order_is_canonical():
    # Even if required list is in a different order, output follows GOV_ID_KEYS order.
    p = profile_with_docs(False, False, False, False)
    scheme = make_scheme(["ration_card", "aadhaar", "caste_certificate", "income_certificate"])
    assert missing_documents_for_scheme(p, scheme) == [
        "aadhaar",
        "income_certificate",
        "caste_certificate",
        "ration_card",
    ]


def test_available_documents_helper():
    p = profile_with_docs(True, False, True, False)
    assert available_documents(p) == {"aadhaar", "caste_certificate"}


def test_no_required_documents_empty_missing():
    p = profile_with_docs(False, False, False, False)
    scheme = make_scheme([])
    assert missing_documents_for_scheme(p, scheme) == []
