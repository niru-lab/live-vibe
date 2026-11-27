-- Reviews, part 2: reporting + public replies by the venue.
-- * Reviews are reported through the existing `reports` table (target_type 'review').
-- * Fair auto-protection: once 3 different GUESTS report a review, only its TEXT is hidden until an
--   admin decides — the stars stay. Reports by the venue itself (owner, members, bar staff, any venue
--   account) never auto-hide anything; they only land in the admin queue.
-- * Venues (owner/members, not bar staff) can publicly reply once per review and edit/delete the reply.
--   The reviewer gets an in-app notification.

-- ── 1. Enum values (only used inside function bodies below, so safe in one transaction) ──
ALTER TYPE public.report_target ADD VALUE IF NOT EXISTS 'review';
ALTER TYPE public.report_reason ADD VALUE IF NOT EXISTS 'fake';
ALTER TYPE public.report_reason ADD VALUE IF NOT EXISTS 'personal_data';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'review_reply';

-- ── 2. Review columns ─────────────────────────────────────────────────────────────
ALTER TABLE public.venue_reviews
  ADD COLUMN IF NOT EXISTS comment_hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reply_text text,
  ADD COLUMN IF NOT EXISTS reply_at timestamptz,
  ADD COLUMN IF NOT EXISTS replied_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.venue_reviews DROP CONSTRAINT IF EXISTS venue_reviews_reply_len;
ALTER TABLE public.venue_reviews ADD CONSTRAINT venue_reviews_reply_len
  CHECK (reply_text IS NULL OR char_length(reply_text) BETWEEN 1 AND 500);

