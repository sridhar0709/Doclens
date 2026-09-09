# 🏗️ Architecture

> System design, data flow, and agent pipeline for the eligibility engine

---

## 📐 System Overview

![System Architecture](assets/architecture.svg)

---

## 🔄 Data Flows

### Anonymous Eligibility Check

```
POST /api/intake (profile data)
  → IntakeAgent.normalize_profile()
  → EligibilityAgent.find_eligible_schemes()
  → RankingAgent.rank_schemes()
  → DocgapAgent.missing_documents()
  → Response (matches + missing docs)
  → request_id cached for 30 minutes

Later: GET /api/draft/{scheme_id}?request_id=xxx
  → DrafterAgent.generate_draft()
  → Response (formal application letter)
```

### Authenticated Flow

```
User registers → Supabase Auth → JWT
  → Trigger: on_auth_user_created_profile
    → citizen_profiles row auto-created

POST /api/intake/auth (JWT)
  → Same pipeline as anonymous
  → Results persisted to eligibility_matches
  → Trigger: trg_notify_new_match → notification created

Edge Function: on-profile-change
  → POST /api/internal/match-profile
  → Re-evaluates all schemes for that user

Edge Function: on-scheme-change
  → Dynamic Supabase pre-filter
  → POST /api/internal/match-scheme
  → Re-evaluates scheme for all candidate users
```

---

## 🤖 Agent Pipeline

![Agent Pipeline](assets/pipeline.svg)

| Step | Agent | File | Responsibility |
|------|-------|------|----------------|
| 1 | **IntakeAgent** | `agents/intake_agent.py` | Sanitize, validate, normalize profile |
| 2 | **EligibilityAgent** | `agents/eligibility_agent.py` | Rules-based eligibility check |
| 3 | **RankingAgent** | `agents/ranking_agent.py` | Value tier + combined scoring |
| 4 | **DocgapAgent** | `agents/docgap_agent.py` | Compare required vs available documents |
| 5 | **DrafterAgent** | `agents/drafter_agent.py` | Generate formal application letter |

### 1. IntakeAgent

Sanitizes free-text fields (HTML stripping, injection patterns), validates ranges, sets defaults for missing fields.

### 2. EligibilityAgent — Deterministic Rule Engine

Evaluates each scheme's `eligibility_rules` JSONB across these dimensions:

| Dimension | Logic | Penalty |
|-----------|-------|---------|
| **Age** | `min_age ≤ age ≤ max_age` | -0.05 if within 2 years of boundary |
| **Income** | `income ≤ max_annual_income` | -0.10 if within 10% of cap |
| **Occupation** | Match against `allowed_occupations` (empty = any) | Binary |
| **Social Category** | Match against `allowed_social_categories` (empty = any) | Binary |
| **Disability** | Match against `required_disability_status` (empty = any) | Binary |
| **State** | Must be in `state_restricted_to` (empty = all) | Binary |
| **Gender** | `any`, `male_only`, or `female_only` | Binary |

**Score** = geometric mean of dimension scores minus penalties.

### 3. RankingAgent

Parses `benefit_value_estimate` with keyword matching (₹, lakh, crore, year, month, one-time), assigns value tier (0-5). **Combined score** = `TIER_WEIGHT × tier + MATCH_WEIGHT × match_score`. **Tie-breaker:** category priority (PENSION → HEALTH → ...), then `scheme_id`.

### 4. DocgapAgent

Queries verified documents from Supabase, compares against `required_documents` JSONB, returns the diff.

### 5. DrafterAgent

Template-based letter generation with optional Groq polish. Degrades gracefully on LLM failure.

---

## 🧱 Backend Middleware Stack

| Layer | Protection |
|-------|-----------|
| 1 | Rate Limiter — 20 req/min/IP |
| 2 | CORS — Explicit allowlist, rejects `*` in production |
| 3 | Payload Size — 2MB max |
| 4 | Security Headers — XSS, MIME, clickjack, HSTS |
| 5 | Sanitization — HTML, prompt injection, SQL injection |
| 6 | Request Logging — structlog JSON, no PII |

---

## 📄 Related

- [Setup Guide →](Setup) — Run locally
- [API Reference →](API-Reference) — Endpoint docs
- [Database Schema →](Database-Schema) — Tables
