# ⚙️ Setup Guide

> Local development environment in 10 minutes

---

## 📋 Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | ≥ 3.12 | Backend runtime |
| Node.js | ≥ 22 | Frontend runtime |
| Docker | Latest | Containerized backend (optional) |
| Supabase CLI | Latest | Local Supabase (optional) |

Accounts needed: **Supabase** (free tier) and **Groq** API key (free, optional for LLM).

---

## 🪜 Step-by-Step

### 1. Clone

```bash
git clone https://github.com/DocLens/DocLens.git
cd DocLens
```

### 2. Backend

```bash
cd Backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env` with:

| Variable | Required | Source |
|----------|----------|--------|
| `SUPABASE_URL` | ✅ | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Same page |
| `SUPABASE_JWT_SECRET` | ✅ | Settings → API → JWT Settings |
| `INTERNAL_API_SECRET` | ✅ | Generate any random string |
| `ALLOWED_ORIGINS` | ✅ | `http://localhost:3000` |
| `GROQ_API_KEY` | Optional | console.groq.com |

### 3. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 4. Database

Apply migrations via Supabase SQL Editor in order:

| # | Migration | Contents |
|---|-----------|----------|
| 1 | `00000000_schema.sql` | Tables, indexes, constraints |
| 2 | `00000001_rls.sql` | RLS policies |
| 3 | `00000002_functions.sql` | Functions and triggers |
| 4 | `00000003_seed_data.sql` | Seed data |

Or via CLI: `supabase db push`

### 5. Edge Functions

```bash
supabase functions deploy on-profile-change
supabase functions deploy on-scheme-change

supabase secrets set INTERNAL_API_SECRET=<secret>
supabase secrets set FASTAPI_BACKEND_URL=<render-url>
supabase secrets set SUPABASE_URL=<project-url>
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<key>
```

Create webhooks in Dashboard → Database → Webhooks:

| Webhook | Table | Events | Function |
|---------|-------|--------|----------|
| Profile Change | `citizen_profiles` | INSERT, UPDATE | `on-profile-change` |
| Scheme Change | `schemes` | INSERT, UPDATE | `on-scheme-change` |

### 6. Run

**Terminal 1 (Backend):**
```bash
cd Backend
uvicorn main:app --reload --port 8000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

---

## ✅ Verify

| URL | Expected |
|-----|----------|
| `http://localhost:8000/api/health` | `{"status":"ok","service":"doclens-api"}` |
| `http://localhost:3000` | Landing page |
| `http://localhost:8000/docs` | Swagger UI |

---

## 🐳 Docker

```bash
cd Backend
docker build -t doclens-api .
docker run -p 8000:8000 --env-file .env doclens-api
```

---

## 🔧 Troubleshooting

> **⚠️ CORS errors?** Ensure `ALLOWED_ORIGINS` includes `http://localhost:3000`.

> **⚠️ JWT fails?** Verify `SUPABASE_JWT_SECRET` matches Supabase Dashboard.

> **⚠️ Rate limited in dev?** Set `RATE_LIMIT=100/minute` in `.env`.

> **⚠️ Still stuck?** Open an [issue](https://github.com/DocLens/DocLens/issues).

---

## 📄 Related

- [Architecture →](Architecture)
- [API Reference →](API-Reference)
- [Deployment →](Deployment)
