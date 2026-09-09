-- DocLens Supabase Schema Migration
-- Migration: Setup tables, lookup systems, RLS policies, and notification triggers.

-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Document Types Lookup Table
CREATE TABLE IF NOT EXISTS public.document_types (
    code TEXT PRIMARY KEY,
    label TEXT NOT NULL
);

-- Seed document types
INSERT INTO public.document_types (code, label) VALUES
    ('aadhaar', 'Aadhaar Card'),
    ('income_certificate', 'Income Certificate'),
    ('caste_certificate', 'Caste Certificate'),
    ('ration_card', 'Ration Card (BPL)'),
    ('domicile_certificate', 'Domicile Certificate'),
    ('disability_certificate', 'Disability Certificate'),
    ('land_record', 'Land Record (Patta/RoR)'),
    ('bank_passbook', 'Bank Passbook'),
    ('voter_id', 'Voter ID Card'),
    ('education_marksheet', 'Education Marksheet / Certificate')
ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label;

-- Enable RLS for document types
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Document types are publicly readable" 
    ON public.document_types FOR SELECT TO public USING (true);


-- 2. Citizen Profiles Table (Insert-Only Versioning)
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying current active profile for a user
CREATE INDEX IF NOT EXISTS idx_citizen_profiles_user_current 
    ON public.citizen_profiles(user_id, is_current);

-- Enable RLS for citizen profiles
ALTER TABLE public.citizen_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select their own profiles" 
    ON public.citizen_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profiles" 
    ON public.citizen_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profiles" 
    ON public.citizen_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profiles" 
    ON public.citizen_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- 3. Schemes Table
CREATE TABLE IF NOT EXISTS public.schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_id TEXT UNIQUE NOT NULL,
    scheme_name TEXT NOT NULL,
    scheme_category TEXT NOT NULL,
    issuing_authority TEXT NOT NULL,
    eligibility_rules JSONB NOT NULL,
    benefit_summary TEXT NOT NULL,
    benefit_value_estimate TEXT NOT NULL,
    required_documents JSONB NOT NULL, -- Array of text codes matching document_types
    application_url TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Full-text search GIN index on schemes
CREATE INDEX IF NOT EXISTS schemes_fts_idx 
    ON public.schemes USING gin(to_tsvector('english', scheme_name || ' ' || benefit_summary));

-- Enable RLS for schemes
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schemes are publicly readable" 
    ON public.schemes FOR SELECT TO public USING (true);


-- 4. Documents Vault Table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL REFERENCES public.document_types(code) ON UPDATE CASCADE,
    storage_path TEXT NOT NULL,
    verification_status TEXT NOT NULL CHECK (verification_status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
    extracted_data JSONB,
    extraction_confidence NUMERIC,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select their own documents" 
    ON public.documents FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" 
    ON public.documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" 
    ON public.documents FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
    ON public.documents FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- 5. Eligibility Matches Table
CREATE TABLE IF NOT EXISTS public.eligibility_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scheme_id UUID NOT NULL REFERENCES public.schemes(id) ON DELETE CASCADE,
    match_score NUMERIC NOT NULL,
    missing_documents JSONB NOT NULL, -- Array of document codes
    priority_rank INTEGER NOT NULL,
    matched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, scheme_id)
);

-- Enable RLS for eligibility matches
ALTER TABLE public.eligibility_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select their own matches" 
    ON public.eligibility_matches FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own matches" 
    ON public.eligibility_matches FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own matches" 
    ON public.eligibility_matches FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own matches" 
    ON public.eligibility_matches FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- 6. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('new_match', 'doc_missing_reminder', 'scheme_updated')),
    payload JSONB NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select their own notifications" 
    ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" 
    ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
    ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" 
    ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- 7. Applications Table
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scheme_id UUID NOT NULL REFERENCES public.schemes(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('matched', 'drafted', 'applied', 'approved', 'rejected')) DEFAULT 'matched',
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT,
    UNIQUE(user_id, scheme_id)
);

-- Enable RLS for applications
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select their own applications" 
    ON public.applications FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applications" 
    ON public.applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications" 
    ON public.applications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own applications" 
    ON public.applications FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- 8. Idempotency Notification Trigger
-- Automatically triggers notifications ONLY on new eligibility match inserts.
CREATE OR REPLACE FUNCTION public.handle_new_match_notification()
RETURNS TRIGGER AS $$
DECLARE
    scheme_name_text TEXT;
BEGIN
    SELECT scheme_name INTO scheme_name_text FROM public.schemes WHERE id = NEW.scheme_id;
    
    INSERT INTO public.notifications (user_id, type, payload)
    VALUES (
        NEW.user_id,
        'new_match',
        jsonb_build_object(
            'scheme_id', NEW.scheme_id,
            'scheme_name', scheme_name_text,
            'match_score', NEW.match_score,
            'priority_rank', NEW.priority_rank
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_notify_new_match
    AFTER INSERT ON public.eligibility_matches
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_match_notification();


-- 9. Scheme Search Function (Utilizing FTS GIN index)
CREATE OR REPLACE FUNCTION public.search_schemes(query_text TEXT)
RETURNS SETOF public.schemes AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.schemes
    WHERE to_tsvector('english', scheme_name || ' ' || benefit_summary) @@ plainto_tsquery('english', query_text)
      AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

