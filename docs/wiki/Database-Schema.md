# 🗄️ Database Schema

> PostgreSQL 15 — 7 tables, 18 constraints, 2 indexes, 2 triggers, 3 functions

---

## 🔗 Entity-Relationship

```
auth.users
  └── citizen_profiles (1:1, user_id FK)
  └── documents (1:N, user_id FK)
  │     └── doc_type FK → document_types(code)
  └── eligibility_matches (1:N, user_id FK)
  │     └── scheme_id FK → schemes(id)
  └── notifications (1:N, user_id FK)
  └── applications (1:N, user_id FK)
        └── scheme_id FK → schemes(id)
```

---

## 📊 Tables

### document_types — Lookup

| Column | Type | Constraints |
|--------|------|------------|
| `code` | `TEXT` | `PRIMARY KEY` |
| `label` | `TEXT` | `NOT NULL` |

**Seed:** aadhaar, income_certificate, caste_certificate, ration_card, domicile_certificate, disability_certificate, land_record, bank_passbook, voter_id, education_marksheet

**RLS:** Public read (`SELECT TO public`)

---

### citizen_profiles — User Profiles

| Column | Type | Constraints |
|--------|------|------------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` |
| `user_id` | `UUID` | `NOT NULL → auth.users(id) ON DELETE CASCADE` |
| `full_name` | `TEXT` | `NOT NULL` |
| `age` | `INTEGER` | `NOT NULL` |
| `gender` | `TEXT` | `NOT NULL` |
| `state` | `TEXT` | `NOT NULL` |
| `district` | `TEXT` | `NOT NULL` |
| `annual_income` | `NUMERIC` | `NOT NULL` |
| `occupation` | `TEXT` | `NOT NULL` |
| `social_category` | `TEXT` | `NOT NULL` |
| `disability_status` | `TEXT` | `NOT NULL` |
| `family_size` | `INTEGER` | `NOT NULL` |
| `has_bpl_card` | `BOOLEAN` | `NOT NULL` |
| `land_owned_acres` | `NUMERIC` | `NOT NULL` |
| `education_level` | `TEXT` | `NOT NULL` |
| `is_current` | `BOOLEAN` | `NOT NULL DEFAULT true` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` |

**Constraint:** `UNIQUE(user_id)` · **Index:** `(user_id, is_current)`

---

### schemes — Welfare Programs

| Column | Type | Constraints |
|--------|------|------------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` |
| `scheme_id` | `TEXT` | `UNIQUE NOT NULL` |
| `scheme_name` | `TEXT` | `NOT NULL` |
| `scheme_category` | `TEXT` | `NOT NULL` |
| `issuing_authority` | `TEXT` | `NOT NULL` |
| `eligibility_rules` | `JSONB` | `NOT NULL` |
| `benefit_summary` | `TEXT` | `NOT NULL` |
| `benefit_value_estimate` | `TEXT` | `NOT NULL` |
| `required_documents` | `JSONB` | `NOT NULL` |
| `application_url` | `TEXT` | `NOT NULL` |
| `is_active` | `BOOLEAN` | `NOT NULL DEFAULT true` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` |

**Index:** GIN `schemes_fts_idx ON to_tsvector('english', scheme_name || ' ' || benefit_summary)`

**`eligibility_rules` JSONB:**
```json
{
  "min_age": 18, "max_age": 59, "max_annual_income": 100000,
  "allowed_occupations": ["farmer"],
  "allowed_social_categories": ["sc","st"],
  "required_disability_status": ["physical"],
  "state_restricted_to": ["Odisha"],
  "gender_restricted_to": "female"
}
```

---

### documents — Document Vault

| Column | Type | Constraints |
|--------|------|------------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` |
| `user_id` | `UUID` | `NOT NULL → auth.users(id) ON DELETE CASCADE` |
| `doc_type` | `TEXT` | `NOT NULL → document_types(code) ON UPDATE CASCADE` |
| `storage_path` | `TEXT` | `NOT NULL` |
| `verification_status` | `TEXT` | `NOT NULL DEFAULT 'pending' CHECK (IN ('pending','verified','rejected'))` |
| `extracted_data` | `JSONB` | nullable |
| `extraction_confidence` | `NUMERIC` | nullable |
| `uploaded_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` |

**Constraint:** `UNIQUE(user_id, doc_type)` — one per type per user

---

### eligibility_matches — Scheme Matches

| Column | Type | Constraints |
|--------|------|------------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` |
| `user_id` | `UUID` | `NOT NULL → auth.users(id) ON DELETE CASCADE` |
| `scheme_id` | `UUID` | `NOT NULL → schemes(id) ON DELETE CASCADE` |
| `match_score` | `NUMERIC` | `NOT NULL` |
| `missing_documents` | `JSONB` | `NOT NULL` |
| `priority_rank` | `INTEGER` | `NOT NULL` |
| `matched_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` |

**Constraint:** `UNIQUE(user_id, scheme_id)`
**Auto-notify:** `trg_notify_new_match` creates notification on INSERT.

---

### notifications

| Column | Type | Constraints |
|--------|------|------------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` |
| `user_id` | `UUID` | `NOT NULL → auth.users(id) ON DELETE CASCADE` |
| `type` | `TEXT` | `NOT NULL CHECK (IN ('new_match','doc_missing_reminder','scheme_updated'))` |
| `payload` | `JSONB` | `NOT NULL` |
| `read_at` | `TIMESTAMPTZ` | nullable |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` |

---

### applications

| Column | Type | Constraints |
|--------|------|------------|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` |
| `user_id` | `UUID` | `NOT NULL → auth.users(id) ON DELETE CASCADE` |
| `scheme_id` | `UUID` | `NOT NULL → schemes(id) ON DELETE CASCADE` |
| `status` | `TEXT` | `NOT NULL DEFAULT 'matched' CHECK (IN ('matched','drafted','applied','approved','rejected'))` |
| `applied_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` |
| `notes` | `TEXT` | nullable |

**Constraint:** `UNIQUE(user_id, scheme_id)`

---

## 🔒 RLS Policies

| Table | Public | Own Data (CRUD) |
|-------|--------|-----------------|
| `document_types` | ✅ SELECT | — |
| `schemes` | ✅ SELECT | — |
| `citizen_profiles` | — | ✅ |
| `documents` | — | ✅ |
| `eligibility_matches` | — | ✅ |
| `notifications` | — | ✅ |
| `applications` | — | ✅ |

All user-scoped: `auth.uid() = user_id`

---

## ⚙️ Functions & Triggers

| Trigger | Event | Function | Purpose |
|---------|-------|----------|---------|
| `on_auth_user_created_profile` | AFTER INSERT ON `auth.users` | `handle_new_user_profile()` | Auto-create profile from signup metadata |
| `trg_notify_new_match` | AFTER INSERT ON `eligibility_matches` | `handle_new_match_notification()` | Notify user of new match |

**`search_schemes(query_text)`** — Full-text search via GIN index. Returns `SETOF schemes`.

---

## 📜 Migrations

| File | Contents |
|------|----------|
| `00000000_schema.sql` | 7 CREATE TABLE, extensions, indexes, constraints |
| `00000001_rls.sql` | ENABLE RLS + 22 CREATE POLICY |
| `00000002_functions.sql` | 3 functions + 2 triggers |
| `00000003_seed_data.sql` | 10 doc types + 20 scheme rows |

---

## 📄 Related

- [API Reference →](API-Reference)
- [Security →](Security)
- [Architecture →](Architecture)
