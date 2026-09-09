/* DocLens DB Migration: Fix Profile Unique Constraint and Auto-populate Profile from Signup Metadata */

/* 1. De-duplicate existing profiles, keep only the newest per user */
DELETE FROM public.citizen_profiles a
USING public.citizen_profiles b
WHERE a.user_id = b.user_id
  AND a.created_at < b.created_at;

/* 2. Enforce one profile per user going forward */
ALTER TABLE public.citizen_profiles
  ADD CONSTRAINT citizen_profiles_user_id_unique UNIQUE (user_id);

/* 3. Auto-create a profile row from signup metadata */
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.citizen_profiles (
    user_id, full_name, age, gender, state, district,
    annual_income, occupation, social_category, disability_status,
    family_size, has_bpl_card, land_owned_acres, education_level
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'age', '')::int, 0),
    COALESCE(NEW.raw_user_meta_data->>'gender', 'other'),
    COALESCE(NEW.raw_user_meta_data->>'state', ''),
    COALESCE(NEW.raw_user_meta_data->>'district', ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'annual_income', '')::numeric, 0),
    COALESCE(NEW.raw_user_meta_data->>'occupation', 'other'),
    COALESCE(NEW.raw_user_meta_data->>'social_category', 'general'),
    COALESCE(NEW.raw_user_meta_data->>'disability_status', 'none'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'family_size', '')::int, 1),
    COALESCE((NEW.raw_user_meta_data->>'has_bpl_card')::boolean, false),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'land_owned_acres', '')::numeric, 0),
    COALESCE(NEW.raw_user_meta_data->>'education_level', 'other')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();
