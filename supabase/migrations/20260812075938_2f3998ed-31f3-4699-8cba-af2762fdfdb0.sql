-- ============ CARD POOL ============
CREATE TABLE public.card_pool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('normal','deep','flirty')),
  prompt text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  min_age_for_flirty integer DEFAULT 18,
  sort_priority integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.card_pool TO authenticated;
GRANT ALL ON public.card_pool TO service_role;
ALTER TABLE public.card_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY "card_pool_read" ON public.card_pool FOR SELECT TO authenticated USING (is_active = true);

-- ============ USER CARD SETS ============
CREATE TABLE public.user_card_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assignment_version text NOT NULL DEFAULT 'v1',
  assigned_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id)
);
GRANT SELECT ON public.user_card_sets TO authenticated;
GRANT ALL ON public.user_card_sets TO service_role;
ALTER TABLE public.user_card_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_card_sets_own" ON public.user_card_sets FOR SELECT TO authenticated
  USING (profile_id = public.current_profile_id());

CREATE TABLE public.user_card_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.card_pool(id) ON DELETE CASCADE,
  assignment_version text NOT NULL DEFAULT 'v1',
  position integer NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, assignment_version, card_id),
  UNIQUE (profile_id, assignment_version, position)
);
GRANT SELECT ON public.user_card_assignments TO authenticated;
GRANT ALL ON public.user_card_assignments TO service_role;
ALTER TABLE public.user_card_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_card_assignments_own" ON public.user_card_assignments FOR SELECT TO authenticated
  USING (profile_id = public.current_profile_id());

-- ============ SENDS ============
CREATE TABLE public.card_send_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','answered','skipped','expired','reported','blocked')),
  message text,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  venue_id uuid REFERENCES public.venues(id) ON DELETE SET NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (sender_id <> recipient_id)
);
CREATE INDEX idx_card_batches_recipient ON public.card_send_batches (recipient_id, sent_at DESC);
CREATE INDEX idx_card_batches_sender ON public.card_send_batches (sender_id, sent_at DESC);
GRANT SELECT, UPDATE ON public.card_send_batches TO authenticated;
GRANT ALL ON public.card_send_batches TO service_role;
ALTER TABLE public.card_send_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "card_send_batches_participants" ON public.card_send_batches FOR SELECT TO authenticated
  USING (sender_id = public.current_profile_id() OR recipient_id = public.current_profile_id());
CREATE POLICY "card_send_batches_recipient_update" ON public.card_send_batches FOR UPDATE TO authenticated
  USING (recipient_id = public.current_profile_id())
  WITH CHECK (recipient_id = public.current_profile_id());

CREATE TABLE public.card_send_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.card_send_batches(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.card_pool(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (batch_id, card_id)
);
GRANT SELECT ON public.card_send_items TO authenticated;
GRANT ALL ON public.card_send_items TO service_role;
ALTER TABLE public.card_send_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "card_send_items_participants" ON public.card_send_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.card_send_batches b
    WHERE b.id = batch_id
      AND (b.sender_id = public.current_profile_id() OR b.recipient_id = public.current_profile_id())
  ));

-- ============ ANSWERS ============
CREATE TABLE public.card_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.card_send_batches(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.card_pool(id) ON DELETE CASCADE,
  responder_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  answer_text text NOT NULL CHECK (char_length(answer_text) BETWEEN 1 AND 500),
  visibility text NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private','shared_with_sender','shared_as_post')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (batch_id, card_id)
);
GRANT SELECT ON public.card_answers TO authenticated;
GRANT ALL ON public.card_answers TO service_role;
ALTER TABLE public.card_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "card_answers_participants" ON public.card_answers FOR SELECT TO authenticated
  USING (
    responder_id = public.current_profile_id()
    OR EXISTS (
      SELECT 1 FROM public.card_send_batches b
      WHERE b.id = batch_id AND b.sender_id = public.current_profile_id()
    )
  );

