# DocLens Release Notes

Professional, GitHub-ready release copy for the current pre-1.0 product history.

## Versioning Strategy

DocLens is now versioned as a pre-1.0 product while the platform is still moving quickly. Minor versions (`v0.x.0`) mark meaningful product milestones, and patch versions (`v0.x.y`) mark stability, dependency, CI, or polish releases.

The accidental `v1.0.0` release should not be used. The project is better represented as an actively developing beta platform with strong foundations and fast iteration.

---

## v0.4.2 — Open-Source Governance and Community Readiness

**Release date:** 2026-07-09  
**Type:** Patch release  
**Target commit:** `b287a80`

### Description

This release establishes the open-source governance foundation for DocLens. It adds a security policy, code of conduct, contribution guide, professional issue templates, release notes, and corrected pre-1.0 version tags — everything an external contributor or potential partner needs to evaluate and participate in the project.

### Highlights

- Added `SECURITY.md` with responsible vulnerability disclosure policy, security scope, and data handling principles.
- Added `CODE_OF_CONDUCT.md` adapted for public-interest, citizen-data context with clear enforcement and reporting guidance.
- Added `CONTRIBUTING.md` with development setup, branching strategy, commit conventions, code standards, and PR workflow.
- Replaced placeholder issue templates with 8 professional, structured templates:
  - Bug Report, Feature Request, Agent Behavior Report, API Contract Change, Integration Blocker, Task Handoff, Documentation Request, Security Hardening.
- Added `config.yml` to disable blank issues and route vulnerability reports to private disclosure.
- Linked README navigation to the project wiki and contribution guide.
- Added `RELEASES.md` with professional pre-1.0 versioned release notes.
- Cleaned stale `SRS.md` and `API_CONTRACT.md` references from codebase.
- Removed mistaken `v1.0.0` tag and created corrected `v0.x` annotated tag series.

### Why It Matters

Open-source credibility requires more than code. This release signals that DocLens takes security, community standards, and contributor experience seriously — making the project ready for external contributors, hackathon judges, and potential institutional partners.

---

## v0.4.1 — Stability, Render Hygiene, and Dependency Audit Hardening

**Release date:** 2026-07-09  
**Type:** Patch release  
**Target commit:** `b41a303`

### Description

This release hardens the current DocLens beta by improving frontend runtime stability, reducing startup overhead, fixing render lifecycle issues, and making dependency audits reproducible. It is focused on reliability rather than new user-facing scope.

### Highlights

- Stabilized frontend development memory usage by tuning the Next.js dev workflow.
- Slimmed frontend startup assets and reduced unnecessary loading overhead.
- Hardened client-side interaction lifecycles across chat and document flows.
- Cleaned up render hygiene issues in dashboard, scheme detail, schemes, and settings screens.
- Extracted reusable settings toggle UI for easier maintenance.
- Pinned Supabase backend dependency for reproducible security audits.
- Updated vulnerable Python dependencies so CI dependency-audit checks can pass consistently.

### Why It Matters

This release makes the product easier to develop, test, and ship repeatedly. It reduces the chance of local development failures, UI rendering regressions, and audit drift during active beta iteration.

---

## v0.4.0 - Supabase Platform, Document Vault, and OCR Workflow

**Release date:** 2026-07-09  
**Type:** Minor release  
**Target commit:** `cffcd91`

### Description

This release moves DocLens from a primarily stateless eligibility engine into a stateful citizen platform. It introduces Supabase-backed data models, secure JWT-authenticated backend routes, document upload and OCR verification workflows, and Edge Function triggers for asynchronous eligibility rematching.

### Highlights

- Added Supabase PostgreSQL migrations for citizen profiles, schemes, documents, applications, and notifications.
- Introduced Row-Level Security-ready database architecture for owner-scoped citizen data.
- Added JWT authentication middleware and Supabase client infrastructure to the backend.
- Added internal webhook security for Supabase Edge Function callbacks.
- Added Edge Functions for profile-change and scheme-change rematching workflows.
- Added a document agent with OCR-assisted verification and secure upload endpoints.
- Added authenticated document, admin, and webhook test coverage with mocked Supabase/OCR services.
- Expanded backend and frontend architecture documentation for maintainability.

