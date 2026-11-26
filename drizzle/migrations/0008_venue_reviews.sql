-- Venue reviews from verified visits only.
-- A visit is proven by: a deal scanned at the venue, a "Vor Ort"-verified post at the venue,
-- or presence at a live event of the venue (location opt-in). A bare RSVP is NOT enough.
-- Each proof opens one review invitation per guest, venue and night (06:00–06:00 Europe/Berlin),
-- open for 7 days. Ratings 1–5: overall, music, service, drinks, wait time; optional text.
-- Points: same for every rating (UWG): +5 per review, +3 with text (≥ 30 chars), +5 once per
-- completed night (also when the last one is skipped). Removed reviews lose their points again.

-- ── 1. Tables ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.review_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  night date NOT NULL,
  proof_type text NOT NULL CHECK (proof_type IN ('deal', 'onsite_post', 'presence')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'skipped', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
  digest_sent_at timestamptz,
  reminded_at timestamptz,
  UNIQUE (profile_id, venue_id, night)
);
CREATE INDEX IF NOT EXISTS review_invitations_open_idx ON public.review_invitations (profile_id, status, expires_at);
GRANT SELECT ON public.review_invitations TO authenticated;
GRANT ALL ON public.review_invitations TO service_role;
ALTER TABLE public.review_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own review invitations" ON public.review_invitations FOR SELECT TO authenticated
  USING (profile_id = public.current_profile_id());

CREATE TABLE IF NOT EXISTS public.venue_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid NOT NULL UNIQUE REFERENCES public.review_invitations(id) ON DELETE CASCADE,
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  night date NOT NULL,
  proof_type text NOT NULL,
  rating_overall smallint NOT NULL CHECK (rating_overall BETWEEN 1 AND 5),
  rating_music smallint NOT NULL CHECK (rating_music BETWEEN 1 AND 5),
  rating_service smallint NOT NULL CHECK (rating_service BETWEEN 1 AND 5),
  rating_drinks smallint NOT NULL CHECK (rating_drinks BETWEEN 1 AND 5),
  rating_wait smallint NOT NULL CHECK (rating_wait BETWEEN 1 AND 5),
  comment text CHECK (comment IS NULL OR char_length(comment) <= 280),
  points_awarded integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'visible' CHECK (status IN ('visible', 'removed')),
  removed_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, venue_id, night)
);
CREATE INDEX IF NOT EXISTS venue_reviews_venue_idx ON public.venue_reviews (venue_id, status, created_at DESC);
GRANT SELECT ON public.venue_reviews TO authenticated;
GRANT ALL ON public.venue_reviews TO service_role;
ALTER TABLE public.venue_reviews ENABLE ROW LEVEL SECURITY;
-- Clients read their own rows; everything public goes through the RPCs below (no direct writes).
CREATE POLICY "Own reviews" ON public.venue_reviews FOR SELECT TO authenticated
  USING (profile_id = public.current_profile_id());

-- ── 2. Night + eligibility ────────────────────────────────────────────────────────
-- A night runs 06:00–06:00 local time, so Friday 23:00 and Saturday 03:00 are the same night.
CREATE OR REPLACE FUNCTION public.nightlife_night(_ts timestamptz)
RETURNS date LANGUAGE sql IMMUTABLE AS $$
  SELECT ((_ts AT TIME ZONE 'Europe/Berlin') - interval '6 hours')::date;
$$;

