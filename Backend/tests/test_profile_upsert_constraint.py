import pytest
from httpx import ASGITransport, AsyncClient
from pydantic import ValidationError
from Backend.main import create_app
from Backend.core.auth import get_current_user, get_current_user_client, AuthenticatedUser
from Backend.core.supabase_client import get_supabase_client, get_service_role_client
from .conftest import MockSupabaseClient, make_profile_dict

@pytest.fixture
async def authed_client():
    app = create_app()
    mock_db = MockSupabaseClient()
    
    app.dependency_overrides[get_current_user] = lambda: "mocked_user_uuid"
    app.dependency_overrides[get_current_user_client] = lambda: AuthenticatedUser(user_id="mocked_user_uuid", supabase=mock_db)
    app.dependency_overrides[get_supabase_client] = lambda: mock_db
    app.dependency_overrides[get_service_role_client] = lambda: mock_db
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        async with app.router.lifespan_context(app):
            yield c

def test_pydantic_unexpected_fields_validation_error():
    from Backend.models.request_models import CitizenProfile
    
    profile_data = make_profile_dict()
    # Add an unexpected/extra field
    profile_data["some_unknown_field"] = "unexpected_value"
    
    # Validation should fail with ValidationError
    with pytest.raises(ValidationError):
        CitizenProfile.model_validate(profile_data)

async def test_confirm_document_updates_in_place(authed_client, monkeypatch):
    # Mock OCR provider to return a deterministic result offline
    from Backend.agents.document_agent import OCRSpaceProvider
    monkeypatch.setattr(
        OCRSpaceProvider,
        "extract",
        lambda self, fb, fn, dt: ({"annual_income": 90000.0, "raw_text": "Income: 90000"}, 0.95)
    )

    # 1. Upload the document first to populate the mock DB
    files = {"file": ("income.pdf", b"pdf content", "application/pdf")}
    upload_resp = await authed_client.post(
        "/api/documents/upload",
        data={"doc_type": "income_certificate"},
        files=files,
        headers={"Authorization": "Bearer mock-token"}
    )
    assert upload_resp.status_code == 200
    doc_id = upload_resp.json()["document_id"]

    # 2. Call confirm document endpoint which will trigger updating citizen_profiles in place
    resp = await authed_client.post(
        f"/api/documents/{doc_id}/confirm",
        json={"annual_income": 95000.0},
        headers={"Authorization": "Bearer mock-token"}
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"
