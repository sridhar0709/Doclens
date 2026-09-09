# 📡 API Reference

> Base URL: `/api` — Interactive docs at `/docs` (Swagger UI)

---

## 🏷️ Quick Reference

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/api/health` | Public | Liveness probe |
| `POST` | `/api/intake` | Public | Anonymous eligibility check |
| `POST` | `/api/intake/auth` | Bearer JWT | Authenticated eligibility check |
| `GET` | `/api/draft/{scheme_id}` | Public | Anonymous draft letter |
| `GET` | `/api/draft/user/{scheme_id}` | Bearer JWT | Authenticated draft letter |
| `GET` | `/api/schemes` | Public | List all schemes |
| `GET` | `/api/schemes/{scheme_id}` | Public | Scheme detail |
| `GET` | `/api/stats` | Public | Platform statistics |
| `GET` | `/api/dashboard` | Bearer JWT | User dashboard |
| `GET` | `/api/documents` | Bearer JWT | List user's documents |
| `POST` | `/api/documents/upload` | Bearer JWT | Upload file + OCR |
| `POST` | `/api/documents/{id}/confirm` | Bearer JWT | Confirm OCR data |
| `GET` | `/api/notifications` | Bearer JWT | List notifications |
| `POST` | `/api/notifications/{id}/read` | Bearer JWT | Mark notification read |
| `POST` | `/api/chat` | Bearer JWT | LLM chat |
| `POST` | `/api/internal/match-profile` | Internal | Re-match user |
| `POST` | `/api/internal/match-scheme` | Internal | Re-match scheme |
| `POST` | `/api/admin/refresh-matches` | Internal | Global re-match |

---

## 🌐 Public Endpoints

### GET /api/health

```json
{"status":"ok","service":"doclens-api"}
```

### POST /api/intake

Anonymous eligibility check. Results cached by `request_id` for 30 minutes.

```json
{
  "age": 32, "gender": "male", "state": "Odisha", "district": "Khordha",
  "annual_income": 120000, "occupation": "farmer", "social_category": "general",
  "disability_status": "none", "family_size": 4, "has_bpl_card": true,
  "land_owned_acres": 2.5, "education_level": "graduate",
  "gov_id_available": ["aadhaar", "ration_card"]
}
```

```json
{
  "request_id": "a1b2c3d4-...",
  "matches": [{
    "scheme_id": "pm-kisan-001",
    "scheme_name": "PM-KISAN Samman Nidhi",
    "category": "agriculture",
    "match_score": 0.92,
    "priority_rank": 1,
    "benefit_summary": "Income support of Rs 6,000 per year...",
    "benefit_value_estimate": "₹6,000/year",
    "missing_documents": ["income_certificate"],
    "application_url": "https://pmkisan.gov.in/"
  }],
  "total_matches": 5,
  "summary": {"total_annual_value": "₹3,42,000/year"}
}
```

### GET /api/schemes

List all active schemes. Returns array of scheme objects.

### GET /api/schemes/{scheme_id}

Single scheme detail by `scheme_id` (e.g. `pm-kisan-001`).

### GET /api/draft/{scheme_id}

Generate draft letter. Requires `?request_id=xxx` from `/api/intake`.

```json
{
  "scheme_id": "pm-kisan-001",
  "draft_text": "To,\nThe District Agriculture Officer\n\nSubject: Application for...",
  "llm_refined": false
}
```

### GET /api/stats

```json
{"total_schemes":20,"total_categories":8,"states_covered":28}
```

---

## 🔐 Authenticated Endpoints

All require `Authorization: Bearer <supabase-jwt>`.

### POST /api/intake/auth

Same as anonymous but persists matches to `eligibility_matches` and triggers notifications.

### GET /api/dashboard

```json
{
  "profile": {"...citizen_profiles..."},
  "matches": ["...ranked matches..."],
  "documents": ["...uploaded documents..."],
  "notifications": {"unread_count":3, "recent":["..."]}
}
```

### POST /api/documents/upload

`multipart/form-data` with `file` + `doc_type`. Doc types: `aadhaar`, `income_certificate`, `caste_certificate`, `ration_card`, `domicile_certificate`, `disability_certificate`, `land_record`, `bank_passbook`, `voter_id`, `education_marksheet`.

```json
{
  "id": "uuid",
  "doc_type": "aadhaar",
  "verification_status": "pending",
  "extracted_data": {"name":"Extracted Name"},
  "extraction_confidence": 0.87
}
```

### POST /api/documents/{id}/confirm

```json
{"status":"verified"}  // or {"status":"rejected"}
```

### GET /api/notifications

List notifications. Supports `?unread=true`. Returns array with `type`, `payload`, `read_at`, `created_at`.

### POST /api/notifications/{id}/read

`{"status":"ok"}`

### POST /api/chat

```json
{"message":"What schemes am I eligible for?"}
```

```json
{
  "response":"Based on your profile...",
  "llm_available":true,
  "model_used":"llama-3.3-70b-versatile"
}
```

> On LLM failure: `llm_available: false` with template fallback.

---

## 🔑 Internal Endpoints

Protected by `X-Internal-Secret` header.

| Method | Endpoint | Body |
|--------|----------|------|
| `POST` | `/api/internal/match-profile` | `{"user_id":"uuid"}` |
| `POST` | `/api/internal/match-scheme` | `{"scheme_id":"uuid","candidate_user_ids":["uuid"]}` |
| `POST` | `/api/admin/refresh-matches` | — |

---

## ❌ Errors

```json
{"detail":"Description","code":"ERROR_CODE"}
```

| Status | Cause |
|--------|-------|
| `400` | Validation error |
| `401` | Missing/invalid JWT |
| `403` | RLS violation, scanner blocked |
| `422` | Request body validation |
| `429` | Rate limit exceeded |
| `500` | Internal error |

---

## 📄 Related

- [Architecture →](Architecture)
- [Security →](Security)
- [Database Schema →](Database-Schema)
