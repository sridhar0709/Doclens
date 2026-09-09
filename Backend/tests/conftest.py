"""Shared pytest fixtures and helpers for the backend test suite."""

from __future__ import annotations

import os
# Set env vars BEFORE importing any package modules to prevent Pydantic settings validation issues
os.environ["SUPABASE_URL"] = "https://mock.supabase.co"
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "mock_service_key"
os.environ["SUPABASE_JWT_SECRET"] = "mock_jwt_secret"
os.environ["INTERNAL_API_SECRET"] = "mock_internal_secret"
os.environ["OCR_SPACE_API_KEY"] = "mock_ocr_key"

import json
import uuid
from copy import deepcopy
from typing import Any
import pytest

import Backend.config as test_c
import inspect
print("LOADED CONFIG FILE IN PYTEST:", test_c.__file__)
print("LOADED CONFIG SOURCE IN PYTEST:", inspect.getsource(test_c.get_settings))

from Backend.core.auth import get_current_user, verify_internal_secret
from Backend.core.supabase_client import get_service_role_client, get_supabase_client

# A complete, contract-valid raw request body. Tests copy and mutate this.
VALID_PROFILE_DICT: dict[str, Any] = {
    "full_name": "Asha Devi",
    "age": 34,
    "gender": "female",
    "state": "Bihar",
    "district": "Patna",
    "annual_income": 180000,
    "occupation": "farmer",
    "social_category": "obc",
    "disability_status": "none",
    "family_size": 4,
    "has_bpl_card": True,
    "land_owned_acres": 2.5,
    "education_level": "secondary",
    "gov_id_available": {
        "aadhaar": True,
        "income_certificate": False,
        "caste_certificate": True,
        "ration_card": True,
    },
}


def make_profile_dict(**overrides: Any) -> dict[str, Any]:
    """Return a deep copy of the valid profile with top-level fields overridden."""
    data = deepcopy(VALID_PROFILE_DICT)
    data.update(overrides)
    return data


@pytest.fixture
def valid_profile_dict() -> dict[str, Any]:
    return deepcopy(VALID_PROFILE_DICT)


# ---------------------------------------------------------------------------
# Offline Supabase Mocking
# ---------------------------------------------------------------------------

# Load schemes.json at startup to populate the mock database table
json_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "schemes.json"))
with open(json_path, "r", encoding="utf-8-sig") as f:
    raw_schemes = json.load(f)

SCHEMES_DB_DATA = []
for idx, s in enumerate(raw_schemes):
    parts = s["scheme_id"].split("-")
    if parts[-1].isdigit() and len(parts[-1]) == 3 and int(parts[-1]) <= 20:
        SCHEMES_DB_DATA.append({
            "id": f"uuid-scheme-{idx}",
            "scheme_id": s["scheme_id"],
            "scheme_name": s["scheme_name"],
            "scheme_category": s["scheme_category"],
            "issuing_authority": s["issuing_authority"],
            "eligibility_rules": s["eligibility_rules"],
            "benefit_summary": s["benefit_summary"],
            "benefit_value_estimate": s["benefit_value_estimate"],
            "required_documents": s["required_documents"],
            "application_url": s["application_url"],
            "is_active": True
        })


class MockSupabaseTable:
    def __init__(self, data_list, table_name=None, client_ref=None):
        self.data = data_list
        self.table_name = table_name
        self.client = client_ref
        self.filters = []

    def select(self, *args, **kwargs): return self
    def order(self, *args, **kwargs): return self
    def range(self, *args, **kwargs): return self
    def in_(self, *args, **kwargs): return self
    def or_(self, *args, **kwargs): return self

    @property
    def not_(self):
        return self

    def eq(self, field, value):
        self.filters.append((field, value))
        return self

    def neq(self, field, value):
        # basic inequality filter
        self.filters.append((field, ("neq", value)))
        return self

    def _get_filtered_data(self):
        res = self.data
        for field, val in self.filters:
            if isinstance(val, tuple) and val[0] == "neq":
                res = [r for r in res if r.get(field) != val[1]]
            else:
                res = [r for r in res if r.get(field) == val]
        return res

    def execute(self):
        class Result:
            def __init__(self, data):
                self.data = data
        return Result(self._get_filtered_data())

    def insert(self, data):
        rows = data if isinstance(data, list) else [data]
        inserted = []
        for r in rows:
            copied = deepcopy(r)
            if "id" not in copied:
                copied["id"] = str(uuid.uuid4())
            if "uploaded_at" not in copied:
                copied["uploaded_at"] = "2026-07-09T00:00:00Z"
            self.data.append(copied)
            inserted.append(copied)
        return MockSupabaseTable(inserted, self.table_name, self.client)

    def update(self, data):
        target_rows = self._get_filtered_data()
        for row in target_rows:
            row.update(data)
        return MockSupabaseTable(target_rows, self.table_name, self.client)

    def delete(self):
        target_rows = self._get_filtered_data()
        for row in target_rows:
            if row in self.data:
                self.data.remove(row)
        return MockSupabaseTable(target_rows, self.table_name, self.client)

    def upsert(self, data, on_conflict=None):
        rows = data if isinstance(data, list) else [data]
        inserted = []
        for r in rows:
            conflict = False
            if on_conflict == "user_id,scheme_id":
                for existing in self.data:
                    if existing.get("user_id") == r.get("user_id") and existing.get("scheme_id") == r.get("scheme_id"):
                        existing.update(r)
                        inserted.append(existing)
                        conflict = True
                        break
            if not conflict:
                copied = deepcopy(r)
                if "id" not in copied:
                    copied["id"] = str(uuid.uuid4())
                if "uploaded_at" not in copied:
                    copied["uploaded_at"] = "2026-07-09T00:00:00Z"
                self.data.append(copied)
                inserted.append(copied)
        return MockSupabaseTable(inserted, self.table_name, self.client)


