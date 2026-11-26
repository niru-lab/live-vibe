DO $$
DECLARE _c text;
BEGIN
  FOR _c IN
    SELECT con.conname FROM pg_constraint con
    WHERE con.conrelid = 'public.user_consents'::regclass AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%consent_type%'
  LOOP
    EXECUTE format('ALTER TABLE public.user_consents DROP CONSTRAINT %I', _c);
  END LOOP;
END $$;
ALTER TABLE public.user_consents
  ADD CONSTRAINT user_consents_consent_type_check
  CHECK (consent_type IN ('analytics', 'marketing', 'presence_location'));
CREATE INDEX IF NOT EXISTS user_consents_user_type_idx ON public.user_consents (user_id, consent_type, created_at DESC);

ALTER TABLE public.privacy_settings ALTER COLUMN location_enabled SET DEFAULT false;

UPDATE public.privacy_settings ps
SET location_enabled = coalesce((
      SELECT uc.granted FROM public.user_consents uc
      JOIN public.profiles pr ON pr.user_id = uc.user_id
      WHERE pr.id = ps.profile_id AND uc.consent_type = 'presence_location'
      ORDER BY uc.created_at DESC LIMIT 1
    ), false),
    updated_at = now();

DELETE FROM public.event_presence pr
WHERE NOT EXISTS (
  SELECT 1 FROM public.privacy_settings ps WHERE ps.profile_id = pr.profile_id AND ps.location_enabled
);

