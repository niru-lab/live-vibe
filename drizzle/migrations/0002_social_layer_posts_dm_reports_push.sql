-- Posts: vibe check fields
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS crowd_level smallint,
  ADD COLUMN IF NOT EXISTS mood smallint,
  ADD COLUMN IF NOT EXISTS music_fit boolean,
  ADD COLUMN IF NOT EXISTS on_site_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS posted_as_venue_id uuid REFERENCES public.venues(id) ON DELETE SET NULL;
ALTER TABLE public.posts ADD CONSTRAINT posts_crowd_level_check CHECK (crowd_level IS NULL OR crowd_level BETWEEN 1 AND 5);
ALTER TABLE public.posts ADD CONSTRAINT posts_mood_check CHECK (mood IS NULL OR mood BETWEEN 1 AND 5);

CREATE OR REPLACE FUNCTION public.protect_post_on_site()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF coalesce(current_setting('feyrn.onsite_rpc', true), '') = '1' OR auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN NEW.on_site_verified := false;
  ELSE NEW.on_site_verified := OLD.on_site_verified; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_protect_post_on_site BEFORE INSERT OR UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.protect_post_on_site();

CREATE OR REPLACE FUNCTION public.verify_post_location(_post_id uuid, _lat double precision, _lng double precision)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lat double precision; v_lng double precision; d double precision;
BEGIN
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
REVOKE ALL ON FUNCTION public.verify_post_location(uuid, double precision, double precision) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.verify_post_location(uuid, double precision, double precision) TO authenticated;

DROP POLICY "Authenticated users can create posts" ON public.posts;
CREATE POLICY "Authenticated users can create posts" ON public.posts FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND author_id IN (SELECT profiles.id FROM public.profiles WHERE profiles.user_id = auth.uid())
    AND (posted_as_venue_id IS NULL OR public.is_venue_member(posted_as_venue_id))
  );

DROP POLICY "Posts viewable by allowed viewers" ON public.posts;
CREATE POLICY "Posts viewable by allowed viewers" ON public.posts FOR SELECT
  USING (
    deleted_at IS NULL
    AND ((author_id = public.current_profile_id()) OR public.can_see_user(public.current_profile_id(), author_id))
  );

-- DMs: first message = request; further messages only after acceptance
CREATE OR REPLACE FUNCTION public.dm_allowed(_sender uuid, _recipient uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.can_send_dm(_sender, _recipient) AND (
    public.chat_request_status(_sender, _recipient) = 'accepted'
    OR EXISTS (SELECT 1 FROM public.direct_messages d
               WHERE d.status = 'accepted'
                 AND ((d.sender_id = _sender AND d.recipient_id = _recipient)
                   OR (d.sender_id = _recipient AND d.recipient_id = _sender)))
    OR NOT EXISTS (SELECT 1 FROM public.direct_messages d
                   WHERE d.sender_id = _sender AND d.recipient_id = _recipient)
  )
$$;

DROP POLICY "Users can send DMs respecting privacy" ON public.direct_messages;
CREATE POLICY "Users can send DMs respecting privacy" ON public.direct_messages FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND sender_id IN (SELECT profiles.id FROM public.profiles WHERE profiles.user_id = auth.uid())
    AND public.dm_allowed(sender_id, recipient_id)
  );

-- Reports: admin access
CREATE POLICY "Admins view all reports" ON public.reports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.admin_resolve_report(_report_id uuid, _status public.report_status)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.reports SET status = _status, reviewed_at = now() WHERE id = _report_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_hide_post(_post_id uuid, _report_id uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.posts SET deleted_at = now() WHERE id = _post_id;
  IF _report_id IS NOT NULL THEN
    UPDATE public.reports SET status = 'actioned', reviewed_at = now() WHERE id = _report_id;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.admin_get_post(_post_id uuid)
RETURNS TABLE(id uuid, caption text, media_url text, author_id uuid, deleted_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY SELECT p.id, p.caption, p.media_url, p.author_id, p.deleted_at FROM public.posts p WHERE p.id = _post_id;
END $$;

REVOKE ALL ON FUNCTION public.admin_resolve_report(uuid, public.report_status) FROM public, anon;
REVOKE ALL ON FUNCTION public.admin_hide_post(uuid, uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.admin_get_post(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_resolve_report(uuid, public.report_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_hide_post(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_post(uuid) TO authenticated;

-- Push
ALTER TABLE public.push_tokens ADD COLUMN IF NOT EXISTS last_seen timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.push_preferences
  ADD COLUMN IF NOT EXISTS event_reminders boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS messages boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS friends_going boolean NOT NULL DEFAULT true;