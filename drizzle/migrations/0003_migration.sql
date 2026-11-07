-- Anonymous "people nearby" signal for live events. Clients never read or write this table directly.
CREATE TABLE public.event_presence (
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_seen timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, profile_id)
);
GRANT ALL ON public.event_presence TO service_role;
ALTER TABLE public.event_presence ENABLE ROW LEVEL SECURITY;
CREATE INDEX event_presence_last_seen_idx ON public.event_presence (last_seen);

-- Called while the app is open and the user opted in. Counts the user at live events within 200 m.
CREATE OR REPLACE FUNCTION public.ping_event_presence(_lat double precision, _lng double precision)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _pid uuid := public.current_profile_id(); _n integer := 0;
BEGIN
  IF _pid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _lat IS NULL OR _lng IS NULL OR _lat < -90 OR _lat > 90 OR _lng < -180 OR _lng > 180 THEN
    RAISE EXCEPTION 'invalid coordinates';
  END IF;

  DELETE FROM public.event_presence WHERE last_seen < now() - interval '30 minutes';

  IF EXISTS (SELECT 1 FROM public.privacy_settings ps WHERE ps.profile_id = _pid AND ps.location_enabled = false) THEN
    DELETE FROM public.event_presence WHERE profile_id = _pid;
    RETURN 0;
  END IF;

  INSERT INTO public.event_presence (event_id, profile_id, last_seen)
  SELECT e.id, _pid, now()
  FROM public.events e
  WHERE e.status = 'published' AND e.deleted_at IS NULL AND e.is_active
    AND e.latitude IS NOT NULL AND e.longitude IS NOT NULL
    AND e.starts_at <= now() + interval '30 minutes'
    AND coalesce(e.ends_at, e.starts_at + interval '6 hours') >= now()
    AND 2 * 6371000 * asin(sqrt(
          power(sin(radians(e.latitude - _lat) / 2), 2)
        + cos(radians(_lat)) * cos(radians(e.latitude)) * power(sin(radians(e.longitude - _lng) / 2), 2))) <= 200
  ON CONFLICT (event_id, profile_id) DO UPDATE SET last_seen = excluded.last_seen;
  GET DIAGNOSTICS _n = ROW_COUNT;
  RETURN _n;
END $$;

-- Aggregated heat signals for events the caller may see (mirrors the events SELECT policy).
-- Nearby count is suppressed below 3 people so nobody can be singled out.
CREATE OR REPLACE FUNCTION public.event_heat(_event_ids uuid[])
RETURNS TABLE(event_id uuid, going_count integer, post_count integer, onsite_post_count integer, nearby_count integer)
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
  )
  SELECT v.id,
    (SELECT count(*)::int FROM public.event_attendees a WHERE a.event_id = v.id AND a.status = 'going'),
    (SELECT count(*)::int FROM event_posts ep WHERE ep.event_id = v.id),
    (SELECT count(*)::int FROM event_posts ep WHERE ep.event_id = v.id AND ep.on_site_verified),
    (SELECT CASE WHEN s.c >= 3 THEN s.c ELSE 0 END
       FROM (SELECT count(*)::int AS c FROM public.event_presence pr
             WHERE pr.event_id = v.id AND pr.last_seen >= now() - interval '30 minutes') s)
  FROM visible v;
$$;

REVOKE ALL ON FUNCTION public.ping_event_presence(double precision, double precision) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.event_heat(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ping_event_presence(double precision, double precision) TO authenticated;
GRANT EXECUTE ON FUNCTION public.event_heat(uuid[]) TO authenticated;