-- ── 3. Auto-hide the text after 3 guest reports ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.review_report_counts_as_guest(_reporter uuid, _venue_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  -- Same rule as "who may review": venue accounts and the venue's own people don't count.
  SELECT public.can_review_venue(_reporter, _venue_id);
$$;

CREATE OR REPLACE FUNCTION public.on_review_reported()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _venue uuid; _guest_reports integer;
BEGIN
  IF NEW.target_type::text <> 'review' THEN RETURN NEW; END IF;
  SELECT venue_id INTO _venue FROM public.venue_reviews WHERE id = NEW.target_id;
  IF _venue IS NULL THEN RETURN NEW; END IF;
  SELECT count(DISTINCT r.reporter_id) INTO _guest_reports
  FROM public.reports r
  WHERE r.target_type::text = 'review' AND r.target_id = NEW.target_id AND r.status::text = 'pending'
    AND public.review_report_counts_as_guest(r.reporter_id, _venue);
  IF _guest_reports >= 3 THEN
    UPDATE public.venue_reviews SET comment_hidden = true WHERE id = NEW.target_id AND comment IS NOT NULL;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_on_review_reported ON public.reports;
CREATE TRIGGER trg_on_review_reported AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.on_review_reported();

-- ── 4. Venue replies ──────────────────────────────────────────────────────────────
-- Empty text deletes the reply. Only the venue owner/members (not scan-only bar staff).
CREATE OR REPLACE FUNCTION public.reply_to_review(_review_id uuid, _text text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _r public.venue_reviews; _t text := nullif(btrim(coalesce(_text, '')), ''); _first boolean;
BEGIN
  SELECT * INTO _r FROM public.venue_reviews WHERE id = _review_id AND status = 'visible' FOR UPDATE;
  IF _r.id IS NULL THEN RAISE EXCEPTION 'review_not_found'; END IF;
  IF NOT public.is_venue_member(_r.venue_id) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _t IS NOT NULL AND char_length(_t) > 500 THEN RAISE EXCEPTION 'reply_too_long'; END IF;
  _first := _r.reply_text IS NULL;
  UPDATE public.venue_reviews
  SET reply_text = _t, reply_at = CASE WHEN _t IS NULL THEN NULL ELSE now() END,
      replied_by = CASE WHEN _t IS NULL THEN NULL ELSE public.current_profile_id() END
  WHERE id = _r.id;
  IF _t IS NOT NULL AND _first THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, ref_type, ref_id, title, body)
    SELECT _r.profile_id, public.current_profile_id(), 'review_reply', 'venue', _r.venue_id,
           v.name || ' hat auf deine Bewertung geantwortet', left(_t, 120)
    FROM public.venues v WHERE v.id = _r.venue_id;
  END IF;
END $$;

-- ── 5. Public list: hidden texts stay hidden, replies included ────────────────────
DROP FUNCTION IF EXISTS public.venue_reviews_list(uuid, integer, timestamptz);
CREATE FUNCTION public.venue_reviews_list(_venue_id uuid, _limit integer DEFAULT 20, _before timestamptz DEFAULT NULL)
RETURNS TABLE(review_id uuid, rating_overall smallint, rating_music smallint, rating_service smallint,
              rating_drinks smallint, rating_wait smallint, comment text, comment_hidden boolean, proof_type text,
              night date, created_at timestamptz, author_profile_id uuid, author_username text,
              author_display_name text, author_avatar_url text, reply_text text, reply_at timestamptz,
              can_reply boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.id, r.rating_overall, r.rating_music, r.rating_service, r.rating_drinks, r.rating_wait,
         CASE WHEN r.comment_hidden THEN NULL ELSE r.comment END, r.comment_hidden,
         r.proof_type, r.night, r.created_at, r.profile_id, p.username, p.display_name, p.avatar_url,
         r.reply_text, r.reply_at,
         (public.current_profile_id() IS NOT NULL AND public.is_venue_member(r.venue_id))
  FROM public.venue_reviews r
  JOIN public.profiles p ON p.id = r.profile_id
  WHERE r.venue_id = _venue_id AND r.status = 'visible'
    AND (_before IS NULL OR r.created_at < _before)
    AND (public.current_profile_id() IS NULL OR NOT public.is_blocked(public.current_profile_id(), r.profile_id))
  ORDER BY r.created_at DESC
  LIMIT least(greatest(coalesce(_limit, 20), 1), 50);
$$;

-- ── 6. Admin ──────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_reviews_by_ids(_ids uuid[])
RETURNS TABLE(review_id uuid, venue_id uuid, venue_name text, author_username text, rating_overall smallint,
              comment text, comment_hidden boolean, reply_text text, status text, guest_reports integer,
              venue_reports integer, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
  SELECT r.id, r.venue_id, v.name, p.username, r.rating_overall, r.comment, r.comment_hidden, r.reply_text,
         r.status,
         (SELECT count(DISTINCT x.reporter_id)::int FROM public.reports x WHERE x.target_type::text = 'review'
            AND x.target_id = r.id AND public.review_report_counts_as_guest(x.reporter_id, r.venue_id)),
         (SELECT count(DISTINCT x.reporter_id)::int FROM public.reports x WHERE x.target_type::text = 'review'
            AND x.target_id = r.id AND NOT public.review_report_counts_as_guest(x.reporter_id, r.venue_id)),
         r.created_at
  FROM public.venue_reviews r
  JOIN public.venues v ON v.id = r.venue_id
  JOIN public.profiles p ON p.id = r.profile_id
  WHERE r.id = ANY (_ids[1:200]);
END $$;

-- Remove a review (points taken back) and close all its open reports.
CREATE OR REPLACE FUNCTION public.admin_moderate_review(_review_id uuid, _action text, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _action = 'remove' THEN
    PERFORM public.admin_remove_review(_review_id, coalesce(_reason, 'Moderation'));
    UPDATE public.reports SET status = 'actioned', reviewed_at = now()
    WHERE target_type::text = 'review' AND target_id = _review_id AND status::text = 'pending';
  ELSIF _action = 'hide_text' THEN
    UPDATE public.venue_reviews SET comment_hidden = true WHERE id = _review_id;
    UPDATE public.reports SET status = 'actioned', reviewed_at = now()
    WHERE target_type::text = 'review' AND target_id = _review_id AND status::text = 'pending';
  ELSIF _action = 'keep' THEN
    -- Reports were unfounded: show the text again and close them.
    UPDATE public.venue_reviews SET comment_hidden = false WHERE id = _review_id;
    UPDATE public.reports SET status = 'dismissed', reviewed_at = now()
    WHERE target_type::text = 'review' AND target_id = _review_id AND status::text = 'pending';
  ELSE
    RAISE EXCEPTION 'unknown action';
  END IF;
END $$;

-- ── Grants ────────────────────────────────────────────────────────────────────────
REVOKE ALL ON FUNCTION public.reply_to_review(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reply_to_review(uuid, text) TO authenticated;
REVOKE ALL ON FUNCTION public.venue_reviews_list(uuid, integer, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.venue_reviews_list(uuid, integer, timestamptz) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_reviews_by_ids(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_reviews_by_ids(uuid[]) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_moderate_review(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_moderate_review(uuid, text, text) TO authenticated;
REVOKE ALL ON FUNCTION public.review_report_counts_as_guest(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_review_reported() FROM PUBLIC, anon, authenticated;
