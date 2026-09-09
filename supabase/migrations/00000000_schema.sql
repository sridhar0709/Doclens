-- DocLens Schema — tables, extensions, indexes, constraints
-- Replaces: schema_setup (tables part), fix_profile_unique_constraint, unique_user_doc_type

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Document Types Lookup
CREATE TABLE IF NOT EXISTS public.document_types (
    code TEXT PRIMARY KEY,
    label TEXT NOT NULL
);

-- 2. Citizen Profiles
CREATE TABLE IF NOT EXISTS public.citizen_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT NOT NULL,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    annual_income NUMERIC NOT NULL,
    occupation TEXT NOT NULL,
    social_category TEXT NOT NULL,
    disability_status TEXT NOT NULL,
    family_size INTEGER NOT NULL,
    has_bpl_card BOOLEAN NOT NULL,
    land_owned_acres NUMERIC NOT NULL,
    education_level TEXT NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT citizen_profiles_user_id_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_citizen_profiles_user_current
    ON public.citizen_profiles(user_id, is_current);

-- 3. Schemes
CREATE TABLE IF NOT EXISTS public.schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_id TEXT UNIQUE NOT NULL,
    scheme_name TEXT NOT NULL,
    scheme_category TEXT NOT NULL,
    issuing_authority TEXT NOT NULL,
    eligibility_rules JSONB NOT NULL,
    benefit_summary TEXT NOT NULL,
    benefit_value_estimate TEXT NOT NULL,
    required_documents JSONB NOT NULL,
    application_url TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS schemes_fts_idx
    ON public.schemes USING gin(to_tsvector('english', scheme_name || ' ' || benefit_summary));

-- 4. Documents Vault
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL REFERENCES public.document_types(code) ON UPDATE CASCADE,
    storage_path TEXT NOT NULL,
    verification_status TEXT NOT NULL CHECK (verification_status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
    extracted_data JSONB,
    extraction_confidence NUMERIC,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_doc_type UNIQUE (user_id, doc_type)
);

-- 5. Eligibility Matches
CREATE TABLE IF NOT EXISTS public.eligibility_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scheme_id UUID NOT NULL REFERENCES public.schemes(id) ON DELETE CASCADE,
    match_score NUMERIC NOT NULL,
    missing_documents JSONB NOT NULL,
    priority_rank INTEGER NOT NULL,
    matched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, scheme_id)
);

-- 6. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('new_match', 'doc_missing_reminder', 'scheme_updated')),
    payload JSONB NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Applications
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scheme_id UUID NOT NULL REFERENCES public.schemes(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('matched', 'drafted', 'applied', 'approved', 'rejected')) DEFAULT 'matched',
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT,
    UNIQUE(user_id, scheme_id)
);
