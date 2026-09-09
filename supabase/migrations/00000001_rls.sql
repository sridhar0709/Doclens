-- DocLens Row-Level Security Policies
-- Depends on: 00000000_schema.sql

-- Document Types — public read
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Document types are publicly readable"
    ON public.document_types FOR SELECT TO public USING (true);

-- Citizen Profiles — own data only
ALTER TABLE public.citizen_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can select their own profiles"
    ON public.citizen_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profiles"
    ON public.citizen_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profiles"
    ON public.citizen_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own profiles"
    ON public.citizen_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Schemes — public read
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Schemes are publicly readable"
    ON public.schemes FOR SELECT TO public USING (true);

-- Documents — own data only
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can select their own documents"
    ON public.documents FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own documents"
    ON public.documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own documents"
    ON public.documents FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own documents"
    ON public.documents FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Eligibility Matches — own data only
ALTER TABLE public.eligibility_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can select their own matches"
    ON public.eligibility_matches FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own matches"
    ON public.eligibility_matches FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own matches"
    ON public.eligibility_matches FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own matches"
    ON public.eligibility_matches FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Notifications — own data only
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can select their own notifications"
    ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notifications"
    ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications"
    ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Applications — own data only
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can select their own applications"
    ON public.applications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own applications"
    ON public.applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own applications"
    ON public.applications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own applications"
    ON public.applications FOR DELETE TO authenticated USING (auth.uid() = user_id);
