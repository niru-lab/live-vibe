CREATE OR REPLACE FUNCTION public.enforce_venue_public_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r text;
BEGIN
  SELECT role INTO r FROM public.profiles WHERE id = NEW.profile_id;
  IF r = 'venue' AND NEW.profile_visibility <> 'public' THEN
    NEW.profile_visibility := 'public';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_venue_public_profile ON public.privacy_settings;
CREATE TRIGGER trg_enforce_venue_public_profile
BEFORE INSERT OR UPDATE ON public.privacy_settings
FOR EACH ROW EXECUTE FUNCTION public.enforce_venue_public_profile();

UPDATE public.privacy_settings ps
SET profile_visibility = 'public'
FROM public.profiles p
WHERE ps.profile_id = p.id AND p.role = 'venue' AND ps.profile_visibility <> 'public';