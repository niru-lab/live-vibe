CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  event_id uuid,
  venue_id uuid,
  post_id uuid,
  offer_id uuid,
  surface text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.analytics_events TO anon, authenticated;
GRANT ALL ON public.analytics_events TO service_role;

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can record an interaction"
  ON public.analytics_events FOR INSERT TO anon, authenticated
  WITH CHECK (char_length(event_name) BETWEEN 1 AND 64);

CREATE INDEX analytics_events_event_idx ON public.analytics_events (event_id, event_name, created_at DESC);
CREATE INDEX analytics_events_venue_idx ON public.analytics_events (venue_id, event_name, created_at DESC);
CREATE INDEX analytics_events_post_idx ON public.analytics_events (post_id, created_at DESC);
CREATE INDEX analytics_events_created_idx ON public.analytics_events (created_at DESC);

-- Overview: one aggregated row, scoped to the caller's own venues/events.
CREATE OR REPLACE FUNCTION public.venue_analytics_overview(_since timestamptz DEFAULT NULL)
RETURNS TABLE(
  event_views bigint,
  map_opens bigint,
  venue_profile_views bigint,
  shares bigint,
  going bigint,
  interested bigint,
  requests bigint,
  linked_posts bigint,
  linked_creators bigint,
  post_likes bigint,
  post_comments bigint,
  venue_follows bigint,
  offer_impressions bigint,
  offer_activations bigint,
  total_events bigint,
  upcoming_events bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
WITH me AS (SELECT public.current_profile_id() AS pid),
ev AS (
  SELECT e.id, e.starts_at FROM public.events e, me
  WHERE e.creator_id = me.pid AND e.deleted_at IS NULL
),
vn AS (
  SELECT v.id FROM public.venues v, me WHERE v.owner_profile_id = me.pid
),
a AS (
  SELECT ae.* FROM public.analytics_events ae
  WHERE (_since IS NULL OR ae.created_at >= _since)
    AND (ae.event_id IN (SELECT id FROM ev) OR ae.venue_id IN (SELECT id FROM vn))
),
p AS (
  SELECT po.id, po.author_id, po.likes_count, po.comments_count
  FROM public.posts po
  WHERE po.deleted_at IS NULL
    AND (_since IS NULL OR po.created_at >= _since)
    AND (po.event_id IN (SELECT id FROM ev) OR po.venue_id IN (SELECT id FROM vn))
)
SELECT
  (SELECT count(*) FROM a WHERE a.event_name = 'event_detail_viewed'),
  (SELECT count(*) FROM a WHERE a.event_name IN ('venue_marker_opened','event_marker_opened')),
  (SELECT count(*) FROM a WHERE a.event_name IN ('venue_profile_viewed','venue_profile_opened_from_map')),
  (SELECT count(*) FROM a WHERE a.event_name IN ('share_clicked','offer_shared')),
  (SELECT count(*) FROM public.event_attendees ea WHERE ea.event_id IN (SELECT id FROM ev) AND ea.status = 'going' AND (_since IS NULL OR ea.created_at >= _since))
  + (SELECT count(*) FROM public.event_participants ep WHERE ep.event_id IN (SELECT id FROM ev) AND ep.status = 'accepted' AND (_since IS NULL OR ep.created_at >= _since)),
  (SELECT count(*) FROM public.event_attendees ea WHERE ea.event_id IN (SELECT id FROM ev) AND ea.status = 'interested' AND (_since IS NULL OR ea.created_at >= _since)),
  (SELECT count(*) FROM public.event_participants ep WHERE ep.event_id IN (SELECT id FROM ev) AND ep.status = 'requested' AND (_since IS NULL OR ep.created_at >= _since)),
  (SELECT count(*) FROM p),
  (SELECT count(DISTINCT p.author_id) FROM p),
  (SELECT COALESCE(sum(p.likes_count), 0) FROM p),
  (SELECT COALESCE(sum(p.comments_count), 0) FROM p),
  (SELECT count(*) FROM public.follows f, me WHERE f.following_id = me.pid AND (_since IS NULL OR f.created_at >= _since)),
  (SELECT count(*) FROM a WHERE a.event_name IN ('offer_impression','offer_opened')),
  (SELECT count(*) FROM public.offer_activations oa JOIN public.venue_offers vo ON vo.id = oa.offer_id
     WHERE vo.venue_id IN (SELECT id FROM vn) AND oa.status = 'active' AND (_since IS NULL OR oa.activated_at >= _since)),
  (SELECT count(*) FROM ev),
  (SELECT count(*) FROM ev WHERE ev.starts_at >= now());
$$;

-- Per-event performance for the caller's own events.
CREATE OR REPLACE FUNCTION public.venue_event_performance(_since timestamptz DEFAULT NULL, _limit integer DEFAULT 50, _offset integer DEFAULT 0)
RETURNS TABLE(
  event_id uuid,
  name text,
  starts_at timestamptz,
  ends_at timestamptz,
  city text,
  views bigint,
  shares bigint,
  going bigint,
  interested bigint,
  requests bigint,
  posts bigint,
  likes bigint,
  comments bigint,
  offer_activations bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
WITH me AS (SELECT public.current_profile_id() AS pid),
ev AS (
  SELECT e.id, e.name, e.starts_at, e.ends_at, e.city
  FROM public.events e, me
  WHERE e.creator_id = me.pid AND e.deleted_at IS NULL
)
SELECT
  ev.id, ev.name, ev.starts_at, ev.ends_at, ev.city,
  (SELECT count(*) FROM public.analytics_events a WHERE a.event_id = ev.id AND a.event_name = 'event_detail_viewed' AND (_since IS NULL OR a.created_at >= _since)),
  (SELECT count(*) FROM public.analytics_events a WHERE a.event_id = ev.id AND a.event_name IN ('share_clicked','offer_shared') AND (_since IS NULL OR a.created_at >= _since)),
  (SELECT count(*) FROM public.event_attendees ea WHERE ea.event_id = ev.id AND ea.status = 'going' AND (_since IS NULL OR ea.created_at >= _since))
  + (SELECT count(*) FROM public.event_participants ep WHERE ep.event_id = ev.id AND ep.status = 'accepted' AND (_since IS NULL OR ep.created_at >= _since)),
  (SELECT count(*) FROM public.event_attendees ea WHERE ea.event_id = ev.id AND ea.status = 'interested' AND (_since IS NULL OR ea.created_at >= _since)),
  (SELECT count(*) FROM public.event_participants ep WHERE ep.event_id = ev.id AND ep.status = 'requested' AND (_since IS NULL OR ep.created_at >= _since)),
  (SELECT count(*) FROM public.posts po WHERE po.event_id = ev.id AND po.deleted_at IS NULL AND (_since IS NULL OR po.created_at >= _since)),
  (SELECT COALESCE(sum(po.likes_count),0) FROM public.posts po WHERE po.event_id = ev.id AND po.deleted_at IS NULL AND (_since IS NULL OR po.created_at >= _since)),
  (SELECT COALESCE(sum(po.comments_count),0) FROM public.posts po WHERE po.event_id = ev.id AND po.deleted_at IS NULL AND (_since IS NULL OR po.created_at >= _since)),
  (SELECT count(*) FROM public.offer_activations oa JOIN public.venue_offers vo ON vo.id = oa.offer_id
     WHERE vo.event_id = ev.id AND oa.status = 'active' AND (_since IS NULL OR oa.activated_at >= _since))
FROM ev
ORDER BY ev.starts_at DESC
LIMIT LEAST(GREATEST(COALESCE(_limit, 50), 1), 100) OFFSET GREATEST(COALESCE(_offset, 0), 0);
$$;

-- Per-post content performance for posts linked to the caller's events/venues.
CREATE OR REPLACE FUNCTION public.venue_content_performance(_since timestamptz DEFAULT NULL, _limit integer DEFAULT 30, _offset integer DEFAULT 0)
RETURNS TABLE(
  post_id uuid,
  created_at timestamptz,
  media_url text,
  media_type text,
  event_id uuid,
  event_name text,
  venue_id uuid,
  likes bigint,
  comments bigint,
  views bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
WITH me AS (SELECT public.current_profile_id() AS pid),
ev AS (SELECT e.id, e.name FROM public.events e, me WHERE e.creator_id = me.pid AND e.deleted_at IS NULL),
vn AS (SELECT v.id FROM public.venues v, me WHERE v.owner_profile_id = me.pid)
SELECT
  po.id, po.created_at, po.media_url, po.media_type,
  po.event_id, ev.name, po.venue_id,
  COALESCE(po.likes_count,0)::bigint, COALESCE(po.comments_count,0)::bigint,
  (SELECT count(*) FROM public.analytics_events a WHERE a.post_id = po.id AND a.event_name = 'post_viewed' AND (_since IS NULL OR a.created_at >= _since))
FROM public.posts po
LEFT JOIN ev ON ev.id = po.event_id
, me
WHERE po.deleted_at IS NULL
  AND (_since IS NULL OR po.created_at >= _since)
  AND (po.event_id IN (SELECT id FROM ev) OR po.venue_id IN (SELECT id FROM vn))
  AND NOT public.is_blocked(me.pid, po.author_id)
ORDER BY (COALESCE(po.likes_count,0) + COALESCE(po.comments_count,0)) DESC, po.created_at DESC
LIMIT LEAST(GREATEST(COALESCE(_limit, 30), 1), 100) OFFSET GREATEST(COALESCE(_offset, 0), 0);
$$;

REVOKE EXECUTE ON FUNCTION public.venue_analytics_overview(timestamptz) FROM anon;
REVOKE EXECUTE ON FUNCTION public.venue_event_performance(timestamptz, integer, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.venue_content_performance(timestamptz, integer, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.venue_analytics_overview(timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.venue_event_performance(timestamptz, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.venue_content_performance(timestamptz, integer, integer) TO authenticated;