### Why It Matters

DocLens now has the foundations of a real multi-user welfare discovery platform: persistent profiles, secure document workflows, notifications, application tracking, and backend hooks that can react as citizens or schemes change.

---

## v0.3.0 - Authenticated Citizen Experience and Product Polish

**Release date:** 2026-07-08  
**Type:** Minor release  
**Target commit:** `6e866d4`

### Description

This release turns the web app into an authenticated product experience. It adds Supabase authentication, persisted citizen profile creation, improved signup resilience, branded navigation, and a redesigned public schemes experience.

### Highlights

- Integrated Supabase authentication into login and registration.
- Persisted citizen profiles and eligibility history through Supabase-backed flows.
- Improved signup reliability with explicit session establishment and profile upsert behavior.
- Added clearer user-facing error messages for auth and Supabase environment issues.
- Added auth-aware landing page calls to action that route signed-in users to the dashboard.
- Replaced placeholder branding with the real DocLens logo across navbar, landing page, footer, and favicon.
- Redesigned the schemes page with hero search, category pills, improved cards, and richer visual treatment.
- Fixed broken navigation/footer links and image rendering issues.
- Tuned Next.js development configuration to reduce Windows memory pressure.

### Why It Matters

This release shifts DocLens from a prototype interface into a credible early product: users can sign up, maintain a session, submit profile data, and move through a more polished welfare discovery journey.

---

## v0.2.0 - Citizen Web App MVP and Live API Wiring

**Release date:** 2026-07-07  
**Type:** Minor release  
**Target commit:** `b2ef634`

### Description

This release adds the first complete citizen-facing web application experience and wires the frontend to the backend API contract. It includes onboarding, dashboard, document checklist, scheme detail, profile, settings, chat, and shared navigation surfaces.

### Highlights

- Added login and multi-step registration screens.
- Added dashboard view with eligibility overview, scheme cards, match scores, and missing documents.
- Added AI-style chat interface for scheme Q&A exploration.
- Added document vault UI with drag-and-drop upload interaction.
- Added profile and settings pages for account-style product depth.
- Added responsive navbar and footer components.
- Added typed API client functions for `/api/intake`, `/api/draft`, and `/api/health`.
- Added frontend TypeScript types and enum constants aligned to the backend contract.
- Wired registration, dashboard, scheme details, and documents pages to real `IntakeResponse` data.
- Improved SEO metadata, viewport configuration, and layout consistency.

### Why It Matters

This release gives the project its first full product loop: a citizen can enter their information, receive ranked scheme matches, inspect missing documents, and generate an application draft through a real frontend/backend contract.

---

## v0.1.0 - Deterministic Eligibility Engine MVP

**Release date:** 2026-07-07  
**Type:** Initial product release  
**Target commit:** `e1bf6ea`

### Description

This release establishes the foundation of DocLens: a deterministic welfare eligibility engine for Indian government schemes, backed by a FastAPI service, typed data models, a curated scheme dataset, tests, Docker packaging, CI, and production-grade project documentation.

### Highlights

- Added backend domain models, enums, request/response schemas, and scheme models.
- Added curated government welfare scheme dataset.
- Added deterministic agent pipeline for intake normalization, eligibility matching, ranking, document gap analysis, and draft generation.
- Added Gemini integration for optional language polish with graceful deterministic fallback.
- Added FastAPI application, typed settings, rate limiting, CORS controls, structured logging, request cache, and sanitization utilities.
- Added unit and integration test suite for backend agents and API behavior.
- Added pinned backend dependencies and environment template.
- Added multi-stage Docker image and Render deployment blueprint.
- Added GitHub Actions CI for backend tests and dependency audit.
- Added production-grade README and MIT license.

### Why It Matters

This release locks in the most important product principle: eligibility is decided by deterministic, auditable rules, not by an LLM. The project starts with a trustworthy backend core that can be tested, deployed, and extended.