class MockSupabaseStorage:
    def from_(self, bucket_name):
        return self

    def upload(self, path, file, file_options=None):
        return {"path": path}

    def create_signed_url(self, path, expires_in):
        return {"signedURL": f"https://mocked-signed-url.com/{path}?token=mock"}


class MockSupabaseClient:
    def __init__(self):
        self.storage = MockSupabaseStorage()
        self.db = {
            "schemes": SCHEMES_DB_DATA,
            "documents": [
                {
                    "id": "uuid-doc-1",
                    "user_id": "mocked_user_uuid",
                    "doc_type": "aadhaar",
                    "storage_path": "mocked_path",
                    "verification_status": "verified",
                    "extracted_data": {},
                    "extraction_confidence": 1.0,
                    "uploaded_at": "2026-07-09T00:00:00Z"
                }
            ],
            "citizen_profiles": [
                {
                    "id": "uuid-profile-1",
                    "user_id": "mocked_user_uuid",
                    "full_name": "Asha Devi",
                    "age": 34,
                    "gender": "female",
                    "state": "Bihar",
                    "district": "Patna",
                    "annual_income": 180000.0,
                    "occupation": "farmer",
                    "social_category": "obc",
                    "disability_status": "none",
                    "family_size": 4,
                    "has_bpl_card": True,
                    "land_owned_acres": 2.5,
                    "education_level": "secondary",
                    "is_current": True
                }
            ]
        }

    def table(self, table_name):
        if table_name not in self.db:
            self.db[table_name] = []
        return MockSupabaseTable(self.db[table_name], table_name, self)

    def rpc(self, name, params):
        if name == "search_schemes":
            query = params.get("query_text", "").lower()
            matching = [
                s for s in SCHEMES_DB_DATA 
                if query in s["scheme_name"].lower() or query in s["benefit_summary"].lower()
            ]
            return MockSupabaseTable(matching, "schemes", self)
        return MockSupabaseTable([], "rpc", self)





@pytest.fixture(autouse=True)
def mock_supabase_client(monkeypatch):
    import Backend.core.supabase_client as sc
    import Backend.main as main_mod
    import Backend.core.scheme_loader as scheme_loader_mod
    from Backend.llm.groq_client import GroqClient
    client = MockSupabaseClient()
    monkeypatch.setattr(sc, "get_service_role_client", lambda: client)
    monkeypatch.setattr(sc, "get_supabase_client", lambda *a, **k: client)
    monkeypatch.setattr(main_mod, "get_service_role_client", lambda: client)

    # Ensure offline, deterministic behavior across all tests:
    real_load_schemes = scheme_loader_mod.load_schemes
    def _benchmark_schemes(path=None):
        all_s = real_load_schemes(path)
        return [s for s in all_s if s.scheme_id.split("-")[-1].isdigit() and len(s.scheme_id.split("-")[-1]) == 3 and int(s.scheme_id.split("-")[-1]) <= 20]
    monkeypatch.setattr(scheme_loader_mod, "load_schemes", _benchmark_schemes)
    monkeypatch.setattr(main_mod, "load_schemes", _benchmark_schemes)

    # Disable live Groq network calls during test suite so tests run offline deterministically without 429 rate limits
    async def _offline_polish(self, prompt: str, fallback: str = "", *args, **kwargs) -> tuple[str, bool]:
        return fallback, True
    monkeypatch.setattr(GroqClient, "polish", _offline_polish)



