-- Profile bell: subscribe to an account and get a push for every new post, story, carousel and deal.
-- No frequency caps by design — users turn the bell off if it's too much.
-- Venue accounts only notify once their venue is verified (verification_status = 'approved').

-- ── 1. Who rang whose bell ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profile_subscriptions (
  subscriber_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (subscriber_id, target_id),
  CHECK (subscriber_id <> target_id)
);
CREATE INDEX IF NOT EXISTS profile_subscriptions_target_idx ON public.profile_subscriptions (target_id);
GRANT SELECT, INSERT, DELETE ON public.profile_subscriptions TO authenticated;
GRANT ALL ON public.profile_subscriptions TO service_role;
ALTER TABLE public.profile_subscriptions ENABLE ROW LEVEL SECURITY;

-- Only your own bells; nobody can see who subscribed to them.
CREATE POLICY "Own bells select" ON public.profile_subscriptions FOR SELECT TO authenticated
  USING (subscriber_id = public.current_profile_id());
CREATE POLICY "Own bells insert" ON public.profile_subscriptions FOR INSERT TO authenticated
  WITH CHECK (
    subscriber_id = public.current_profile_id()
    AND NOT public.is_blocked(subscriber_id, target_id)
    AND public.can_see_user(subscriber_id, target_id)
  );
CREATE POLICY "Own bells delete" ON public.profile_subscriptions FOR DELETE TO authenticated
  USING (subscriber_id = public.current_profile_id());

-- ── 2. May this account send bell pushes? ─────────────────────────────────────────
-- Guests: always. Venue accounts: only with an approved venue they belong to.
CREATE OR REPLACE FUNCTION public.bell_author_allowed(_profile_id uuid, _venue_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN _venue_id IS NOT NULL THEN
      EXISTS (SELECT 1 FROM public.venues v WHERE v.id = _venue_id AND v.verification_status = 'approved')
    WHEN EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = _profile_id AND public.has_role(p.user_id, 'venue_owner')
    ) THEN
      EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.venue_members m ON m.user_id = p.user_id
        JOIN public.venues v ON v.id = m.venue_id
        WHERE p.id = _profile_id AND v.verification_status = 'approved'
      )
    ELSE true
  END;
$$;

-- Recipients for a new post / story / carousel. Respects blocks and profile visibility.
CREATE OR REPLACE FUNCTION public.bell_recipients_for_post(_post_id uuid)
RETURNS TABLE(subscriber_id uuid, author_id uuid, author_name text, is_story boolean, is_venue boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT s.subscriber_id, p.author_id,
         coalesce(v.name, nullif(a.display_name, ''), a.username),
         p.expires_at IS NOT NULL,
         p.posted_as_venue_id IS NOT NULL
  FROM public.posts p
  JOIN public.profiles a ON a.id = p.author_id
  LEFT JOIN public.venues v ON v.id = p.posted_as_venue_id
  JOIN public.profile_subscriptions s ON s.target_id = p.author_id
  WHERE p.id = _post_id
    AND p.deleted_at IS NULL
    AND public.bell_author_allowed(p.author_id, p.posted_as_venue_id)
    AND NOT public.is_blocked(s.subscriber_id, p.author_id)
    AND public.can_see_user(s.subscriber_id, p.author_id);
$$;

-- Recipients for a newly published deal: everyone who rang the bell of the venue's owner account.
CREATE OR REPLACE FUNCTION public.bell_recipients_for_offer(_offer_id uuid)
RETURNS TABLE(subscriber_id uuid, venue_id uuid, venue_name text, offer_title text, display_text text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT s.subscriber_id, v.id, v.name, o.title, o.display_text
  FROM public.venue_offers o
  JOIN public.venues v ON v.id = o.venue_id
  JOIN public.profile_subscriptions s ON s.target_id = v.owner_profile_id
  WHERE o.id = _offer_id
    AND o.status IN ('scheduled', 'active')
    AND o.ends_at > now()
    AND v.owner_profile_id IS NOT NULL
    AND public.bell_author_allowed(v.owner_profile_id, v.id)
    AND NOT public.is_blocked(s.subscriber_id, v.owner_profile_id);
$$;

REVOKE ALL ON FUNCTION public.bell_author_allowed(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bell_recipients_for_post(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bell_recipients_for_offer(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bell_author_allowed(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.bell_recipients_for_post(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.bell_recipients_for_offer(uuid) TO service_role;

-- ── 3. A deal going live is queued for the outbox processor (same path as posts) ──
CREATE OR REPLACE FUNCTION public.emit_offer_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status IN ('scheduled', 'active')
     AND (TG_OP = 'INSERT' OR OLD.status NOT IN ('scheduled', 'active')) THEN
    INSERT INTO public.outbox_events (event_type, payload)
    VALUES ('offer_published', jsonb_build_object('offer_id', NEW.id, 'venue_id', NEW.venue_id));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS outbox_on_offer_published ON public.venue_offers;
CREATE TRIGGER outbox_on_offer_published
AFTER INSERT OR UPDATE OF status ON public.venue_offers
FOR EACH ROW EXECUTE FUNCTION public.emit_offer_published();

-- ── 4. In-app notification type for bell posts / deals ────────────────────────────
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'bell_post';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'bell_deal';
