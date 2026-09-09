import pytest
from httpx import ASGITransport, AsyncClient
from Backend.main import create_app
from Backend.core.auth import get_current_user, get_current_user_client, verify_internal_secret, AuthenticatedUser
from Backend.core.supabase_client import get_supabase_client, get_service_role_client
from .conftest import MockSupabaseClient, make_profile_dict

@pytest.fixture
async def authed_client():
    """An AsyncClient with all dependencies mocked for offline testing."""
    app = create_app()
    mock_db = MockSupabaseClient()
    
    # Enable dependencies mock
    app.dependency_overrides[get_current_user] = lambda: "mocked_user_uuid"
    app.dependency_overrides[get_current_user_client] = lambda: AuthenticatedUser(user_id="mocked_user_uuid", supabase=mock_db)
    app.dependency_overrides[get_supabase_client] = lambda: mock_db
    app.dependency_overrides[get_service_role_client] = lambda: mock_db
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        async with app.router.lifespan_context(app):
            yield c

@pytest.fixture
async def unauthed_client():
    """An AsyncClient where JWT auth raises 401, but internal secrets work if supplied."""
    app = create_app()
    mock_db = MockSupabaseClient()
    
    app.dependency_overrides[get_supabase_client] = lambda: mock_db
    app.dependency_overrides[get_service_role_client] = lambda: mock_db
    # Do not override get_current_user so it uses the real decoder (which fails on missing header)
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        async with app.router.lifespan_context(app):
            yield c


# 1. Test JWT Protection on Document Vault and Profile Intake
async def test_vault_endpoints_require_jwt(unauthed_client):
    # GET /api/documents without token -> 401
    resp = await unauthed_client.get("/api/documents")
    assert resp.status_code == 401
    
    # POST /api/documents/upload without token -> 401
    resp = await unauthed_client.post("/api/documents/upload", data={"doc_type": "aadhaar"})
    assert resp.status_code == 401
    
    # POST /api/documents/some-uuid/confirm without token -> 401
    resp = await unauthed_client.post("/api/documents/some-uuid/confirm", json={"annual_income": 90000})
    assert resp.status_code == 401
    
    # POST /api/intake without token -> 401
    resp = await unauthed_client.post("/api/intake", json=make_profile_dict())
    assert resp.status_code == 401


# 2. Test Document Vault happy paths (Upload -> Confirm -> List)
async def test_document_vault_flow(authed_client, monkeypatch):
    # Mock OCR provider to return a deterministic result offline
    from Backend.agents.document_agent import OCRSpaceProvider
    monkeypatch.setattr(
        OCRSpaceProvider,
        "extract",
        lambda self, fb, fn, dt: ({"annual_income": 90000.0, "raw_text": "Income: 90000"}, 0.95)
    )
    
    # 2.1 Test Upload Document
    files = {"file": ("income.pdf", b"pdf content", "application/pdf")}
    resp = await authed_client.post(
        "/api/documents/upload",
        data={"doc_type": "income_certificate"},
        files=files,
        headers={"Authorization": "Bearer mock-token"}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["doc_type"] == "income_certificate"
    assert body["verification_status"] == "pending"
    assert body["extracted_data"]["annual_income"] == 90000.0
    assert body["extraction_confidence"] == 0.95
    assert "signed_url" in body
    
    doc_id = body["document_id"]
    
    # 2.2 Test Confirm Document
    resp = await authed_client.post(
        f"/api/documents/{doc_id}/confirm",
        json={"annual_income": 85000.0},
        headers={"Authorization": "Bearer mock-token"}
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"
    
    # 2.3 Test List Documents
    resp = await authed_client.get(
        "/api/documents",
        headers={"Authorization": "Bearer mock-token"}
    )
    assert resp.status_code == 200
    docs = resp.json()
    assert len(docs) > 0
    assert docs[0]["doc_type"] == "aadhaar"
    assert "signed_url" in docs[0]


# 3. Test Webhook Security Validation (INTERNAL_API_SECRET checking)
async def test_internal_webhooks_security(unauthed_client):
    # 3.1 Profile Webhook: call without secret -> 401
    resp = await unauthed_client.post("/api/internal/match-profile", json={"user_id": "some-user"})
    assert resp.status_code == 401
    
    # Profile Webhook: call with incorrect secret -> 401
    resp = await unauthed_client.post(
        "/api/internal/match-profile",
        json={"user_id": "some-user"},
        headers={"X-Internal-Secret": "wrong_secret"}
    )
    assert resp.status_code == 401
    
    # Profile Webhook: call with correct secret -> 200 (since we mock database)
    resp = await unauthed_client.post(
        "/api/internal/match-profile",
        json={"user_id": "mocked_user_uuid"},
        headers={"X-Internal-Secret": "mock_internal_secret"}
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"

    # 3.2 Scheme Webhook: call without secret -> 401
    resp = await unauthed_client.post(
        "/api/internal/match-scheme",
        json={"scheme_id": "uuid-scheme-0", "candidate_user_ids": ["mocked_user_uuid"]}
    )
    assert resp.status_code == 401
    
    # Scheme Webhook: call with correct secret -> 200
    resp = await unauthed_client.post(
        "/api/internal/match-scheme",
        json={"scheme_id": "uuid-scheme-0", "candidate_user_ids": ["mocked_user_uuid"]},
        headers={"X-Internal-Secret": "mock_internal_secret"}
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"


# 4. Test Scheme Search Endpoint (Public Browse FTS Index)
async def test_scheme_search(authed_client):
    # Query matching 'KISAN'
    resp = await authed_client.get("/api/schemes/search?q=KISAN")
    assert resp.status_code == 200
    body = resp.json()
    assert "results" in body
    assert len(body["results"]) > 0
    # PM-KISAN should be in search results
    assert any("KISAN" in s["scheme_name"].upper() for s in body["results"])


# 5. Test Admin Endpoint Scheme Creation JWT checking
async def test_admin_endpoints_role_checks(unauthed_client, authed_client):
    # No Auth -> 401
    resp = await unauthed_client.post("/api/admin/schemes", json={})
    assert resp.status_code == 401
    
    # Authenticated but not admin -> 403 Forbidden
    import jwt
    non_admin_token = jwt.encode(
        {"sub": "user_uuid", "email": "user@doclens.in", "aud": "authenticated"},
        "mock_jwt_secret",
        algorithm="HS256"
    )
    resp = await authed_client.post(
        "/api/admin/schemes",
        json={"scheme_name": "Test Scheme"},
        headers={"Authorization": f"Bearer {non_admin_token}"}
    )
    assert resp.status_code == 403
    
    # Authenticated admin -> 200 Success
    # We mock admin by using jwt header check with admin email
    import jwt
    admin_token = jwt.encode({"sub": "admin_uuid", "email": "admin@doclens.in", "aud": "authenticated"}, "mock_jwt_secret", algorithm="HS256")
    resp = await authed_client.post(
        "/api/admin/schemes",
        json={
            "scheme_id": "test-scheme-99",
            "scheme_name": "Admin Test Scheme",
            "scheme_category": "agriculture",
            "issuing_authority": "Admin ministry",
            "eligibility_rules": {},
            "benefit_summary": "Summary text",
            "benefit_value_estimate": "Value text",
            "required_documents": [],
            "application_url": "https://test.gov"
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "created"
