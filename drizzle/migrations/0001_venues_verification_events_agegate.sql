-- Venues: additional fields + verification status
ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS capacity integer,
  ADD COLUMN IF NOT EXISTS opening_hours jsonb,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS imprint_url text,
  ADD COLUMN IF NOT EXISTS register_number text,
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE public.venues ADD CONSTRAINT venues_verification_status_check
  CHECK (verification_status IN ('pending','approved','rejected'));

-- Venue members
CREATE TABLE public.venue_members (
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner','staff')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (venue_id, user_id)
);
INSERT INTO public.venue_members (venue_id, user_id, role)
  SELECT v.id, p.user_id, 'owner' FROM public.venues v JOIN public.profiles p ON p.id = v.owner_profile_id
  ON CONFLICT DO NOTHING;
GRANT SELECT ON public.venue_members TO authenticated;
GRANT ALL ON public.venue_members TO service_role;
ALTER TABLE public.venue_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_venue_member(_venue_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.venue_members WHERE venue_id = _venue_id AND user_id = auth.uid())
$$;

CREATE POLICY "Members view own venue membership" ON public.venue_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.add_venue_owner_member()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.venue_members (venue_id, user_id, role)
  SELECT NEW.id, p.user_id, 'owner' FROM public.profiles p WHERE p.id = NEW.owner_profile_id
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_venue_owner_member AFTER INSERT ON public.venues
  FOR EACH ROW EXECUTE FUNCTION public.add_venue_owner_member();

-- Only admins may change verification fields
CREATE OR REPLACE FUNCTION public.protect_venue_verification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.verification_status := 'pending'; NEW.verified_at := NULL; NEW.is_verified := false;
  ELSE
    NEW.verification_status := OLD.verification_status; NEW.verified_at := OLD.verified_at; NEW.is_verified := OLD.is_verified;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_protect_venue_verification BEFORE INSERT OR UPDATE ON public.venues
  FOR EACH ROW EXECUTE FUNCTION public.protect_venue_verification();

-- Also lock profiles.is_verified against self-edits
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF coalesce(current_setting('feyrn.role_rpc', true), '') = '1' OR auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.role := NULL; NEW.is_verified := false;
  ELSE
    IF NEW.role IS DISTINCT FROM OLD.role THEN NEW.role := OLD.role; END IF;
    IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN NEW.is_verified := OLD.is_verified; END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_venue_status(_venue_id uuid, _status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _status NOT IN ('approved','rejected','pending') THEN RAISE EXCEPTION 'invalid status'; END IF;
  UPDATE public.venues SET verification_status = _status,
    is_verified = (_status = 'approved'),
    verified_at = CASE WHEN _status = 'approved' THEN now() ELSE NULL END
  WHERE id = _venue_id;
  UPDATE public.profiles SET is_verified = (_status = 'approved')
  WHERE id = (SELECT owner_profile_id FROM public.venues WHERE id = _venue_id);
END $$;
REVOKE ALL ON FUNCTION public.admin_set_venue_status(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_venue_status(uuid, text) TO authenticated;

-- Venue agreements (append-only)
CREATE TABLE public.venue_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  agreement_version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.venue_agreements TO authenticated;
GRANT ALL ON public.venue_agreements TO service_role;
ALTER TABLE public.venue_agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members accept agreements" ON public.venue_agreements FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_venue_member(venue_id));
CREATE POLICY "View own agreements" ON public.venue_agreements FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Events: venue link, age gate, status
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS venue_id uuid REFERENCES public.venues(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS min_age integer,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';
ALTER TABLE public.events ADD CONSTRAINT events_status_check CHECK (status IN ('draft','published','cancelled'));
ALTER TABLE public.events ADD CONSTRAINT events_min_age_check CHECK (min_age IS NULL OR (min_age BETWEEN 0 AND 30));

CREATE OR REPLACE FUNCTION public.viewer_age()
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(date_part('year', age(birthdate))::int, age)
  FROM public.profiles WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.can_view_event_age(_min_age integer)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _min_age IS NULL OR coalesce(public.viewer_age() >= _min_age, false)
$$;

DROP POLICY "Events are viewable by everyone" ON public.events;
CREATE POLICY "Events are viewable by everyone" ON public.events FOR SELECT
  USING (
    (creator_id IN (SELECT profiles.id FROM public.profiles WHERE profiles.user_id = auth.uid()))
    OR (venue_id IS NOT NULL AND public.is_venue_member(venue_id))
    OR (status = 'published'
        AND NOT public.is_blocked(public.current_profile_id(), creator_id)
        AND public.can_view_event_age(min_age))
  );

DROP POLICY "Authenticated users can create events" ON public.events;
CREATE POLICY "Authenticated users can create events" ON public.events FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND creator_id IN (SELECT profiles.id FROM public.profiles WHERE profiles.user_id = auth.uid())
    AND (venue_id IS NULL OR public.is_venue_member(venue_id))
  );

DROP POLICY "Users can update their own events" ON public.events;
CREATE POLICY "Users can update their own events" ON public.events FOR UPDATE
  USING (
    creator_id IN (SELECT profiles.id FROM public.profiles WHERE profiles.user_id = auth.uid())
    OR (venue_id IS NOT NULL AND public.is_venue_member(venue_id))
  )
  WITH CHECK (venue_id IS NULL OR public.is_venue_member(venue_id));

-- Public attendee avatars (only opted-in, max 8)
CREATE OR REPLACE FUNCTION public.event_visible_attendees(_event_id uuid)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id FROM public.event_attendees a
  JOIN public.profiles p ON p.id = a.user_id
  JOIN public.events e ON e.id = a.event_id
  WHERE a.event_id = _event_id AND a.status = 'going' AND p.show_attendance = true
    AND e.status = 'published' AND public.can_view_event_age(e.min_age)
  ORDER BY a.created_at DESC LIMIT 8
$$;
GRANT EXECUTE ON FUNCTION public.event_visible_attendees(uuid) TO authenticated;