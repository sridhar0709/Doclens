-- DocLens Functions & Triggers
-- Depends on: 00000000_schema.sql

-- 1. Auto-create profile on user signup
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

-- 2. Notify on new eligibility match
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

-- 3. Full-text search for schemes
CREATE OR REPLACE FUNCTION public.search_schemes(query_text TEXT)
RETURNS SETOF public.schemes AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.schemes
    WHERE to_tsvector('english', scheme_name || ' ' || benefit_summary) @@ plainto_tsquery('english', query_text)
      AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
