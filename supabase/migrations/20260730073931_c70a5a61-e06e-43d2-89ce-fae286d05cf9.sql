CREATE TABLE public.push_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  social_enabled boolean NOT NULL DEFAULT true,
  event_enabled boolean NOT NULL DEFAULT true,
  lifecycle_enabled boolean NOT NULL DEFAULT true,
  quiet_hours_start smallint NOT NULL DEFAULT 23,
  quiet_hours_end smallint NOT NULL DEFAULT 9,
  timezone text NOT NULL DEFAULT 'Europe/Berlin',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT push_quiet_start_range CHECK (quiet_hours_start BETWEEN 0 AND 23),
  CONSTRAINT push_quiet_end_range CHECK (quiet_hours_end BETWEEN 0 AND 23)
);
GRANT SELECT, INSERT, UPDATE ON public.push_preferences TO authenticated;
GRANT ALL ON public.push_preferences TO service_role;
ALTER TABLE public.push_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_preferences_select_own" ON public.push_preferences FOR SELECT TO authenticated
  USING (profile_id = public.current_profile_id());
CREATE POLICY "push_preferences_insert_own" ON public.push_preferences FOR INSERT TO authenticated
  WITH CHECK (profile_id = public.current_profile_id());
CREATE POLICY "push_preferences_update_own" ON public.push_preferences FOR UPDATE TO authenticated
  USING (profile_id = public.current_profile_id())
  WITH CHECK (profile_id = public.current_profile_id());

CREATE TABLE public.push_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category text NOT NULL,
  trigger_key text NOT NULL,
  dedupe_key text NOT NULL UNIQUE,
  title text NOT NULL,
  body text,
  url text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_push_sends_profile_time ON public.push_sends(profile_id, created_at DESC);
CREATE INDEX idx_push_sends_delivered ON public.push_sends(profile_id, status, created_at DESC);
GRANT SELECT ON public.push_sends TO authenticated;
GRANT ALL ON public.push_sends TO service_role;
ALTER TABLE public.push_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_sends_select_own" ON public.push_sends FOR SELECT TO authenticated
  USING (profile_id = public.current_profile_id());

CREATE OR REPLACE FUNCTION public.handle_new_profile_push_prefs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.push_preferences (profile_id) VALUES (NEW.id)
  ON CONFLICT (profile_id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_new_profile_push_prefs
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_push_prefs();

INSERT INTO public.push_preferences (profile_id)
SELECT id FROM public.profiles ON CONFLICT (profile_id) DO NOTHING;