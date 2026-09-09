# Contributing to DocLens

Thanks for considering a contribution. This document covers how to open a PR that gets reviewed and merged smoothly, whether you are on the core team or contributing for the first time.

---

## 1. Project Structure

```text
DocLens/
|-- Backend/        FastAPI backend: agents, models, API, tests
|-- frontend/       Next.js frontend: auth, dashboard, chat, document vault
|-- supabase/       Database migrations and Deno Edge Functions
|-- .github/        CI workflows and issue templates
|-- LICENSE         MIT
|-- README.md
|-- RELEASES.md     Version history
`-- render.yaml     Backend deployment blueprint
```

Full architecture and agent design context: see the [DocLens Wiki](https://github.com/DocLens/DocLens/wiki).

---

## 2. Core Ownership

| Area | Primary Maintainer |
|---|---|
| Backend: agents, API, orchestration, deployment, CI/CD | [@PREMRAJESH](https://github.com/PREMRAJESH) |
| Frontend: UI, auth, dashboard, chat, document vault | [@Dvij-Joshi](https://github.com/Dvij-Joshi) |

Ownership marks who reviews and merges PRs in that area. It does not restrict who can contribute there. Cross-area PRs are welcome; tag the relevant maintainer for review.

---

## 3. Branch Strategy

- `main`: stable and deployable.
- Feature branches: `<type>/<short-description>`
- Examples: `feat/document-agent-ocr`, `fix/dashboard-null-schemes`, `docs/api-architecture`

Flow: branch from `main`, commit, open a PR into `main`, pass CI, get review, then merge.

---

## 4. Commit Convention

This repo follows [Conventional Commits](https://www.conventionalcommits.org/). Keep matching this style:

```text
<type>(<scope>): <short description>
```

Common types: `feat`, `fix`, `docs`, `test`, `build`, `chore`, `refactor`, `ci`.

Real examples from this repo:

```text
feat(backend): add deterministic eligibility agent pipeline
fix(dashboard): wire real IntakeResponse data into cards
test(backend): add Supabase and OCR service test coverage
build(backend): add multi-stage Docker image
ci: add backend test and dependency-audit workflow
docs: update backend and frontend developer architecture guides
```

Keep the first line under about 72 characters. Add detail in the commit body when the summary line needs more context.

---

## 5. Pull Request Rules

- One PR should contain one logical change.
- The PR description should state what changed, why it changed, and how it was tested.
- Link the related issue if one exists, for example `Closes #12`.
- CI must pass before merge. The repo runs tests and dependency audit checks in GitHub Actions.
- At least one review is expected before merging into `main`.
- AI-assisted commits are allowed, but the human contributor is responsible for understanding and reviewing every line before proposing it.

---

## 6. API Contract Changes

The backend Pydantic models in `Backend/models/` and the frontend TypeScript types in `frontend/app/lib/` are the source of truth for request and response shapes. If your change touches a field name, type, enum value, or endpoint shape:

1. Update backend and frontend types in the same PR.
2. Update the relevant docs in `Backend/BACKEND.md`, `frontend/FRONTEND.md`, or the [Wiki](https://github.com/DocLens/DocLens/wiki).
3. Flag the contract change clearly in the PR description.
4. Add or update tests that prove both sides still agree.

---

## 7. Environment Setup

Full walkthrough with troubleshooting: [Wiki: Getting Started](https://github.com/DocLens/DocLens/wiki/Getting-Started).

```bash
git clone https://github.com/DocLens/DocLens.git
cd DocLens

# Backend
cd Backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn Backend.main:app --reload --port 8000

# Frontend, in a separate terminal
cd frontend
npm install
npm run dev
```

Backend `.env` values used for full functionality:

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project API URL |
| `SUPABASE_SERVICE_KEY` | Service role key for admin-level DB access; keep secret |
| `SUPABASE_JWT_SECRET` | Decodes client JWTs on protected routes |
| `INTERNAL_API_SECRET` | Validates incoming Supabase Edge Function callbacks |
| `GEMINI_API_KEY` | Optional LLM polish; the app degrades gracefully without it |
| `ALLOWED_ORIGINS` | CORS allowlist, comma-separated, never `*` |

Frontend environment values:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend URL, for example `http://localhost:8000` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key |

Ask a maintainer for a shared dev Supabase project if you do not have your own. Auth, dashboard, document vault, and scheme search all depend on Supabase configuration.

---

## 8. Database Migrations and Edge Functions

Schema lives in `supabase/migrations/` as versioned SQL files. If your change touches the database:

1. Add a new timestamped migration file. Do not edit a migration that is already merged to `main`.
2. Update Row-Level Security policies in the same migration when data access changes.
3. Check whether `supabase/functions/on-profile-change` or `supabase/functions/on-scheme-change` also need updates.
4. Test locally against Supabase before opening the PR.

---

## 9. Testing Requirements

- Backend agent changes require matching tests in `Backend/tests/`.
- New eligibility rules or scheme data should include a focused test case.
- Auth, document upload/OCR, or admin-route changes should update `Backend/tests/test_supabase_auth_and_documents.py`.
- Frontend changes should be verified against a running backend or documented mock data before opening a PR.

Useful commands:

```bash
python -m pytest Backend -q

cd frontend
npm run lint
npm run build
```

---

## 10. Where to Start

- Check issues labeled [`good first issue`](https://github.com/DocLens/DocLens/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22).
- For eligibility-engine work, read [Wiki: Agent Design](https://github.com/DocLens/DocLens/wiki/Agent-Design) first.
- For larger changes, open a [Discussion](https://github.com/DocLens/DocLens/discussions) before writing code.

---

## 11. Conduct and Security

Be respectful, constructive, and assume good faith.

If you find a vulnerability, do not open a public issue. Use GitHub's private vulnerability reporting flow or contact a maintainer directly. This project handles sensitive citizen data, so security reports are taken seriously.
