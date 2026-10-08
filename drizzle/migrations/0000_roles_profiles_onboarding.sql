CREATE TYPE public.app_role AS ENUM ('guest','venue_owner','admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Profile additions
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_attendance boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_step integer NOT NULL DEFAULT 0;

-- Protect profiles.role: only changeable through set_account_type
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF coalesce(current_setting('feyrn.role_rpc', true), '') = '1' OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.role := NULL;
  ELSIF NEW.role IS DISTINCT FROM OLD.role THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_protect_profile_role BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

CREATE OR REPLACE FUNCTION public.set_account_type(_type text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _type NOT IN ('guest','venue_owner') THEN RAISE EXCEPTION 'invalid account type'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role IN ('guest','venue_owner')) THEN
    RAISE EXCEPTION 'account type already set';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, _type::public.app_role);
  PERFORM set_config('feyrn.role_rpc', '1', true);
  UPDATE public.profiles SET role = _type WHERE user_id = _uid;
  PERFORM set_config('feyrn.role_rpc', '', true);
END $$;
REVOKE ALL ON FUNCTION public.set_account_type(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_account_type(text) TO authenticated;

-- Server-side profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _base text;
BEGIN
  _base := lower(regexp_replace(coalesce(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1), 'feyrn_user'), '[^a-zA-Z0-9_]', '_', 'g'));
  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (
    NEW.id,
    left(_base, 20) || '_' || substr(NEW.id::text, 1, 4),
    coalesce(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1), 'Feyrn User')
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Public profile view
CREATE OR REPLACE VIEW public.public_profiles WITH (security_invoker = on) AS
  SELECT id, display_name, avatar_url, city, username FROM public.profiles;
GRANT SELECT ON public.public_profiles TO authenticated;

-- Preferences
CREATE TABLE public.user_preferences (
  user_id uuid PRIMARY KEY,
  genres text[] NOT NULL DEFAULT '{}',
  frequency text,
  preferred_days text[] NOT NULL DEFAULT '{}',
  budget_range text,
  venue_types text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own preferences select" ON public.user_preferences FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Own preferences insert" ON public.user_preferences FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own preferences update" ON public.user_preferences FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Consents (append-only)
CREATE TABLE public.user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  consent_type text NOT NULL CHECK (consent_type IN ('analytics','marketing')),
  granted boolean NOT NULL,
  version text NOT NULL DEFAULT 'v1',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.user_consents TO authenticated;
GRANT ALL ON public.user_consents TO service_role;
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own consents select" ON public.user_consents FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Own consents insert" ON public.user_consents FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Venue waitlist
CREATE TABLE public.venue_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.venue_waitlist TO authenticated;
GRANT ALL ON public.venue_waitlist TO service_role;
ALTER TABLE public.venue_waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own waitlist select" ON public.venue_waitlist FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Venue owners join waitlist" ON public.venue_waitlist FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'venue_owner'));