-- Guests only: no venue accounts, and never owners/members/bar staff of the venue itself.
CREATE OR REPLACE FUNCTION public.can_review_venue(_profile_id uuid, _venue_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _profile_id
      AND NOT public.has_role(p.user_id, 'venue_owner')
      AND NOT EXISTS (SELECT 1 FROM public.venues v WHERE v.id = _venue_id AND v.owner_profile_id = _profile_id)
      AND NOT EXISTS (SELECT 1 FROM public.venue_members m WHERE m.venue_id = _venue_id AND m.user_id = p.user_id)
      AND NOT EXISTS (SELECT 1 FROM public.venue_staff s WHERE s.venue_id = _venue_id AND s.user_id = p.user_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.open_review_invitation(_profile_id uuid, _venue_id uuid, _at timestamptz, _proof text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _profile_id IS NULL OR _venue_id IS NULL THEN RETURN; END IF;
  IF NOT public.can_review_venue(_profile_id, _venue_id) THEN RETURN; END IF;
  INSERT INTO public.review_invitations (profile_id, venue_id, night, proof_type)
  VALUES (_profile_id, _venue_id, public.nightlife_night(coalesce(_at, now())), _proof)
  ON CONFLICT (profile_id, venue_id, night) DO NOTHING;
END $$;

-- ── 3. Proof triggers ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.review_proof_from_redemption()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'redeemed' AND OLD.status IS DISTINCT FROM 'redeemed' THEN
    PERFORM public.open_review_invitation(
      NEW.profile_id, (SELECT o.venue_id FROM public.venue_offers o WHERE o.id = NEW.offer_id),
      coalesce(NEW.redeemed_at, now()), 'deal');
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_review_proof_redemption ON public.offer_activations;
CREATE TRIGGER trg_review_proof_redemption AFTER UPDATE OF status ON public.offer_activations
  FOR EACH ROW EXECUTE FUNCTION public.review_proof_from_redemption();

CREATE OR REPLACE FUNCTION public.review_proof_from_onsite_post()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.on_site_verified AND NOT coalesce(OLD.on_site_verified, false) AND NEW.venue_id IS NOT NULL THEN
    PERFORM public.open_review_invitation(NEW.author_id, NEW.venue_id, NEW.created_at, 'onsite_post');
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_review_proof_onsite_post ON public.posts;
CREATE TRIGGER trg_review_proof_onsite_post AFTER UPDATE OF on_site_verified ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.review_proof_from_onsite_post();

CREATE OR REPLACE FUNCTION public.review_proof_from_presence()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.open_review_invitation(
    NEW.profile_id, (SELECT e.venue_id FROM public.events e WHERE e.id = NEW.event_id), NEW.last_seen, 'presence');
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_review_proof_presence ON public.event_presence;
CREATE TRIGGER trg_review_proof_presence AFTER INSERT ON public.event_presence
  FOR EACH ROW EXECUTE FUNCTION public.review_proof_from_presence();

-- ── 4. Guest side ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.my_open_reviews()
RETURNS TABLE(invitation_id uuid, venue_id uuid, venue_name text, venue_image_url text, night date,
              proof_type text, expires_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT i.id, v.id, v.name, v.image_url, i.night, i.proof_type, i.expires_at
  FROM public.review_invitations i
  JOIN public.venues v ON v.id = i.venue_id
  WHERE i.profile_id = public.current_profile_id()
    AND i.status = 'open' AND i.expires_at > now()
  ORDER BY i.night DESC, i.created_at ASC;
$$;

CREATE OR REPLACE FUNCTION public.award_review_points(_profile_id uuid, _delta integer, _reason text, _ref uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _delta = 0 THEN RETURN; END IF;
  UPDATE public.profiles SET social_cloud_points = greatest(0, social_cloud_points + _delta) WHERE id = _profile_id;
  INSERT INTO public.point_ledger (profile_id, delta, reason, ref_type, ref_id)
  VALUES (_profile_id, _delta, _reason, 'venue_review', _ref);
END $$;

-- "Nacht komplett" (+5, once per night): nothing open left for that night and at least one review sent.
CREATE OR REPLACE FUNCTION public.award_night_bonus(_pid uuid, _night date, _ref uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.review_invitations i
             WHERE i.profile_id = _pid AND i.night = _night AND i.status = 'open' AND i.expires_at > now())
     OR NOT EXISTS (SELECT 1 FROM public.venue_reviews r WHERE r.profile_id = _pid AND r.night = _night AND r.status = 'visible')
     OR EXISTS (SELECT 1 FROM public.point_ledger l WHERE l.profile_id = _pid AND l.reason = 'review_night_complete:' || _night::text) THEN
    RETURN 0;
  END IF;
  UPDATE public.profiles SET social_cloud_points = social_cloud_points + 5 WHERE id = _pid;
  INSERT INTO public.point_ledger (profile_id, delta, reason, ref_type, ref_id)
  VALUES (_pid, 5, 'review_night_complete:' || _night::text, 'venue_review', _ref);
  RETURN 5;
END $$;

CREATE OR REPLACE FUNCTION public.submit_venue_review(
  _invitation_id uuid, _overall smallint, _music smallint, _service smallint, _drinks smallint, _wait smallint,
  _comment text DEFAULT NULL
)
RETURNS TABLE(review_id uuid, points integer, night_bonus integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _pid uuid := public.current_profile_id();
  _inv public.review_invitations;
  _text text := nullif(btrim(coalesce(_comment, '')), '');
  _points integer := 5;
  _bonus integer := 0;
  _rid uuid;
BEGIN
  IF _pid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO _inv FROM public.review_invitations WHERE id = _invitation_id FOR UPDATE;
  IF _inv.id IS NULL OR _inv.profile_id <> _pid THEN RAISE EXCEPTION 'review_not_found'; END IF;
  IF _inv.status <> 'open' OR _inv.expires_at <= now() THEN RAISE EXCEPTION 'review_closed'; END IF;
  IF _text IS NOT NULL AND char_length(_text) > 280 THEN RAISE EXCEPTION 'comment_too_long'; END IF;
  IF _text IS NOT NULL AND char_length(_text) >= 30 THEN _points := _points + 3; END IF;

  INSERT INTO public.venue_reviews (invitation_id, venue_id, profile_id, night, proof_type,
    rating_overall, rating_music, rating_service, rating_drinks, rating_wait, comment, points_awarded)
  VALUES (_inv.id, _inv.venue_id, _pid, _inv.night, _inv.proof_type,
    _overall, _music, _service, _drinks, _wait, _text, _points)
  RETURNING id INTO _rid;
  UPDATE public.review_invitations SET status = 'done' WHERE id = _inv.id;
  PERFORM public.award_review_points(_pid, _points, 'review_created', _rid);

  _bonus := public.award_night_bonus(_pid, _inv.night, _rid);

  RETURN QUERY SELECT _rid, _points, _bonus;
END $$;

CREATE OR REPLACE FUNCTION public.skip_venue_review(_invitation_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _pid uuid := public.current_profile_id(); _night date;
BEGIN
  UPDATE public.review_invitations SET status = 'skipped'
  WHERE id = _invitation_id AND profile_id = _pid AND status = 'open'
  RETURNING night INTO _night;
  IF _night IS NULL THEN RETURN 0; END IF;
  -- Skipping the last open venue of a night still completes it (bonus only if something was rated).
  RETURN public.award_night_bonus(_pid, _night, _invitation_id);
END $$;

-- ── 5. Public side ────────────────────────────────────────────────────────────────
-- Recent reviews weigh more: last 6 months count fully, older ones half, older than 2 years not at all.
-- Averages are only published from 5 reviews on ("Neu" before), so two early ratings can't sink a venue.
CREATE OR REPLACE FUNCTION public.venue_rating_summary(_venue_id uuid)
RETURNS TABLE(review_count integer, avg_overall numeric, avg_music numeric, avg_service numeric,
              avg_drinks numeric, avg_wait numeric, dist_1 integer, dist_2 integer, dist_3 integer,
              dist_4 integer, dist_5 integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH r AS (
    SELECT *, CASE WHEN created_at > now() - interval '6 months' THEN 1.0 ELSE 0.5 END AS w
    FROM public.venue_reviews
    WHERE venue_id = _venue_id AND status = 'visible' AND created_at > now() - interval '2 years'
  ), agg AS (
    SELECT count(*)::int AS n,
      round(sum(rating_overall * w) / nullif(sum(w), 0), 1) AS o,
      round(sum(rating_music * w) / nullif(sum(w), 0), 1) AS m,
      round(sum(rating_service * w) / nullif(sum(w), 0), 1) AS s,
      round(sum(rating_drinks * w) / nullif(sum(w), 0), 1) AS d,
      round(sum(rating_wait * w) / nullif(sum(w), 0), 1) AS wt,
      count(*) FILTER (WHERE rating_overall = 1)::int AS d1, count(*) FILTER (WHERE rating_overall = 2)::int AS d2,
      count(*) FILTER (WHERE rating_overall = 3)::int AS d3, count(*) FILTER (WHERE rating_overall = 4)::int AS d4,
      count(*) FILTER (WHERE rating_overall = 5)::int AS d5
    FROM r
  )
  SELECT n,
    CASE WHEN n >= 5 THEN o END, CASE WHEN n >= 5 THEN m END, CASE WHEN n >= 5 THEN s END,
    CASE WHEN n >= 5 THEN d END, CASE WHEN n >= 5 THEN wt END,
    d1, d2, d3, d4, d5
  FROM agg;
$$;

CREATE OR REPLACE FUNCTION public.venue_reviews_list(_venue_id uuid, _limit integer DEFAULT 20, _before timestamptz DEFAULT NULL)
RETURNS TABLE(review_id uuid, rating_overall smallint, rating_music smallint, rating_service smallint,
              rating_drinks smallint, rating_wait smallint, comment text, proof_type text, night date,
              created_at timestamptz, author_username text, author_display_name text, author_avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.id, r.rating_overall, r.rating_music, r.rating_service, r.rating_drinks, r.rating_wait,
         r.comment, r.proof_type, r.night, r.created_at, p.username, p.display_name, p.avatar_url
  FROM public.venue_reviews r
  JOIN public.profiles p ON p.id = r.profile_id
  WHERE r.venue_id = _venue_id AND r.status = 'visible'
    AND (_before IS NULL OR r.created_at < _before)
    AND (public.current_profile_id() IS NULL OR NOT public.is_blocked(public.current_profile_id(), r.profile_id))
  ORDER BY r.created_at DESC
  LIMIT least(greatest(coalesce(_limit, 20), 1), 50);
$$;

-- Moderation (admins): hide a review and take its points back.
CREATE OR REPLACE FUNCTION public.admin_remove_review(_review_id uuid, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _r public.venue_reviews;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO _r FROM public.venue_reviews WHERE id = _review_id FOR UPDATE;
  IF _r.id IS NULL OR _r.status = 'removed' THEN RETURN; END IF;
  UPDATE public.venue_reviews SET status = 'removed', removed_reason = left(_reason, 200) WHERE id = _r.id;
  PERFORM public.award_review_points(_r.profile_id, -_r.points_awarded, 'review_removed', _r.id);
END $$;

-- ── 6. Daily digest, reminder, expiry (pg_cron) ───────────────────────────────────
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'review_request';

-- One bundled notification + push per person (never one per venue), next day at noon;
-- one reminder after 3 days; invitations expire silently after 7 days.
CREATE OR REPLACE FUNCTION public.send_review_digests()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; _sent integer := 0;
BEGIN
  UPDATE public.review_invitations SET status = 'expired' WHERE status = 'open' AND expires_at <= now();

  FOR r IN
    SELECT profile_id, count(*)::int AS n,
           bool_or(digest_sent_at IS NULL) AS is_new,
           array_agg(id) AS ids
    FROM public.review_invitations
    WHERE status = 'open' AND expires_at > now()
      AND (digest_sent_at IS NULL
           OR (reminded_at IS NULL AND created_at <= now() - interval '3 days'))
    GROUP BY profile_id
  LOOP
    INSERT INTO public.notifications (recipient_id, type, ref_type, title, body)
    VALUES (r.profile_id, 'review_request', 'reviews',
      CASE WHEN r.is_new
        THEN CASE WHEN r.n = 1 THEN 'Wie war dein Abend? 🌙' ELSE 'Du warst in ' || r.n || ' Spots 🌙 Wie war''s?' END
        ELSE 'Noch ' || r.n || ' Bewertung' || CASE WHEN r.n = 1 THEN '' ELSE 'en' END || ' offen' END,
      'Bewerte deine Spots und hol dir bis zu ' || (r.n * 8 + 5) || ' Punkte.');
    INSERT INTO public.outbox_events (event_type, payload)
    VALUES ('review_digest', jsonb_build_object('profile_id', r.profile_id, 'count', r.n, 'is_reminder', NOT r.is_new));
    UPDATE public.review_invitations
    SET digest_sent_at = coalesce(digest_sent_at, now()),
        reminded_at = CASE WHEN digest_sent_at IS NOT NULL THEN now() ELSE reminded_at END
    WHERE id = ANY (r.ids);
    _sent := _sent + 1;
  END LOOP;
  RETURN _sent;
END $$;

DO $$
BEGIN
  BEGIN PERFORM cron.unschedule('venue-review-digest'); EXCEPTION WHEN OTHERS THEN NULL; END;
  -- 11:00 UTC = 12:00 Berlin in winter (13:00 in summer).
  PERFORM cron.schedule('venue-review-digest', '0 11 * * *', 'SELECT public.send_review_digests();');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron not available, review digest not scheduled: %', SQLERRM;
END $$;

-- ── Grants ────────────────────────────────────────────────────────────────────────
DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'public.my_open_reviews()',
    'public.submit_venue_review(uuid, smallint, smallint, smallint, smallint, smallint, text)',
    'public.skip_venue_review(uuid)',
    'public.admin_remove_review(uuid, text)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f);
  END LOOP;
  FOREACH f IN ARRAY ARRAY['public.venue_rating_summary(uuid)', 'public.venue_reviews_list(uuid, integer, timestamptz)'] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon, authenticated', f);
  END LOOP;
  FOREACH f IN ARRAY ARRAY[
    'public.can_review_venue(uuid, uuid)', 'public.open_review_invitation(uuid, uuid, timestamptz, text)',
    'public.award_review_points(uuid, integer, text, uuid)', 'public.award_night_bonus(uuid, date, uuid)',
    'public.send_review_digests()'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f);
  END LOOP;
END $$;