CREATE OR REPLACE FUNCTION public.my_location_status()
RETURNS TABLE(enabled boolean, decided boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    coalesce((SELECT ps.location_enabled FROM public.privacy_settings ps WHERE ps.profile_id = public.current_profile_id()), false),
    EXISTS (SELECT 1 FROM public.user_consents uc WHERE uc.user_id = auth.uid() AND uc.consent_type = 'presence_location');
$$;

CREATE OR REPLACE FUNCTION public.set_location_enabled(_enabled boolean, _source text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _pid uuid := public.current_profile_id();
BEGIN
  IF _pid IS NULL OR auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _enabled IS NULL THEN RAISE EXCEPTION 'enabled required'; END IF;

  INSERT INTO public.privacy_settings (profile_id, location_enabled)
  VALUES (_pid, _enabled)
  ON CONFLICT (profile_id) DO UPDATE SET location_enabled = excluded.location_enabled, updated_at = now();

  INSERT INTO public.user_consents (user_id, consent_type, granted, version)
  VALUES (auth.uid(), 'presence_location', _enabled, 'v2' || CASE WHEN _source IS NULL THEN '' ELSE ':' || left(_source, 32) END);

  IF NOT _enabled THEN
    DELETE FROM public.event_presence WHERE profile_id = _pid;
  END IF;
  RETURN _enabled;
END $$;

ALTER TABLE public.event_presence ADD COLUMN IF NOT EXISTS has_rsvp boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.ping_event_presence(_lat double precision, _lng double precision)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _pid uuid := public.current_profile_id();
  _event uuid;
  _rsvp boolean;
BEGIN
  IF _pid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _lat IS NULL OR _lng IS NULL OR _lat < -90 OR _lat > 90 OR _lng < -180 OR _lng > 180 THEN
    RAISE EXCEPTION 'invalid coordinates';
  END IF;

  DELETE FROM public.event_presence WHERE last_seen < now() - interval '30 minutes';

  IF NOT EXISTS (SELECT 1 FROM public.privacy_settings ps WHERE ps.profile_id = _pid AND ps.location_enabled) THEN
    DELETE FROM public.event_presence WHERE profile_id = _pid;
    RETURN 0;
  END IF;

  SELECT c.id, c.rsvp INTO _event, _rsvp
  FROM (
    SELECT e.id,
      EXISTS (SELECT 1 FROM public.event_attendees a
              WHERE a.event_id = e.id AND a.user_id = _pid AND a.status = 'going') AS rsvp,
      2 * 6371000 * asin(sqrt(
          power(sin(radians(e.latitude - _lat) / 2), 2)
        + cos(radians(_lat)) * cos(radians(e.latitude)) * power(sin(radians(e.longitude - _lng) / 2), 2))) AS dist
    FROM public.events e
    WHERE e.status = 'published' AND e.deleted_at IS NULL AND e.is_active
      AND e.latitude IS NOT NULL AND e.longitude IS NOT NULL
      AND e.starts_at <= now()
      AND coalesce(e.ends_at, e.starts_at + interval '6 hours') >= now()
      AND e.latitude BETWEEN _lat - 0.002 AND _lat + 0.002
      AND e.longitude BETWEEN _lng - 0.003 AND _lng + 0.003
  ) c
  WHERE c.dist <= CASE WHEN c.rsvp THEN 100 ELSE 50 END
  ORDER BY c.dist
  LIMIT 1;

  DELETE FROM public.event_presence
  WHERE profile_id = _pid AND (_event IS NULL OR event_id <> _event);

  IF _event IS NULL THEN RETURN 0; END IF;

  INSERT INTO public.event_presence (event_id, profile_id, last_seen, has_rsvp)
  VALUES (_event, _pid, now(), _rsvp)
  ON CONFLICT (event_id, profile_id) DO UPDATE SET last_seen = excluded.last_seen, has_rsvp = excluded.has_rsvp;
  RETURN 1;
END $$;

DROP FUNCTION IF EXISTS public.event_heat(uuid[]);
CREATE FUNCTION public.event_heat(_event_ids uuid[])
RETURNS TABLE(
  event_id uuid, going_count integer, post_count integer, onsite_post_count integer,
  nearby_count integer, nearby_going_count integer, nearby_walkin_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH visible AS (
    SELECT e.id, e.venue_id, e.starts_at, coalesce(e.ends_at, e.starts_at + interval '6 hours') AS ends_at
    FROM public.events e
    WHERE e.id = ANY (_event_ids[1:300])
      AND e.deleted_at IS NULL
      AND (
        e.creator_id = public.current_profile_id()
        OR (e.venue_id IS NOT NULL AND public.is_venue_member(e.venue_id))
        OR (e.status = 'published' AND NOT public.is_blocked(public.current_profile_id(), e.creator_id) AND public.can_view_event_age(e.min_age))
      )
  ), event_posts AS (
    SELECT v.id AS event_id, p.on_site_verified
    FROM visible v
    JOIN public.posts p ON p.deleted_at IS NULL AND (
      p.event_id = v.id
      OR (v.venue_id IS NOT NULL AND p.venue_id = v.venue_id
          AND p.created_at BETWEEN v.starts_at - interval '1 hour' AND v.ends_at)
    )
  ), nearby AS (
    SELECT pr.event_id,
      count(*)::int AS total,
      count(*) FILTER (WHERE pr.has_rsvp)::int AS going,
      count(*) FILTER (WHERE NOT pr.has_rsvp)::int AS walkin
    FROM public.event_presence pr
    JOIN visible v ON v.id = pr.event_id
    WHERE pr.last_seen >= now() - interval '30 minutes'
    GROUP BY pr.event_id
  )
  SELECT v.id,
    (SELECT count(*)::int FROM public.event_attendees a WHERE a.event_id = v.id AND a.status = 'going'),
    (SELECT count(*)::int FROM event_posts ep WHERE ep.event_id = v.id),
    (SELECT count(*)::int FROM event_posts ep WHERE ep.event_id = v.id AND ep.on_site_verified),
    CASE WHEN coalesce(n.total, 0) >= 3 THEN n.total ELSE 0 END,
    CASE WHEN coalesce(n.total, 0) >= 3 THEN n.going ELSE 0 END,
    CASE WHEN coalesce(n.total, 0) >= 3 THEN n.walkin ELSE 0 END
  FROM visible v
  LEFT JOIN nearby n ON n.event_id = v.id;
$$;

CREATE OR REPLACE FUNCTION public.verify_post_location(_post_id uuid, _lat double precision, _lng double precision)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lat double precision; v_lng double precision; d double precision;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.privacy_settings ps
                 WHERE ps.profile_id = public.current_profile_id() AND ps.location_enabled) THEN
    RETURN false;
  END IF;
  SELECT ve.latitude, ve.longitude INTO v_lat, v_lng
  FROM public.posts p JOIN public.venues ve ON ve.id = p.venue_id
  WHERE p.id = _post_id AND p.author_id = public.current_profile_id()
    AND p.created_at > now() - interval '15 minutes';
  IF v_lat IS NULL OR v_lng IS NULL OR _lat IS NULL OR _lng IS NULL THEN RETURN false; END IF;
  d := 2 * 6371000 * asin(sqrt(
        power(sin(radians(_lat - v_lat) / 2), 2)
      + cos(radians(v_lat)) * cos(radians(_lat)) * power(sin(radians(_lng - v_lng) / 2), 2)));
  IF d > 200 THEN RETURN false; END IF;
  PERFORM set_config('feyrn.onsite_rpc', '1', true);
  UPDATE public.posts SET on_site_verified = true WHERE id = _post_id;
  PERFORM set_config('feyrn.onsite_rpc', '', true);
  RETURN true;
END $$;

REVOKE ALL ON FUNCTION public.my_location_status() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_location_enabled(boolean, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ping_event_presence(double precision, double precision) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.event_heat(uuid[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.verify_post_location(uuid, double precision, double precision) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_location_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_location_enabled(boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ping_event_presence(double precision, double precision) TO authenticated;
GRANT EXECUTE ON FUNCTION public.event_heat(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_post_location(uuid, double precision, double precision) TO authenticated;