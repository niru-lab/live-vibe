-- Idempotency: one reward per (profile, reason, ref)
CREATE UNIQUE INDEX IF NOT EXISTS point_ledger_social_cloud_once_with_ref
  ON public.point_ledger (profile_id, reason, ref_id)
  WHERE ref_id IS NOT NULL
    AND reason IN ('first_event_rsvp','event_linked_post','venue_linked_post','venue_follow','meaningful_comment','successful_friend_invite');

CREATE UNIQUE INDEX IF NOT EXISTS point_ledger_social_cloud_once_global
  ON public.point_ledger (profile_id, reason)
  WHERE ref_id IS NULL
    AND reason IN ('first_event_rsvp','event_linked_post','venue_linked_post','venue_follow','meaningful_comment','successful_friend_invite');

CREATE OR REPLACE FUNCTION public.award_social_cloud(
  _reason text,
  _ref_type text DEFAULT NULL,
  _ref_id uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile uuid;
  _delta integer;
  _inserted integer := 0;
BEGIN
  _profile := public.current_profile_id();
  IF _profile IS NULL THEN
    RETURN 0;
  END IF;

  _delta := CASE _reason
    WHEN 'first_event_rsvp'         THEN 10
    WHEN 'event_linked_post'        THEN 25
    WHEN 'venue_linked_post'        THEN 15
    WHEN 'venue_follow'             THEN 5
    WHEN 'meaningful_comment'       THEN 5
    WHEN 'successful_friend_invite' THEN 20
    ELSE NULL
  END;

  IF _delta IS NULL THEN
    RETURN 0;
  END IF;

  INSERT INTO public.point_ledger (profile_id, delta, reason, ref_type, ref_id)
  VALUES (_profile, _delta, _reason, _ref_type, _ref_id)
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS _inserted = ROW_COUNT;
  IF _inserted = 0 THEN
    RETURN 0;
  END IF;

  INSERT INTO public.user_points (profile_id, points, level)
  VALUES (_profile, GREATEST(0, _delta), public.calculate_level(GREATEST(0, _delta)))
  ON CONFLICT (profile_id) DO UPDATE
    SET points = GREATEST(0, public.user_points.points + _delta),
        level = public.calculate_level(GREATEST(0, public.user_points.points + _delta)),
        updated_at = now();

  RETURN _delta;
END;
$$;

REVOKE ALL ON FUNCTION public.award_social_cloud(text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_social_cloud(text, text, uuid) TO authenticated;