-- ============ INTERACTIONS ============
CREATE TABLE public.card_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES public.card_send_batches(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('opened','sent','accepted','skipped','answered','reported','blocked')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.card_interactions TO authenticated;
GRANT ALL ON public.card_interactions TO service_role;
ALTER TABLE public.card_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "card_interactions_own_select" ON public.card_interactions FOR SELECT TO authenticated
  USING (profile_id = public.current_profile_id());
CREATE POLICY "card_interactions_own_insert" ON public.card_interactions FOR INSERT TO authenticated
  WITH CHECK (profile_id = public.current_profile_id());

-- ============ REPORTS ============
CREATE TABLE public.card_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_batch_id uuid NOT NULL REFERENCES public.card_send_batches(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('inappropriate','harassment','sexual','hate_speech','spam','threat','other')),
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.card_reports TO authenticated;
GRANT ALL ON public.card_reports TO service_role;
ALTER TABLE public.card_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "card_reports_own_select" ON public.card_reports FOR SELECT TO authenticated
  USING (reporter_id = public.current_profile_id());
CREATE POLICY "card_reports_own_insert" ON public.card_reports FOR INSERT TO authenticated
  WITH CHECK (
    reporter_id = public.current_profile_id()
    AND EXISTS (
      SELECT 1 FROM public.card_send_batches b
      WHERE b.id = reported_batch_id AND b.recipient_id = public.current_profile_id()
    )
  );

-- updated_at triggers
CREATE TRIGGER trg_card_pool_updated BEFORE UPDATE ON public.card_pool
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_card_batches_updated BEFORE UPDATE ON public.card_send_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_card_answers_updated BEFORE UPDATE ON public.card_answers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SOCIAL CLOUD: extend reason map ============
CREATE OR REPLACE FUNCTION public.award_social_cloud(_reason text, _ref_type text DEFAULT NULL::text, _ref_id uuid DEFAULT NULL::uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    WHEN 'cards_first_sent'         THEN 5
    WHEN 'cards_first_answered'     THEN 10
    WHEN 'cards_event_linked'       THEN 10
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
$function$;

-- Award a reason only once per profile (regardless of ref)
CREATE OR REPLACE FUNCTION public.award_social_cloud_once(_reason text, _ref_type text DEFAULT NULL, _ref_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _profile uuid;
BEGIN
  _profile := public.current_profile_id();
  IF _profile IS NULL THEN RETURN 0; END IF;
  IF EXISTS (SELECT 1 FROM public.point_ledger WHERE profile_id = _profile AND reason = _reason) THEN
    RETURN 0;
  END IF;
  RETURN public.award_social_cloud(_reason, _ref_type, _ref_id);
END;
$$;

-- ============ ASSIGNMENT ============
CREATE OR REPLACE FUNCTION public.assign_user_cards(_assignment_version text DEFAULT 'v1')
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _profile uuid;
  _set_id uuid;
  _allow_flirty boolean;
  _age integer;
  _cards uuid[];
BEGIN
  _profile := public.current_profile_id();
  IF _profile IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO _set_id FROM public.user_card_sets WHERE profile_id = _profile;
  IF _set_id IS NOT NULL THEN
    RETURN _set_id;
  END IF;

  SELECT COALESCE(
           CASE WHEN p.birthdate IS NOT NULL
                THEN EXTRACT(YEAR FROM age(p.birthdate))::int
                ELSE p.age END, 0)
    INTO _age
  FROM public.profiles p WHERE p.id = _profile;
  _allow_flirty := COALESCE(_age, 0) >= 18;

  SELECT array_agg(id) INTO _cards FROM (
    (SELECT id FROM public.card_pool WHERE is_active AND category = 'normal' ORDER BY random() LIMIT 10)
    UNION ALL
    (SELECT id FROM public.card_pool WHERE is_active AND category = 'deep' ORDER BY random() LIMIT 6)
    UNION ALL
    (SELECT id FROM public.card_pool
      WHERE is_active AND category = CASE WHEN _allow_flirty THEN 'flirty' ELSE 'normal' END
        AND id <> ALL (COALESCE(_cards, ARRAY[]::uuid[]))
      ORDER BY random() LIMIT 4)
  ) picked;

  -- top up to 20 if the pool ran short
  IF coalesce(array_length(_cards, 1), 0) < 20 THEN
    SELECT _cards || COALESCE(array_agg(id), ARRAY[]::uuid[]) INTO _cards FROM (
      SELECT id FROM public.card_pool
      WHERE is_active
        AND (_allow_flirty OR category <> 'flirty')
        AND id <> ALL (COALESCE(_cards, ARRAY[]::uuid[]))
      ORDER BY random()
      LIMIT (20 - coalesce(array_length(_cards, 1), 0))
    ) extra;
  END IF;

  INSERT INTO public.user_card_sets (profile_id, assignment_version)
  VALUES (_profile, _assignment_version)
  ON CONFLICT (profile_id) DO NOTHING
  RETURNING id INTO _set_id;

  IF _set_id IS NULL THEN
    SELECT id INTO _set_id FROM public.user_card_sets WHERE profile_id = _profile;
    RETURN _set_id;
  END IF;

  INSERT INTO public.user_card_assignments (profile_id, card_id, assignment_version, position)
  SELECT _profile, c.card_id, _assignment_version, c.ord
  FROM unnest(_cards) WITH ORDINALITY AS c(card_id, ord)
  ON CONFLICT DO NOTHING;

  RETURN _set_id;
END;
$$;

-- ============ RATE LIMIT + SEND ============
CREATE OR REPLACE FUNCTION public.send_card_batch(
  _recipient_id uuid,
  _card_ids uuid[],
  _message text DEFAULT NULL,
  _event_id uuid DEFAULT NULL,
  _venue_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _sender uuid;
  _batch uuid;
  _hour int;
  _day int;
  _valid int;
BEGIN
  _sender := public.current_profile_id();
  IF _sender IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _recipient_id = _sender THEN RAISE EXCEPTION 'Du kannst dir selbst keine Karten senden.'; END IF;
  IF _card_ids IS NULL OR array_length(_card_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Bitte wähle mindestens eine Karte.';
  END IF;
  IF array_length(_card_ids, 1) > 5 THEN
    RAISE EXCEPTION 'Maximal 5 Karten pro Sendung.';
  END IF;

  IF public.is_blocked(_sender, _recipient_id) THEN
    RAISE EXCEPTION 'Diese Person kann keine Karten von dir erhalten.';
  END IF;

  SELECT count(*) INTO _valid FROM public.user_card_assignments
   WHERE profile_id = _sender AND card_id = ANY(_card_ids);
  IF _valid <> array_length(_card_ids, 1) THEN
    RAISE EXCEPTION 'Ungültige Kartenauswahl.';
  END IF;

  SELECT count(*) INTO _hour FROM public.card_send_batches
   WHERE sender_id = _sender AND sent_at > now() - interval '1 hour';
  IF _hour >= 20 THEN RAISE EXCEPTION 'Du hast das Stunden-Limit erreicht.'; END IF;

  SELECT count(*) INTO _day FROM public.card_send_batches
   WHERE sender_id = _sender AND sent_at > now() - interval '1 day';
  IF _day >= 50 THEN RAISE EXCEPTION 'Du hast das Tages-Limit erreicht.'; END IF;

  INSERT INTO public.card_send_batches (sender_id, recipient_id, message, event_id, venue_id)
  VALUES (_sender, _recipient_id, nullif(btrim(coalesce(_message, '')), ''), _event_id, _venue_id)
  RETURNING id INTO _batch;

  INSERT INTO public.card_send_items (batch_id, card_id)
  SELECT _batch, cid FROM unnest(_card_ids) AS cid
  ON CONFLICT DO NOTHING;

  INSERT INTO public.card_interactions (batch_id, profile_id, action)
  VALUES (_batch, _sender, 'sent');

  PERFORM public.award_social_cloud_once('cards_first_sent', 'card_batch', _batch);
  IF _event_id IS NOT NULL THEN
    PERFORM public.award_social_cloud_once('cards_event_linked', 'event', _event_id);
  END IF;

  RETURN _batch;
END;
$$;

-- ============ ANSWER ============
CREATE OR REPLACE FUNCTION public.answer_card(
  _batch_id uuid,
  _card_id uuid,
  _answer_text text,
  _visibility text DEFAULT 'private'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _me uuid;
  _answer uuid;
  _status text;
BEGIN
  _me := public.current_profile_id();
  IF _me IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT status INTO _status FROM public.card_send_batches
   WHERE id = _batch_id AND recipient_id = _me;
  IF _status IS NULL THEN RAISE EXCEPTION 'Karte nicht gefunden.'; END IF;
  IF _status IN ('blocked','reported','expired') THEN
    RAISE EXCEPTION 'Diese Karten können nicht mehr beantwortet werden.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.card_send_items WHERE batch_id = _batch_id AND card_id = _card_id) THEN
    RAISE EXCEPTION 'Karte gehört nicht zu dieser Sendung.';
  END IF;

  INSERT INTO public.card_answers (batch_id, card_id, responder_id, answer_text, visibility)
  VALUES (_batch_id, _card_id, _me, btrim(_answer_text), coalesce(_visibility, 'private'))
  ON CONFLICT (batch_id, card_id) DO UPDATE
    SET answer_text = excluded.answer_text,
        visibility = excluded.visibility,
        updated_at = now()
  RETURNING id INTO _answer;

  UPDATE public.card_send_batches
     SET status = 'answered', responded_at = now()
   WHERE id = _batch_id;

  INSERT INTO public.card_interactions (batch_id, profile_id, action)
  VALUES (_batch_id, _me, 'answered');

  PERFORM public.award_social_cloud_once('cards_first_answered', 'card_batch', _batch_id);

  RETURN _answer;
END;
$$;

-- ============ REPORT / BLOCK HELPERS ============
CREATE OR REPLACE FUNCTION public.report_card_batch(_batch_id uuid, _reason text, _details text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _me uuid;
BEGIN
  _me := public.current_profile_id();
  IF _me IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.card_send_batches WHERE id = _batch_id AND recipient_id = _me) THEN
    RAISE EXCEPTION 'Karte nicht gefunden.';
  END IF;

  INSERT INTO public.card_reports (reporter_id, reported_batch_id, reason, details)
  VALUES (_me, _batch_id, _reason, nullif(btrim(coalesce(_details, '')), ''));

  UPDATE public.card_send_batches SET status = 'reported' WHERE id = _batch_id;

  INSERT INTO public.card_interactions (batch_id, profile_id, action)
  VALUES (_batch_id, _me, 'reported');
END;
$$;

-- When a block happens, hide pending card batches in both directions
CREATE OR REPLACE FUNCTION public.handle_block_cards_cleanup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.card_send_batches
     SET status = 'blocked'
   WHERE status IN ('pending','accepted')
     AND (
       (sender_id = NEW.blocker_id AND recipient_id = NEW.blocked_id)
       OR (sender_id = NEW.blocked_id AND recipient_id = NEW.blocker_id)
     );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_blocks_cards_cleanup
AFTER INSERT ON public.blocks
FOR EACH ROW EXECUTE FUNCTION public.handle_block_cards_cleanup();

-- ============ SEED: 60 CARDS ============
INSERT INTO public.card_pool (category, prompt) VALUES
('normal','Welche Musik bringt dich sofort auf die Tanzfläche?'),
('normal','Was war dein spontanster Abend?'),
('normal','Welcher Song gehört für dich zu einer perfekten Nacht?'),
('normal','Bist du eher die erste Person auf der Tanzfläche oder die letzte, die geht?'),
('normal','Was darf bei einem guten Abend niemals fehlen?'),
('normal','Was ist dein Lieblingsgetränk?'),
('normal','Was machst du am liebsten am Wochenende?'),
('normal','Welchem Sportteam drückst du die Daumen?'),
('normal','Was ist dein Traum-Reiseziel?'),
('normal','Welches Restaurant in deiner Stadt empfiehlst du immer?'),
('normal','Welcher Ort in deiner Stadt ist total unterschätzt?'),
('normal','Frühaufsteher oder Nachtmensch?'),
('normal','Welche Serie schaust du gerade?'),
('normal','Was ist dein Go-to-Song im Auto?'),
('normal','Festival oder Club?'),
('normal','Was ist dein bestes Konzert-Erlebnis?'),
('normal','Kochst du gern oder bestellst du lieber?'),
('normal','Welches Emoji benutzt du am häufigsten?'),
('normal','Was war deine letzte spontane Entscheidung?'),
('normal','Womit kann man dich am schnellsten zum Lachen bringen?'),
('normal','Welchen Film kannst du immer wieder schauen?'),
('normal','Was steht als Nächstes auf deiner To-do-Liste?'),
('normal','Kaffee, Matcha oder gar nichts?'),
('normal','Was ist dein liebster Sommer-Move?'),
('normal','Strand, Berge oder Stadt?'),
('normal','Was ist dein absolutes Comfort Food?'),
('normal','Playlist oder Radio?'),
('normal','Welches Hobby würdest du gern neu anfangen?'),
('normal','Was war dein schönster Moment dieses Jahr?'),
('normal','Welche App öffnest du morgens zuerst?'),
('deep','Was möchtest du dieses Jahr unbedingt noch erleben?'),
('deep','Woran merkst du, dass du dich bei jemandem wohlfühlst?'),
('deep','Welche Erfahrung hat dich nachhaltig verändert?'),
('deep','Was bedeutet für dich ein wirklich guter Abend?'),
('deep','Was würdest du gerne öfter ausprobieren?'),
('deep','Welche Lektion hat dich am meisten geprägt?'),
('deep','Wofür bist du gerade dankbar?'),
('deep','Was gibt dir Energie, wenn alles zu viel wird?'),
('deep','Welchen Rat würdest du deinem jüngeren Ich geben?'),
('deep','Was schätzt du an deinen engsten Freund:innen am meisten?'),
('deep','Wann hast du dich zuletzt richtig frei gefühlt?'),
('deep','Was möchtest du in fünf Jahren über dich sagen können?'),
('deep','Was fällt dir schwerer: loslassen oder anfangen?'),
('deep','Welcher Ort fühlt sich für dich wie Zuhause an?'),
('deep','Was ist eine Meinung, die du geändert hast?'),
('deep','Wann warst du zuletzt richtig stolz auf dich?'),
('deep','Was brauchst du, um dich sicher zu fühlen?'),
('deep','Welche Angst würdest du gern überwinden?'),
('flirty','Was macht jemanden für dich sofort interessant?'),
('flirty','Was ist für dich ein gutes Zeichen beim Kennenlernen?'),
('flirty','Was wäre für dich ein perfekter spontaner Abend zu zweit?'),
('flirty','Welche Art von Kompliment bleibt dir im Kopf?'),
('flirty','Erster Eindruck oder zweiter Blick?'),
('flirty','Was ist dein liebster Weg, jemanden anzusprechen?'),
('flirty','Was findest du an Menschen unwiderstehlich charmant?'),
('flirty','Tanzen oder reden – was verrät mehr über jemanden?'),
('flirty','Was ist deine grüne Flagge bei anderen?'),
('flirty','Was wäre dein ideales erstes Date?'),
('flirty','Welcher Song beschreibt dein Flirt-Game?'),
('flirty','Was bringt dich zum Schmunzeln, wenn jemand es tut?');
