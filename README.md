<div align="center">

<img src="assets/header-banner.svg" alt="DocLens — AI-Powered Welfare Discovery Platform" width="100%" />

<br/>

An intelligent, multi-agent welfare eligibility platform that turns a single citizen profile into an auditable, ranked catalog of eligible central and state government schemes — complete with document gap detection, automated OCR extraction, and instant application drafting.

[![Open Source](https://img.shields.io/badge/Open%20Source-100%25-FF5733?style=for-the-badge&logo=github&logoColor=white)](https://github.com/DocLens/DocLens)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-22C55E?style=for-the-badge&logo=github&logoColor=white)](CONTRIBUTING.md)
[![Production Live](https://img.shields.io/badge/Production-Live-00E599?style=for-the-badge&logo=vercel&logoColor=black)](https://doclens-seven.vercel.app)
[![API Status](https://img.shields.io/badge/API-Online-009688?style=for-the-badge&logo=render&logoColor=white)](https://doclens-backend.onrender.com/api/health)
[![Backend CI](https://img.shields.io/github/actions/workflow/status/DocLens/DocLens/backend-ci.yml?branch=main&style=for-the-badge&logo=github&label=CI)](https://github.com/DocLens/DocLens/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-F59E0B?style=for-the-badge)](LICENSE)

<br/>

[![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.2-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Groq Llama-3.3](https://img.shields.io/badge/Groq-Llama--3.3--70B-F05138?style=for-the-badge&logo=groq&logoColor=white)](https://groq.com/)
[![Pytest 100%](https://img.shields.io/badge/Tests-121%20Passed-22C55E?style=for-the-badge&logo=pytest&logoColor=white)](Backend/tests)

<br/>

[**Live Demo**](https://doclens-seven.vercel.app) · [**Explore Architecture**](#-system-architecture) · [**Quickstart**](#-quickstart) · [**API Reference**](#-api-reference) · [**Security**](#-security--privacy-first-engineering)

</div>

<img src="assets/divider.svg" alt="" width="100%" />

## 🎯 Executive Summary & Mission

India administers over **3,000+ central and state welfare schemes** representing billions of dollars in annual budget allocations for agriculture, education, healthcare, housing, pensions, and social welfare. Despite guaranteed funding, **over ₹1,00,000+ Crore in benefits remain unclaimed every year** due to fragmentation, complex legalese, missing documentation, and discovery barriers.

**DocLens solves this at scale.** 

By uniting a **100% deterministic Python eligibility rule engine** with a **zero-latency Groq AI assistant**, DocLens allows citizens to input their profile once and immediately receive:
- **Instant Eligibility Matching**: Exact percentage match score computed against 1,000+ scheme rule definitions.
- **Missing Document Gap Analysis**: Precise identification of missing credentials needed for 100% approval readiness.
- **Automated Document OCR Vault**: Instant parameter extraction from Aadhaar, Income Certificates, and Ration Cards.
- **Auto-Generated Application Letters**: One-click custom application letter generation tailored for issuing authorities.

<img src="assets/divider.svg" alt="" width="100%" />

## ✨ Key Platform Features

| Feature | Description | Architecture Highlights |
|---|---|---|
| 🎯 **Auditable Eligibility Engine** | Pure deterministic rule matching engine evaluating demographics, income caps, land holdings, social categories, and state criteria. | **Zero AI Hallucination**: LLMs never make legal eligibility decisions. |
| 🧠 **AI Srithi Assistant** | High-speed conversational AI assistant powered by Groq Llama-3.3-70B with domain-specific synonym expansion. | Low-latency inference (`temperature=0.2`), zero hesitation, and structured formatting. |
| 📄 **OCR Document Vault** | Multi-document upload area powered by OCRSpace. Extract text, auto-fill profile indicators, and verify status. | Transient signed URLs (300s TTL) with PostgreSQL Row-Level Security (RLS). |
| ✍️ **Instant Application Drafter** | Generates pre-filled, formal application letters for any eligible scheme on demand. | Template fallback mechanism ensures 100% uptime even if AI providers are unreachable. |
| ⚡ **Real-Time Event Sync** | Automated profile and scheme change triggers that re-evaluate matches instantly across all active users. | Supabase Deno Edge Functions broadcasting webhooks to FastAPI match endpoints. |
| 🛡️ **Enterprise Security** | Bank-grade security controls including strict CORS allowlists, per-IP rate limiting, and zero-PII logging. | Sanitized inputs, anti-prompt injection guardrails, and JWT role verification. |

<img src="assets/divider.svg" alt="" width="100%" />

## 🏛️ System Architecture

<img src="assets/system-architecture.svg" alt="System Architecture" width="100%" />

<img src="assets/divider.svg" alt="" width="100%" />

## 🤖 Autonomous Agent Pipeline

Every profile update triggers our multi-agent orchestration pipeline. All financial and eligibility decisions remain **100% deterministic, transparent, and reproducible**:

<img src="assets/agent-pipeline.svg" alt="Agent Pipeline" width="100%" />

<img src="assets/divider.svg" alt="" width="100%" />

## 🧱 Production Tech Stack

### **Backend Services**
* **Language & Framework**: Python 3.12, FastAPI 0.115, Pydantic v2
* **Server**: Uvicorn, Gunicorn
* **Security & Auth**: PyJWT, Supabase Auth Middleware, SlowAPI Rate Limiter
* **AI & LLM**: Groq Async SDK (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`)
* **OCR**: OCRSpace REST API Integration
* **Logging & Observability**: `structlog` (JSON format), Sentry SDK

### **Frontend Client**
* **Framework**: Next.js 16.2 (App Router, React 19.2)
* **Language & Styling**: TypeScript 5, Tailwind CSS 4, Lucide Icons, GSAP Animations
* **State & Data Fetching**: React Hooks, Context API, Supabase JS Client v2

### **Database & Cloud Infrastructure**
* **Database**: Supabase PostgreSQL with Trigram Full-Text Search Indexes
* **Security Policies**: Row-Level Security (RLS) on all user tables
* **Edge Execution**: Deno-based Supabase Edge Functions (`on-profile-change`, `on-scheme-change`)
* **CI/CD & Hosting**: GitHub Actions CI, Vercel (Frontend), Render (Backend API)

<img src="assets/divider.svg" alt="" width="100%" />

## ⚡ Quickstart & Local Setup

### **Prerequisites**
* **Python 3.12+**
* **Node.js 20+**
* **Git**

### **1. Clone the Repository**
```bash
git clone https://github.com/DocLens/DocLens.git
cd DocLens
```

### **2. Setup & Launch Backend**
```bash
# Navigate to Backend
cd Backend

# Create & activate virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Environment Setup
cp .env.example .env
# Fill in your Supabase credentials in .env

# Run API from repository root
cd ..
py -m uvicorn Backend.main:app --reload --port 8000
```
Backend will be live at `http://localhost:8000`. Interactive OpenAPI documentation is available at `http://localhost:8000/docs`.

### **3. Setup & Launch Frontend**
```bash
# Open a new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# Environment Setup
cp .env.example .env.local
# Fill in NEXT_PUBLIC_API_URL=http://localhost:8000 and Supabase credentials

# Start development server
npm run dev
```
Frontend will be live at `http://localhost:3000`.

### **4. Execute Backend Test Suite**
```bash
# Run pytest across all 121 unit & integration tests
py -m pytest -o asyncio_mode=auto
```

<img src="assets/divider.svg" alt="" width="100%" />

## 📡 API Reference Overview

Base URL: `https://doclens-backend.onrender.com/api`

### **Authentication & Profile Endpoints**

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/intake` | `POST` | Bearer JWT | Submits citizen profile, executes matching pipeline, and returns eligible schemes. |
| `/api/matches/refresh` | `POST` | Bearer JWT | Re-evaluates matches for logged-in user profile against the live catalog. |
| `/api/matches` | `GET` | Bearer JWT | Fetches saved eligibility matches for the current user. |
| `/api/user` | `DELETE` | Bearer JWT | Cascadingly deletes user matches, documents, applications, and auth account. |

### **Document Vault & OCR Endpoints**

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/documents/upload` | `POST` | Bearer JWT | Uploads document to private bucket and executes OCR text extraction. |
| `/api/documents/{doc_id}/confirm` | `POST` | Bearer JWT | Confirms OCR parameters and updates profile indicators in database. |
| `/api/documents` | `GET` | Bearer JWT | Returns list of uploaded documents with temporary signed URLs (300s TTL). |

### **Assistant & Draft Endpoints**

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/chat` | `POST` | Public | High-speed AI Srithi conversational assistant endpoint. |
| `/api/draft/{scheme_id}` | `GET` | Bearer JWT | Generates pre-filled formal application letter for a specific scheme. |

### **Public & Utility Endpoints**

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/schemes/search` | `GET` | Public | Full-text search across all 1,000+ active welfare schemes. |
| `/api/health` | `GET` | Public | Liveness probe returning operational status and active agent listing. |

<img src="assets/divider.svg" alt="" width="100%" />

## 🔒 Security & Privacy-First Engineering

DocLens is engineered around strict data security and compliance principles:

1. **Zero AI Decisions on Legal Eligibility**: LLMs are restricted strictly to natural language formatting and chat guidance. Eligibility matching is 100% deterministic code.
2. **PostgreSQL Row-Level Security (RLS)**: User demographic records, uploaded document metadata, and match scores are strictly scoped to the authenticated owner's `user_id`.
3. **Zero PII Logging**: Structured JSON logs (`structlog`) strip out names, phone numbers, addresses, and document contents.
4. **Short-Lived Storage Access**: Uploaded credentials in Supabase Storage buckets are private; signed access URLs expire automatically after 300 seconds.
5. **CORS Allowlist Enforcement**: Production API rejects wildcard `*` origins at startup.
<img src="assets/divider.svg" alt="" width="100%" />

## 📄 License & Legal Notice

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

*Disclaimer: DocLens is an independent assistive discovery platform. Eligibility match scores are calculated estimates based on encoded official guidelines. Official decisions rest solely with respective Government issuing authorities.*

<div align="center">

<img src="assets/footer-banner.svg" alt="DocLens Footer" width="100%" />

</div>
