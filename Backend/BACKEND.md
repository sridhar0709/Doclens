# DocLens — Backend Documentation

> A government welfare-scheme **eligibility engine**. A citizen submits a single
> profile; the backend deterministically decides which of 20 Indian government
> schemes they qualify for, ranks them by value, tells them which documents they
> are missing, and can draft a ready-to-submit application on demand.

This document explains **everything** in the `Backend/` folder: the architecture,
every "agent", every module, the data contract, the security model, the LLM
policy, and how to run and test it.

---

## Table of Contents

1. [Design philosophy (read this first)](#1-design-philosophy-read-this-first)
2. [High-level architecture](#2-high-level-architecture)
3. [Folder & file map](#3-folder--file-map)
4. [The request lifecycle end-to-end](#4-the-request-lifecycle-end-to-end)
5. [The five agents in detail](#5-the-five-agents-in-detail)
6. [The pipeline orchestrator](#6-the-pipeline-orchestrator)
7. [Data models & the frozen API contract](#7-data-models--the-frozen-api-contract)
8. [The scheme dataset](#8-the-scheme-dataset)
9. [Core infrastructure modules](#9-core-infrastructure-modules)
10. [The LLM layer (Gemini)](#10-the-llm-layer-gemini)
11. [Configuration & environment](#11-configuration--environment)
12. [Security model](#12-security-model)
13. [API endpoints reference](#13-api-endpoints-reference)
14. [Testing](#14-testing)
15. [Running & deploying](#15-running--deploying)
16. [Supabase & Database Architecture](#16-supabase--database-architecture)

---

## 1. Design philosophy (read this first)

Three principles drive every decision in this backend:

### 1.1 Eligibility is deterministic — never an LLM decision

This is the single most important rule in the codebase. The system touches **real
legal entitlements**, so the question *"is this person eligible for this scheme?"*
is answered exclusively by a hand-written rule engine
(`agents/eligibility_agent.py`). The LLM is **never** asked to make that call.

Every eligibility verdict is:
- **Auditable** — you can trace exactly which rule passed or failed.
- **Reproducible** — same input + same `schemes.json` → identical output, always.

### 1.2 The LLM is language polish only, and always optional

Gemini is used for exactly two cosmetic things:
- Rewriting a scheme's `benefit_summary` into friendlier phrasing.
- Rewriting a drafted application letter into more natural formal English.

If the LLM is missing, misconfigured, times out, or errors — **the system degrades
gracefully** to deterministic template text. The API never fails because of the
LLM. A partial degradation is reported honestly as `processing_status:
"partial_success"`.

### 1.3 The API contract is frozen

The request/response shapes are enforced by the backend Pydantic models and the
frontend TypeScript types. All Pydantic models use `extra="forbid"` (unknown
fields are rejected with a `422`), enum values are exact lowercase snake_case,
and numeric fields refuse string values.
`eligible_schemes` is **always an array, never null** — an empty match is a valid,
successful outcome, not an error.

---

## 2. High-level architecture

```
                          POST /api/intake
                                │
                                ▼
        ┌─────────────────────────────────────────────────┐
        │             run_intake_pipeline()                │
        │                                                  │
        │  1. Intake      normalize + sanitize profile     │
        │  2. Eligibility deterministic rule engine        │
        │  3. Ranking     assign priority_rank             │
        │  4. DocGap      compute missing documents        │
        │  5. (optional)  LLM polish of benefit summaries  │
        └─────────────────────────────────────────────────┘
                                │
                                ▼
                        IntakeResponse  ──►  request_cache[request_id] = profile
                                                     │
                          GET /api/draft/{scheme_id}?request_id=…
                                                     │
                                                     ▼
                                          Drafter agent (template + optional LLM)
                                                     │
                                                     ▼
                                              DraftResponse
```

- **Framework:** FastAPI + Uvicorn (ASGI), Python 3.12.
- **Validation:** Pydantic v2 (request/response models + scheme file validation).
- **State:** Stateful persistence via Supabase PostgreSQL, combined with stateless request handling. An in-memory TTL cache holds intermediate profile states.
- **Database & Auth:** Supabase integration with PostgreSQL (user accounts, citizen profiles, missing documents tracking, scheme catalog, and user-to-scheme application records) secured via Row-Level Security (RLS) policies and JWT access tokens.
- **Asynchronous Triggers:** Supabase Deno Edge Functions trigger re-matching hooks on FastAPI upon profile or scheme modifications.

---

## 3. Folder & file map

```
Backend/
├── main.py                     # FastAPI app: lifespan, routes, error handlers, matching hooks
├── config.py                   # Typed Settings (pydantic-settings), env-driven
├── pytest.ini                  # Test config (asyncio auto mode)
├── requirements.txt            # Pinned exact dependency versions
├── Dockerfile                  # Multi-stage build, non-root, healthcheck
├── .env.example                # Env variable NAMES (no secrets)
│
├── agents/                     # The five "agents" + orchestrator
│   ├── intake_agent.py         # 1. normalize + sanitize the profile
│   ├── eligibility_agent.py    # 2. deterministic rule engine (the core)
│   ├── ranking_agent.py        # 3. priority ranking
│   ├── docgap_agent.py         # 4. missing-document computation
│   ├── drafter_agent.py        # 5. application-letter drafting (on demand)
│   └── pipeline.py             # orchestrates agents 1-4 (+ LLM polish)
│
├── models/                     # Pydantic contract & internal models
│   ├── enums.py                # All enum types + GOV_ID_KEYS
│   ├── request_models.py       # CitizenProfile, GovIdAvailable (request)
│   ├── response_models.py      # IntakeResponse, DraftResponse, etc.
│   └── scheme_models.py        # Scheme, EligibilityRules (internal)
│
├── core/                       # Cross-cutting infrastructure
│   ├── scheme_loader.py        # load + validate schemes.json at startup
│   ├── security.py             # rate limiter + CORS wiring
│   ├── sanitization.py         # HTML/script stripping for free text
│   ├── request_cache.py        # in-memory TTL/LRU cache (request_id → profile)
│   ├── logging_config.py       # structlog + Sentry setup
│   └── supabase_client.py      # Supabase client wrapper (service and public)
│
├── llm/
│   └── gemini_client.py        # thin async Gemini wrapper (generation only)
│
├── data/
│   └── schemes.json            # 20 welfare scheme definitions + rules
│
└── tests/                      # pytest suite (~1,500 lines, per-agent + integration)
    ├── conftest.py             # shared fixtures + stateful MockSupabaseClient
    ├── test_intake_agent.py
    ├── test_eligibility_agent.py
    ├── test_ranking_agent.py
    ├── test_docgap_agent.py
    ├── test_drafter_agent.py
    ├── test_pipeline.py
    ├── test_api_integration.py
    └── test_supabase_auth_and_documents.py # JWT, admin rules, webhooks & OCR tests
```

> The `.venv/` and `.venv_clean/` directories are local virtual environments and
> are not part of the source.

---

## 4. The request lifecycle end-to-end

### 4.1 Startup (`main.py` → `lifespan`)

On application start, the `lifespan` async context manager runs once and populates
`app.state`:

1. `get_settings()` — load and cache typed settings from the environment.
2. `configure_logging(settings)` — set up structlog (+ Sentry if a DSN is set).
3. `load_schemes()` — read, parse, and **validate** all 20 schemes from
   `data/schemes.json`. A malformed file fails **loudly at startup**.
4. Build lookups: `app.state.schemes` (tuple) and `app.state.schemes_by_id` (dict).
5. Construct the `GeminiClient` (LLM) and the `RequestCache`.
6. Log `startup_complete` with the scheme count, whether the LLM is active, and
   the environment.

### 4.2 `POST /api/intake`

1. A `request_id` (UUID) is generated and bound to the log context.
2. FastAPI validates the body against `CitizenProfile` (a `422` on any violation).
3. `run_intake_pipeline(...)` executes agents 1→4 plus optional LLM polish.
4. The **normalized profile** is stored in the request cache under `request_id`
   (so the later draft call can reuse it).
5. An `IntakeResponse` is returned; the outcome and eligible count are logged.
   The full profile is **never** logged.

### 4.3 `GET /api/draft/{scheme_id}?request_id=…`

1. Look up the scheme by id → `404` if unknown.
2. Look up the cached profile by `request_id` → `404` if unknown/expired.
3. The Drafter agent builds a deterministic letter template, then optionally
   polishes it via the LLM (falling back to the template on any failure).
4. Returns a `DraftResponse` with the letter, required documents, and next steps.

### 4.4 `GET /api/health`

Returns `{"status": "ok", "agents_online": [...]}` — a simple liveness probe used
by the Docker `HEALTHCHECK`.

---

## 5. The five agents in detail

The word "agent" here means a **single-responsibility module** in the pipeline — not an autonomous LLM agent. Four run inside the intake pipeline; the fifth (Drafter) runs only on the draft endpoint.

### 5.1 Intake Agent — `agents/intake_agent.py`

**Job:** Turn a validated raw request into a clean, normalized profile.

Pydantic handles initial schema validation (validating types, boundary ranges, enum values, and defaults). The Intake agent adds normalization and defensive sanitization logic that cannot be expressed via schema validation alone:

- **Defaults** (applied by the Pydantic models): `disability_status` defaults to `"none"` and `land_owned_acres` defaults to `0`.
- **Sanitization**: Applies defensive HTML/script stripping (using `core/sanitization.py`) to the free-text fields `full_name`, `state`, and `district`.
- **Guard**: Loops through the sanitized text fields. If any field is empty after sanitization (e.g., the input was pure markup), it raises a `ValueError` with the message `"{field_name} is empty after sanitization"`. This blocks processing with blank values.

Returns a normalized `CitizenProfile` constructed via `model_copy(update=...)` which skips re-validation since the inputs are already-validated sanitized strings.

### 5.2 Eligibility Reasoning Agent — `agents/eligibility_agent.py` ★ the core

**Job:** Deterministically decide eligibility and compute a boundary-sensitive confidence score.

#### Rule Semantics (critical)
A rule field that is `None` (for numbers) or an **empty list** represents **"NO RESTRICTION"** on that dimension (it does **not** mean "nobody qualifies"). A scheme is eligible only if **every applicable check passes**.

#### The Seven Rule Checks
Each check is a small, independently unit-tested function returning a `RuleCheck` dataclass containing:
- `name` (str)
- `applicable` (bool)
- `passed` (bool)
- `detail` (str)

By convention, if a rule is not applicable, `applicable` is set to `False` and `passed` defaults to `True`.

| Check Function | Rule Fields | Passes When / Logic | Exact `detail` Format |
|---|---|---|---|
| `check_age` | `min_age`, `max_age` | Age within `[min, max]` (either bound may be open). If both are `None`, it is marked not applicable. | `detail=f"age={profile.age} in [{lo},{hi}]"` |
| `check_income` | `max_annual_income` | `annual_income <= cap`. | `detail=f"income={profile.annual_income} cap={cap}"` |
| `check_occupation` | `allowed_occupations` | `profile.occupation.value` is in the `allowed_occupations` list. | `detail=f"occupation={profile.occupation.value}"` |
| `check_social_category` | `allowed_social_categories` | `profile.social_category.value` is in the `allowed_social_categories` list. | `detail=f"category={profile.social_category.value}"` |
| `check_disability` | `required_disability_status` | `profile.disability_status.value` is in the `required_disability_status` list. | `detail=f"disability={profile.disability_status.value}"` |
| `check_state` | `state_restricted_to` | `profile.state.strip().casefold()` matches any item in the `state_restricted_to` list (whitespace stripped, case-insensitive). | `detail=f"state={profile.state}"` |
| `check_gender` | `gender_restricted_to` | `profile.gender.value == restriction.value`, unless restriction is `any`. | `detail=f"gender={profile.gender.value}"` |

`evaluate_scheme()` runs all checks; the scheme is eligible iff `all(passed)` is true.

#### Confidence Scoring (`eligibility_match_score`, 0.0–1.0)
For an eligible scheme, the score starts at **1.0** and subtracts penalties for **near-boundary** conditions:
- **Income boundary**: If `cap` is not None and `profile.annual_income >= cap * 0.90` (within 10% below cap), applies `income_near_cap` penalty of **-0.10**.
- **Age min boundary**: If `min_age` is not None and `0 <= (profile.age - min_age) <= 2` (within 2 years above the minimum age), applies `age_near_min` penalty of **-0.05**.
- **Age max boundary**: If `max_age` is not None and `0 <= (max_age - profile.age) <= 2` (within 2 years below the maximum age), applies `age_near_max` penalty of **-0.05**.

The final score is computed as `max(0.0, min(1.0, 1.0 - sum(penalties)))`. Ineligible schemes receive a score of `0.0`.
- `>= 0.95`: Clearly eligible.
- `~0.70–0.85`: Eligible, but close to a boundary (the UI should signal double-checking with authorities).

`find_eligible_schemes()` evaluates all schemes and returns `EligibilityResult`s ONLY for eligible ones. An empty list is a normal outcome.

### 5.3 Ranking Agent — `agents/ranking_agent.py`

**Job:** Order eligible schemes and assign `priority_rank` (1 = highest priority).

Ordering is fully deterministic and follows this sequence:

1. **Value Tiering**: Classifies each scheme's `benefit_value_estimate` string into `TIER_LOW` (1), `TIER_MEDIUM` (2), or `TIER_HIGH` (3).
   - Extracts all number patterns via regex `_NUMBER_RE = re.compile(r"[\d][\d,]*")`, removes commas, and converts to integers.
   - Finds the largest integer figure `largest = max(amounts)`.
   - Tier logic:
     - `largest >= 100000` OR contains high-value keywords (`insurance`, `pension`, `cover`, `subsidy`) -> `TIER_HIGH` (3).
     - `largest >= 10000` -> `TIER_MEDIUM` (2).
     - Otherwise -> `TIER_LOW` (1).
2. **Combined Score**: Blends value tier and match score with equal weights (`TIER_WEIGHT = 1.0`, `MATCH_WEIGHT = 1.0`):
   - `combined_score = 1.0 * value_tier + 1.0 * eligibility_match_score`
3. **Deterministic Sorting**: Sorts descending by combined score. Ties are broken using:
   - **Category Priority** (lower index = higher priority):
     `pension` (0) → `health` (1) → `agriculture` (2) → `disability` (3) → `women_child` (4) → `education` (5) → `housing` (6) → `other` (7).
   - **Scheme ID**: Alphabetic comparison of `scheme_id` (ascending).
4. **Rank Assignment**: Assigns sequential `priority_rank` starting at 1.

### 5.4 Document Gap Agent — `agents/docgap_agent.py`

**Job:** For each eligible scheme, list the required documents that the citizen lacks.

- **Available Set**: Extracts document keys where the citizen marked `True` in `gov_id_available`.
- **Missing Set**: Computes `required_documents - available`.
- **Stable Order**: The returned missing documents list is filtered and ordered by the canonical `GOV_ID_KEYS` order: `["aadhaar", "income_certificate", "caste_certificate", "ration_card"]`.

An empty list means the citizen has all required documents.

### 5.5 Application Drafter Agent — `agents/drafter_agent.py`

**Job:** Generate a pre-filled application letter **on-demand** (runs only on `GET /api/draft/{scheme_id}`).

- **Document Label Mapping**: Maps database keys to human-readable strings:
  - `aadhaar` -> `"Aadhaar card"`
  - `income_certificate` -> `"Income certificate"`
  - `caste_certificate` -> `"Caste certificate"`
  - `ration_card` -> `"Ration card"`
- **Template Generation**: Builds a formal text letter. If `annual_income` is a float but represents a whole integer (e.g. `90000.0`), it is rendered as an integer.
  ```text
  To: {scheme.issuing_authority}
  Subject: Application for {scheme.scheme_name}

  I, {profile.full_name}, residing in {profile.district}, {profile.state}, hereby apply for {scheme.scheme_name}.
  My annual income is ₹{income} and I belong to the {profile.social_category.value} category.
  Attached documents: {docs_line}
  ```
  `docs_line` joins the human-readable labels of the citizen's available documents with `", "`, or outputs `"None available"`.
- **Next Steps**: Always returns a stable, generic 3-step checklist:
  1. `Visit the nearest Common Service Centre (CSC) or the official portal.`
  2. `Submit the application for {scheme.scheme_name} with the attached documents.`
  3. `Note your application reference number for tracking.`
- **LLM Polish**: Wraps the letter in a prompt and sends it to the Gemini client:
  ```text
  Rewrite the following government scheme application to read more naturally and politely in formal English. Keep ALL facts, names, numbers, and the recipient exactly as given. Do not invent details. Return only the rewritten letter.

  {template}
  ```
  If the LLM call succeeds, returns `(polished_text, True)`. If it fails, returns `(raw_template_text, False)`.

---

## 6. The pipeline orchestrator

**File:** `agents/pipeline.py` — `run_intake_pipeline(...)`.

Sequence for every intake request:

1. **Intake** → `normalize_profile(profile)`.
2. **Eligibility** → `find_eligible_schemes(normalized, schemes)`.
3. **Ranking** → `rank_schemes(eligible)`.
4. **DocGap + optional LLM polish** → build one `SchemeResult` per ranked scheme.

The Drafter is intentionally **not** invoked here.

### Optional benefit-summary polish (concurrent)

If the LLM is available (`llm.available` is `True`) and there are ranked schemes, the pipeline attempts to polish all benefit summaries concurrently:
- **Private Helper Coroutine**: A local `_polish(scheme: Scheme)` function is declared. It wraps `llm.polish` using the prompt format:
  ```text
  Rewrite this welfare scheme benefit summary in one or two clear, friendly sentences for a citizen. Keep all facts and numbers accurate; do not invent eligibility claims. Return only the rewritten summary.

  Scheme: {scheme.scheme_name}
  Summary: {scheme.benefit_summary}
  ```
  It returns `(scheme_id, polished_text, used_llm)`.
- **Concurrent Execution**: Executes all polish operations in parallel via `asyncio.gather(*(...), return_exceptions=True)`.
- **Graceful Failure Accumulation**: Iterates through the results:
  - If a result is an instance of `Exception` (representing a connection failure, timeout, etc.), it sets `degraded = True` and proceeds, keeping the original summary.
  - If the result returned successfully but `used_llm` is `False` (fell back to template), it sets `degraded = True`.
  - Otherwise, it saves the polished text to the output summaries dictionary.

### Processing Status

- **No Degradation**: If no exceptions or fallbacks occurred during LLM calls, `processing_status` is set to `"success"`.
- **Any LLM degradation**: If `degraded` is `True`, `processing_status` becomes `"partial_success"`.
- **Orchestration Return**: The orchestrator returns a `PipelineOutput` containing:
  - `response`: An `IntakeResponse` model containing the list of `SchemeResult` elements, total count, request ID, and processing status.
  - `normalized_profile`: The sanitized and normalized `CitizenProfile` (stashed in the request cache by `main.py`).

---

## 7. Data models & the frozen API contract

All models live in `models/` and use Pydantic v2. To ensure strict validation and prevent API contract drift, all request and response models set `model_config = ConfigDict(extra="forbid")` to reject any payload containing unknown or extraneous fields.

### 7.1 Enums — `models/enums.py`

Exact lowercase snake_case values; anything else is rejected with a `422`.

- `Gender`: `male | female | other`
- `Occupation`: `farmer | daily_wage | student | self_employed | salaried | unemployed | other`
- `SocialCategory`: `general | obc | sc | st | ews`
- `DisabilityStatus`: `none | physical | visual | hearing | intellectual | multiple`
- `EducationLevel`: `none | primary | secondary | higher_secondary | graduate | postgraduate`
- `SchemeCategory`: `education | health | agriculture | disability | women_child | housing | pension | other`
- `ProcessingStatus`: `success | partial_success | error`
- `ErrorCode`: `INVALID_INPUT | AGENT_TIMEOUT | INTERNAL_ERROR`
- `GenderRestriction` (scheme-side): `male | female | any`
- `GOV_ID_KEYS`: `("aadhaar", "income_certificate", "caste_certificate", "ration_card")`

### 7.2 Request models — `models/request_models.py`

**`CitizenProfile`** (the `POST /api/intake` body):

| Field | Type | Constraint / default |
|-------|------|----------------------|
| `full_name` | str | 1–200 chars |
| `age` | int | 0–120 |
| `gender` | Gender enum | required |
| `state` | str | 1–100 chars |
| `district` | str | 1–100 chars |
| `annual_income` | float | ≥ 0, must be a JSON number |
| `occupation` | Occupation enum | required |
| `social_category` | SocialCategory enum | required |
| `disability_status` | DisabilityStatus enum | default `"none"` |
| `family_size` | int | 1–50 |
| `has_bpl_card` | bool | required |
| `land_owned_acres` | float | ≥ 0, default `0` |
| `education_level` | EducationLevel enum | required |
| `gov_id_available` | GovIdAvailable | required |

**`GovIdAvailable`** — exactly four booleans (`aadhaar`, `income_certificate`, `caste_certificate`, `ration_card`), `extra="forbid"`.

**Numeric-string guard:** Pydantic normally attempts to coerce string integers (e.g. `"180000"`) or booleans to floats. To enforce a frozen contract, a custom pre-validator `@field_validator("annual_income", "land_owned_acres", mode="before")` is declared. It checks `isinstance(v, str) or isinstance(v, bool)` and explicitly raises a `ValueError("must be a number, not a string or boolean")`. Because `bool` is a subclass of `int` in Python, this also successfully blocks booleans from being coerced to numeric values.

### 7.3 Response models — `models/response_models.py`

- **`SchemeResult`** — one eligible scheme: `scheme_id`, `scheme_name`, `scheme_category`, `benefit_summary`, `benefit_value_estimate`, `eligibility_match_score` (0–1), `priority_rank` (≥1), `missing_documents`, `application_url`, and `drafted_application_text` (always `null` in intake).
- **`IntakeResponse`** — `request_id`, `eligible_schemes` (**always an array, never null**), `total_eligible_count`, `processing_status`, `error_message`.
- **`DraftResponse`** — `scheme_id`, `drafted_application_text`, `required_documents`, `next_steps`.
- **`HealthResponse`** — `status`, `agents_online`.
- **`ErrorResponse`** — the standard error shape: `processing_status="error"`, `error_message`, `error_code`.

### 7.4 Scheme models — `models/scheme_models.py` (internal)

Not part of the public contract, but validated at load time so a bad data entry becomes a clear startup error rather than a silent eligibility bug.

- **`EligibilityRules`** — `min_age`, `max_age`, `max_annual_income` (nullable), `allowed_occupations`, `allowed_social_categories`, `required_disability_status`, `state_restricted_to` (lists, default empty), `gender_restricted_to` (default `any`).
- **`Scheme`** — `scheme_id`, `scheme_name`, `scheme_category`, `issuing_authority`, `eligibility_rules`, `benefit_summary`, `benefit_value_estimate`, `required_documents`, `application_url`.
  - **Scheme ID Validator**: `@field_validator("scheme_id")` ensures that `scheme_id` is strictly lowercase, has no spaces, and no underscores (only hyphens/slug allowed): `v != v.lower() or " " in v or "_" in v` raises a `ValueError`.
  - **Required Documents Validator**: `@field_validator("required_documents")` ensures that it only contains keys present in `GOV_ID_KEYS`. Any invalid key raises a `ValueError`.

---

## 8. The scheme dataset

**File:** `data/schemes.json` — a JSON array of **20 real Indian welfare schemes**.

Coverage spans every category: agriculture (PM-KISAN, PMFBY, KALIA), housing
(PMAY-Gramin, PMAY-Urban), pensions (old-age, widow, disability), health
(Ayushman Bharat PM-JAY), education scholarships (NMMS, SC/OBC/ST post/pre-matric,
disability), women & child (Matru Vandana, Ladli Behna, Sukanya Samriddhi), and
other livelihood schemes (PM-SVANidhi, MGNREGA, NFBS).

Each entry contains the deterministic `eligibility_rules` block consumed by the
Eligibility agent, plus display fields (`benefit_summary`,
`benefit_value_estimate`, `application_url`) and `required_documents`.

Some schemes demonstrate specific rule dimensions:
- **State-restricted:** KALIA (Odisha), Ladli Behna (Madhya Pradesh).
- **Gender-restricted:** Matru Vandana, Ladli Behna, Sukanya, widow pension (female).
- **Category-restricted:** SC/OBC/ST scholarships.
- **Disability-required:** disability pension & scholarship.
- **No income cap:** PMFBY, PM-SVANidhi, MGNREGA, Sukanya (open on that dimension).

To add or edit a scheme, edit this file — no code changes needed. The loader
re-validates the whole file at startup and rejects duplicates.

---

## 9. Core infrastructure modules

### 9.1 Scheme loader — `core/scheme_loader.py`

- `load_schemes(path=None)` — reads `data/schemes.json`, parses JSON, validates every entry against `Scheme`, and rejects duplicate `scheme_id`s. Raises `SchemeDataError` on a missing file, invalid JSON, a validation failure, or a duplicate id — **fail loud at startup**.
- `get_schemes()` — an `lru_cache`d tuple of validated schemes.

### 9.2 Security wiring — `core/security.py`

- `build_limiter(settings)` — a slowapi `Limiter` keyed by client IP, with the configured default rate limit. Storage is **Redis** if `REDIS_URL` is set, else **in-memory** (`memory://`) — zero external deps locally. `headers_enabled=False` because slowapi's header injection needs a `Response` object, which would break endpoints returning Pydantic models.
- `configure_cors(app, settings)` — attaches `CORSMiddleware` with the **explicit origin allowlist** (never `"*"`), credentials allowed, methods limited to `GET/POST/OPTIONS`.

### 9.3 Sanitization — `core/sanitization.py`

`sanitize_text(value)` defensively strips HTML and script markup from free text to prevent downstream injection vulnerabilities (into logs, drafted letters, or potential future HTML display):

- **Regex Definitions**:
  - `_SCRIPT_BLOCK_RE = re.compile(r"<script\b[^>]*>.*?</script\s*>", re.IGNORECASE | re.DOTALL)`
  - `_STYLE_BLOCK_RE = re.compile(r"<style\b[^>]*>.*?</style\s*>", re.IGNORECASE | re.DOTALL)`
  - `_TAG_RE = re.compile(r"<[^>]*>")`
  - `_WHITESPACE_RE = re.compile(r"\s+")`
- **Sanitization Pipeline**:
  1. Checks if the input is a string; if not, returns it unchanged.
  2. Replaces `<script>...</script>` and `<style>...</style>` blocks (and all nested content) with empty strings.
  3. **Recursive Tag Stripping**: Runs a `while prev != cleaned:` loop that repeatedly replaces matches of `_TAG_RE` with empty strings. This defeats bypass attempts utilizing nested tags like `<<b>>`.
  4. **Entity Decoding**: Calls `html.unescape(cleaned)` to decode HTML entities (e.g. `&lt;script&gt;` back to `<script>`).
  5. **Second recursive tag strip**: Re-runs the `while prev != cleaned:` loop to strip any HTML tags revealed by the entity unescaping process.
  6. **Stray Angle Bracket Removal**: Explicitly removes all remaining `<` and `>` characters (`cleaned.replace("<", "").replace(">", "")`) to prevent malformed tags from surviving.
  7. **Whitespace Collapse**: Collapses multiple whitespace characters to a single space using `_WHITESPACE_RE.sub(" ", cleaned).strip()`.

### 9.4 Request cache — `core/request_cache.py`

`RequestCache` is a thread-safe, TTL + size-bounded in-memory cache mapping `request_id → CitizenProfile`. It bridges the stateless `POST /api/intake` call and the subsequent `GET /api/draft/{scheme_id}` request.

- **Storage**: Uses `collections.OrderedDict` to store `(expires_at, profile)` tuples.
- **Concurrency**: All read/write operations are synchronized using a `threading.Lock` instance.
- **Eviction (`_evict_locked`)**:
  1. Retrieves the current time using `time.monotonic()` (monotonic clock prevents issues from system wall-clock changes).
  2. Iterates and purges all expired keys where `expires_at < now`.
  3. Enforces the size limit (`max_size`, default `1000`) by executing `self._store.popitem(last=False)` (which pops the oldest entry in LRU order) until the size constraint is satisfied.
- **TTL Lifecycle**: Defaults to 30 minutes (`1800` seconds). The cache is purely ephemeral and does not persist across application restarts or scale across multiple servers.

### 9.5 Logging — `core/logging_config.py`

- `configure_logging(settings)` — idempotent structlog setup. JSON renderer in production (`LOG_JSON=true`), pretty console renderer otherwise. Merges contextvars (so `request_id` rides along), adds level + ISO timestamp.
- **Logging policy (security):** log request *outcomes* and coarse counters with the `request_id` — **never** the citizen's full profile in plaintext.
- Sentry is initialized only if `SENTRY_DSN` is set, with `send_default_pii=False`. `capture_exception()` is a safe no-op when Sentry is absent.

---

## 10. The LLM layer (Gemini)

**File:** `llm/gemini_client.py` — `GeminiClient`.

A thin async wrapper around `google-genai`, used for **language generation only**.

- **Client Construction**: Initialized during startup. It instantiates the underlying client only if `settings.llm_active` (both `LLM_ENABLED` is true and `GEMINI_API_KEY` is present) evaluates to `True`.
- **Initialization Safety**: Instantiation runs inside `_try_init_client()`, which imports `from google import genai` and builds `genai.Client(api_key=self._settings.gemini_api_key)`. Any exception (such as missing package or invalid format key) is caught, logged as a warning (`"gemini_init_failed"`), and `self._client` remains `None`.
- **Liveness property**: `available` checks if `self._client` is not `None`.
- **Thread offloading (`_generate_once`)**: The SDK's generation call is blocking. To prevent blocking the async event loop, the call is wrapped in a helper function `_call()` returning `client.models.generate_content(model=model, contents=prompt).text.strip()`, and executed in a separate worker thread using `asyncio.to_thread(_call)`.
- **Timeout and Exception Safety**: The thread execution is wrapped in `asyncio.wait_for(..., timeout=settings.gemini_timeout_seconds)`.
  - On `asyncio.TimeoutError`: logs warning `"gemini_timeout"` indicating which model timed out, and returns `None`.
  - On any other `Exception` (such as API credentials error, quota issues, or network issues): logs warning `"gemini_error"` with the error traceback message, and returns `None`.
- **Sequential Fallback (`polish`)**: Tries the primary model (`settings.gemini_model`), and if it returns `None`, tries the secondary fallback model (`settings.gemini_fallback_model`). If both fail, it returns the provided deterministic `fallback` text and sets `used_llm=False`.

Default models: `gemini-2.0-flash` (primary), `gemini-1.5-flash` (fallback).

---

## 11. Configuration & environment

**File:** `config.py` — a `pydantic-settings` `Settings` class, the single source
of truth. Loaded from environment variables (and a local `.env` in development).
**No secret is ever hardcoded** — only variable names and safe non-secret defaults.

| Env var | Default | Purpose |
|---------|---------|---------|
| `ENVIRONMENT` | `development` | `development` / `production` |
| `DEBUG` | `false` | debug flag |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | CORS allowlist (comma-separated, never `*`) |
| `RATE_LIMIT` | `20/minute` | per-IP rate limit |
| `REDIS_URL` | *(unset)* | if set, use Redis for rate-limit storage |
| `GEMINI_API_KEY` | *(unset)* | enables LLM polish when present |
| `GEMINI_MODEL` | `gemini-2.0-flash` | primary LLM model |
| `GEMINI_FALLBACK_MODEL` | `gemini-1.5-flash` | fallback LLM model |
| `GEMINI_TIMEOUT_SECONDS` | `8` | per-call LLM timeout |
| `LLM_ENABLED` | `true` | master LLM switch |
| `SENTRY_DSN` | *(unset)* | enables Sentry when present |
| `LOG_LEVEL` | `INFO` | log level |
| `LOG_JSON` | `true` | JSON vs console logs |
| `REQUEST_CACHE_TTL_SECONDS` | `1800` | profile cache TTL |
| `REQUEST_CACHE_MAX_SIZE` | `1000` | profile cache capacity |
| `SUPABASE_URL` | *(unset)* | Supabase project API URL |
| `SUPABASE_SERVICE_KEY` | *(unset)* | Supabase Service Role secret key for admin bypass |
| `SUPABASE_JWT_SECRET` | *(unset)* | Secret key used to decode client JWT access tokens |
| `INTERNAL_API_SECRET` | *(unset)* | Secret string validating incoming Supabase Edge callbacks |

Helper properties: `cors_origins` (parsed list), `is_production`, and `llm_active`
(true only when `llm_enabled` **and** a key is present). A validator **rejects a
literal `"*"`** in `ALLOWED_ORIGINS` at load time.

See `.env.example` for the full annotated template (names only, no values).

---

## 12. Security model

The backend is designed for a system handling sensitive citizen data:

1. **Strict input validation** — every field is typed, bounded, and enum-checked; `extra="forbid"` rejects unknown fields; numeric fields reject string coercion.
2. **CORS allowlist, never `*`** — enforced by both config default and a validator.
3. **Per-IP rate limiting** (slowapi) — in-memory or Redis-backed.
4. **No secrets in code** — everything sensitive comes from the environment.
5. **Defensive sanitization** of free text — strips HTML/script from name/state/district before it touches logs, drafts, or a UI.
6. **PII-safe logging** — the full profile is never logged; only `request_id` and coarse counters are. Sentry runs with `send_default_pii=False`.
7. **Standard error shape everywhere** — no raw tracebacks leak to clients. All failures return the standard payload `{processing_status: "error", error_message: str, error_code: str}` with corresponding HTTP status codes:
   - **`422 Unprocessable Entity`** (invalid request parameters or missing fields):
     ```json
     {
       "processing_status": "error",
       "error_message": "Invalid input. Please check the submitted fields.",
       "error_code": "INVALID_INPUT"
     }
     ```
   - **`429 Too Many Requests`** (IP rate limit exceeded):
     ```json
     {
       "processing_status": "error",
       "error_message": "Rate limit exceeded. Please try again shortly.",
       "error_code": "AGENT_TIMEOUT"
     }
     ```
   - **`404 Not Found`** (unknown `scheme_id` in `/api/draft/{scheme_id}`):
     ```json
     {
       "processing_status": "error",
       "error_message": "Unknown scheme_id: {scheme_id}",
       "error_code": "INVALID_INPUT"
     }
     ```
   - **`404 Not Found`** (unknown or expired `request_id` in request cache lookup):
     ```json
     {
       "processing_status": "error",
       "error_message": "Unknown or expired request_id. Please submit the intake form again.",
       "error_code": "INVALID_INPUT"
     }
     ```
   - **`500 Internal Server Error`** (unhandled generic exception, logged server-side via structlog/Sentry):
     ```json
     {
       "processing_status": "error",
       "error_message": "An internal error occurred. Please try again later.",
       "error_code": "INTERNAL_ERROR"
     }
     ```
8. **Non-root container** — the Docker image runs as an unprivileged `app` user.
9. **JWT Verification for User PII**: All Document Vault management endpoints enforce client JWT validation using Supabase authorization headers, ensuring users can only manage their own documents.
10. **Role-Based Access Control (RBAC)**: Administrative endpoints check client JWT claims for the `"admin"` role and reject unauthorized writes with `403 Forbidden`.
11. **Internal Webhook Signature Protection**: Deno Edge callbacks checking profile/scheme updates require a matching secret passed via the `X-Internal-Secret` custom header.

---

## 13. API endpoints reference

### `POST /api/intake`

Submit a citizen profile; get ranked eligible schemes.

**Request body:** `CitizenProfile` (see [§7.2](#72-request-models--modelsrequest_modelspy)).

**Response `200`:** `IntakeResponse`
```json
{
  "request_id": "3f2c…",
  "eligible_schemes": [
    {
      "scheme_id": "pm-kisan-001",
      "scheme_name": "PM-KISAN Samman Nidhi",
      "scheme_category": "agriculture",
      "benefit_summary": "…",
      "benefit_value_estimate": "₹6,000/year",
      "eligibility_match_score": 1.0,
      "priority_rank": 1,
      "missing_documents": ["income_certificate"],
      "application_url": "https://pmkisan.gov.in/",
      "drafted_application_text": null
    }
  ],
  "total_eligible_count": 1,
  "processing_status": "success",
  "error_message": null
}
```
**Response `500`** (if pipeline processing fails):
```json
{
  "processing_status": "error",
  "error_message": "An internal error occurred while processing the request.",
  "error_code": "INTERNAL_ERROR"
}
```

### `GET /api/draft/{scheme_id}?request_id=…`

Generate a pre-filled application for one scheme, using the profile cached from the earlier intake call.

**Response `200`:** `DraftResponse`
```json
{
  "scheme_id": "pm-kisan-001",
  "drafted_application_text": "To: Department of Agriculture...\n...",
  "required_documents": ["aadhaar", "income_certificate"],
  "next_steps": [
    "Visit the nearest Common Service Centre (CSC) or the official portal.",
    "Submit the application for PM-KISAN Samman Nidhi with the attached documents.",
    "Note your application reference number for tracking."
  ]
}
```
**Response `500`** (if drafting letter fails):
```json
{
  "processing_status": "error",
  "error_message": "An internal error occurred while drafting the application.",
  "error_code": "INTERNAL_ERROR"
}
```

### `GET /api/health`

**Response `200`:** `{"status": "ok", "agents_online": ["intake","eligibility","ranking","docgap","drafter"]}`.

### `POST /api/internal/match-profile`
Internal asynchronous callback route triggered by Supabase Edge Functions when a user inserts or activates a profile.
*   **Security:** Requires header `X-Internal-Secret: <secret>`.
*   **Response `200`:** `{"status": "success", "results_count": int}`
*   **Response `401`:** Unauthorized on invalid/missing secret.

### `POST /api/internal/match-scheme`
Internal asynchronous callback route triggered by Supabase Edge Functions when a scheme's rules are updated. Takes pre-filtered candidate user IDs and recomputes matching results.
*   **Security:** Requires header `X-Internal-Secret: <secret>`.
*   **Response `200`:** `{"status": "success", "processed_users": int}`
*   **Response `401`:** Unauthorized on invalid/missing secret.

### `GET /api/schemes/search?query=…`
Public search route to retrieve schemes using PostgreSQL Full-Text Search.
*   **Response `200`:** List of matching schemes.

### `POST /api/documents/upload`
Upload a document (PDF/Image) to the user's private storage folder in Supabase (`citizen-documents` bucket). Extracts document metadata via OCRSpace (using the real external API in dev/prod, mocked as a test double in the pytest suite) and inserts a **pending** status record in the database.
*   **Security:** Requires Bearer JWT header.
*   **Response `200`:** Document verification details, pending OCR extraction results, and a short-lived **signed storage URL** (300s TTL).

### `POST /api/documents/{doc_id}/confirm`
Confirm or modify OCR data extraction. Upon confirmation, the document's verification status transitions to **verified**, and corresponding citizen profile attributes are dynamically updated in the database.
*   **Security:** Requires Bearer JWT header.
*   **Response `200`:** `{"status": "success", "message": "Document confirmed and profile updated."}`

### `GET /api/documents`
List all documents uploaded by the authenticated user. Includes short-lived signed storage URLs (300s TTL) for active documents.
*   **Security:** Requires Bearer JWT header.
*   **Response `200`:** List of user's active documents with status.

### `POST /api/admin/schemes`
Create a new welfare scheme.
*   **Security:** Requires Bearer JWT header representing an administrator account. The check decodes the JWT and validates the `is_admin` claims inside `app_metadata` or `user_metadata`, falling back safely to checking if the authenticated email is exactly `admin@doclens.in`.
*   **Response `200`:** Created scheme details.

---

## 14. Testing

**Config:** `pytest.ini` (asyncio auto mode; tests under `tests/`).
**Fixtures:** `tests/conftest.py` provides `VALID_PROFILE_DICT`, a complete contract-valid body that tests copy and mutate.

The suite contains **119 unit and integration tests** (spanning **1,200+ lines of code**) and covers each agent in isolation, Supabase security integrations, and end-to-end API flows:

| Test file | Focus |
|-----------|-------|
| `test_intake_agent.py` | normalization, sanitization, empty-after-sanitize guard |
| `test_eligibility_agent.py` | every rule check, boundary scoring, no-restriction semantics (largest file) |
| `test_ranking_agent.py` | value tiering, combined score, deterministic tie-breaks |
| `test_docgap_agent.py` | missing-document sets, canonical ordering |
| `test_drafter_agent.py` | template contents, LLM polish + fallback |
| `test_pipeline.py` | full orchestration, partial-success on LLM degradation |
| `test_api_integration.py` | HTTP-level: validation `422`s, endpoints, error shapes |
| `test_supabase_auth_and_documents.py` | JWT decoding validation, administrator role checks, Document Vault OCRSpace flow, and webhook secret validations |

**Run the tests** (from the repo root so `Backend.<module>` imports resolve):

```bash
cd D:/DocLens
# Run with virtual environment python executable
Backend/.venv/Scripts/python -m pytest Backend/tests -v
```

---

## 15. Running & deploying

### Local development

```bash
cd D:/DocLens/Backend
python -m venv .venv && source .venv/Scripts/activate   # Windows Git Bash
pip install -r requirements.txt
cp .env.example .env            # then fill in optional values

# Run from the repo root so the Backend package imports resolve:
cd ..
uvicorn Backend.main:app --reload --port 8000
```

Open <http://localhost:8000/docs> for the auto-generated OpenAPI UI.

> The LLM is **optional** — the API is fully functional without a `GEMINI_API_KEY`;
> it just returns deterministic (unpolished) text and never marks `partial_success`
> for LLM reasons.

### Docker

The `Dockerfile` is a multi-stage build (wheels built in stage 1, installed
offline in stage 2), runs as a **non-root** user, exposes `8000`, respects an
injected `$PORT`, and ships a stdlib-based `HEALTHCHECK` hitting `/api/health`.

```bash
docker build -t doclens-backend Backend/
docker run -p 8000:8000 --env-file Backend/.env doclens-backend
```

### Render

The repo root `render.yaml` blueprint deploys this backend as a web service
(platform injects `$PORT`; the container CMD binds `uvicorn Backend.main:app` to it).

---

### Quick mental model

> **Deterministic core, cosmetic AI, frozen contract, fail-safe everywhere.**
> The rule engine decides eligibility and is fully auditable; Gemini only makes the
> words nicer and can vanish without breaking anything; the API shape never drifts;
> and every failure returns a clean, PII-safe error instead of a traceback.

---

## 16. Supabase & Database Architecture

We migrate from a stateless in-memory cache architecture to a stateful database structure utilizing **Supabase (PostgreSQL)**, guarded by Row-Level Security (RLS) and integrated with Deno Edge Functions.

### 16.1 Database Schema
The database layout is defined in [20260709000000_schema_setup.sql](file:///d:/DocLens/supabase/migrations/20260709000000_schema_setup.sql):
*   **`citizen_profiles`**: Holds individual demographic data. Enforces `is_current` boolean configuration (only 1 profile per user can be active at a time via a partial unique index). Secured via RLS ensuring users can only select or modify their own profiles.
*   **`schemes`**: Holds welfare scheme specifications. Features a composite Full-Text Search (FTS) index combining `scheme_name` and `benefit_summary` for fast searching, exposed via `search_schemes` RPC.
*   **`documents`**: Tracks user uploaded files. Integrates with the `document-vault` storage bucket. Features a foreign key check to `doc_type` lookup table.
*   **`applications`**: Tracks user applied schemes. Enforces a unique constraint on `(user_id, scheme_id)` to prevent duplicate submissions.
*   **`notifications`**: Stores generated alerts for matched schemes. Enforces unique notification constraints via a multi-column index on `(user_id, scheme_id, notification_type)` to avoid spamming the user dashboard.

### 16.2 Edge Function Workflows
*   **`on-profile-change`**: Whenever a `citizen_profiles` row is created or activated (`is_current = true`), this Edge Function triggers FastAPI `/api/internal/match-profile` to recalculate matching results.
*   **`on-scheme-change`**: When a scheme's eligibility rules are updated, this Edge Function performs an in-database candidate search (pre-filtering by matching states, income caps, and allowed occupations) and forwards the narrow subset to FastAPI `/api/internal/match-scheme` to recompute eligibility scores.
