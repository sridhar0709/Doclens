# 🔒 Security

> 6-layer defense-in-depth: Edge → Auth → RLS → Sanitization → Rate Limiting → Headers

---

## 🛡️ Defense Layers

| Layer | Protection |
|-------|-----------|
| **1. Edge (Vercel)** | Scanner blocking, payload limits, auth routing |
| **2. Authentication** | Supabase JWT, JWKS caching, dual DB clients |
| **3. Row-Level Security** | 22 policies, 5 user-scoped tables |
| **4. Input Sanitization** | HTML, prompt injection, SQL injection, control chars |
| **5. Rate Limiting** | 20 req/min/IP with optional Redis |
| **6. Security Headers** | XSS, MIME sniffing, clickjacking, HSTS |

---

## 🛡️ Layer 1: Edge Protection

The frontend `middleware.ts` runs at the Vercel Edge before any request:

**Scanner blocking** — Known malicious user-agents receive `403`:
```
curl, python-requests, masscan, nikto, sqlmap, postmanruntime, zgrab, nmap
```

**Payload size** — Requests > 10MB rejected.

**Auth routing** — Unauthenticated → `/login`; Authenticated → `/dashboard`.

---

## 🛡️ Layer 2: Authentication

**Supabase Auth** handles user registration, login, and JWT issuance.

Backend JWT verification (`core/auth.py`):
- **Header:** `Authorization: Bearer <supabase-jwt>`
- **Algorithms:** HS256 + ES256 with JWKS caching
- **Extracted:** `user_id` (sub claim)

**Two database clients:**

| Client | RLS | When Used |
|--------|-----|-----------|
| Service Role | Bypasses RLS | Internal/admin endpoints |
| User JWT | Enforces RLS | User-facing endpoints |

**Internal endpoints** (`/api/internal/*`, `/api/admin/*`) require `X-Internal-Secret` header matching the shared secret.

---

## 🛡️ Layer 3: Row-Level Security

All user-data tables scoped via `auth.uid() = user_id`:

```sql
CREATE POLICY "Users can select their own documents"
    ON public.documents FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
```

| Table | Public Read | Own CRUD |
|-------|-------------|----------|
| `document_types` | ✅ | — |
| `schemes` | ✅ | — |
| `citizen_profiles` | — | ✅ |
| `documents` | — | ✅ |
| `eligibility_matches` | — | ✅ |
| `notifications` | — | ✅ |
| `applications` | — | ✅ |

---

## 🛡️ Layer 4: Input Sanitization

`SanitizerEngine` (`core/sanitization.py`) applies to all free-text fields:

| Protection | Pattern |
|-----------|---------|
| HTML stripping | `<script>`, `<style>`, all tags |
| HTML entity decode | `&#xXX;` → text → re-strip |
| Prompt injection | `ignore previous instructions`, `system prompt` |
| SQL injection | `DROP TABLE`, `UNION SELECT`, `OR 1=1` |
| Control characters | Null bytes, bidi override, escape sequences |

Runs **iteratively** to defeat nested/malformed input.

---

## 🛡️ Layer 5: Rate Limiting

**SlowAPI** (`core/security.py`):
- **Default:** 20 requests/minute per IP
- **Storage:** In-memory (optional Redis via `REDIS_URL`)
- **Config:** `RATE_LIMIT` env var

```json
{"detail": "Rate limit exceeded: 20 per 1 minute"}
```

---

## 🛡️ Layer 6: Security Headers

| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Strict-Transport-Security` | `max-age=31536000` |

---

## 🌐 CORS

Explicit allowlist via `ALLOWED_ORIGINS`. Production rejects `*`:

```python
if config.ENVIRONMENT == "production" and "*" in config.ALLOWED_ORIGINS:
    raise RuntimeError("Wildcard CORS origin '*' is not allowed in production")
```

---

## 📋 Logging

**Policy:** Log `request_id` + outcome. **Never log citizen PII.**
- `structlog` with JSON format in production
- Optional Sentry via `SENTRY_DSN`

---

## 📄 Related

- [Architecture →](Architecture)
- [Database Schema →](Database-Schema) — RLS per table
- [API Reference →](API-Reference)
