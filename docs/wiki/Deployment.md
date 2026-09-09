# 🚀 Deployment

> End-to-end production setup: Supabase → Render → Vercel

---

## 📐 Infrastructure

```
Internet
  ├── Vercel (Next.js Frontend) — /api/* rewrites → Render
  ├── Render (FastAPI Backend) — Docker, health /api/health
  └── Supabase (PostgreSQL + Edge Functions + Auth)
```

---

## 🪜 Steps

### 1. Supabase — Database

Create project at [supabase.com](https://supabase.com). Note `Project URL`, `Service Role Key`, `JWT Secret` from Settings → API.

Apply migrations via SQL Editor in order:

| # | Migration | Contents |
|---|-----------|----------|
| 1 | `00000000_schema.sql` | Tables, indexes, constraints |
| 2 | `00000001_rls.sql` | RLS policies |
| 3 | `00000002_functions.sql` | Functions and triggers |
| 4 | `00000003_seed_data.sql` | Seed data |

### 2. Supabase — Edge Functions

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

### 3. Render — Backend API

`render.yaml` (auto-detected via Blueprint):

```yaml
services:
  - type: web
    name: doclens-api
    env: docker
    dockerfilePath: Backend/Dockerfile
    healthCheckPath: /api/health
    plan: free
    autoDeploy: true
```

**Required env variables:**

| Variable | Source |
|----------|--------|
| `SUPABASE_URL` | Supabase Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard |
| `SUPABASE_JWT_SECRET` | Supabase Dashboard |
| `INTERNAL_API_SECRET` | Match Edge Functions |
| `ALLOWED_ORIGINS` | `https://your-frontend.vercel.app` |
| `ENVIRONMENT` | `production` |
| `LOG_JSON` | `true` |

**Optional:** `GROQ_API_KEY`, `SENTRY_DSN`, `OCR_SPACE_API_KEY`

### 4. Vercel — Frontend

1. Import repo → Root: `frontend` → Framework: `Next.js`
2. Set `NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com`
3. Deploy

API rewrites via `next.config.ts`:

```typescript
async rewrites() {
  return [{ source: "/api/:path*", destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*` }];
}
```

### 5. Verify

```bash
curl https://your-render-app.onrender.com/api/health
open https://your-frontend.vercel.app
open https://your-render-app.onrender.com/docs
```

---

## 🔧 Troubleshooting

> **⚠️ Health check failing?** Check Render logs. Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

> **⚠️ Frontend can't reach backend?** Check `NEXT_PUBLIC_API_URL` in Vercel. CORS? Check `ALLOWED_ORIGINS` on Render.

> **⚠️ Edge Functions failing?** Verify `FASTAPI_BACKEND_URL` and `INTERNAL_API_SECRET` match on both sides.

> **⚠️ Database timeout?** Free Supabase pauses after 1 week. Restart in Dashboard.

---

## 📋 Env Quick Reference

**Backend (Render):** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `INTERNAL_API_SECRET`, `ALLOWED_ORIGINS`, `ENVIRONMENT`, `LOG_JSON`, `GROQ_API_KEY` (opt), `SENTRY_DSN` (opt), `OCR_SPACE_API_KEY` (opt)

**Frontend (Vercel):** `NEXT_PUBLIC_API_URL`

**Edge Functions:** `INTERNAL_API_SECRET`, `FASTAPI_BACKEND_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

---

## 📄 Related

- [Setup Guide →](Setup) — Local development
- [Architecture →](Architecture)
- [Security →](Security)
