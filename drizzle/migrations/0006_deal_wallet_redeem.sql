-- Live deals as tickets: venues post deals, guests activate them (QR + backup code in a private wallet),
-- venue owners or their bar staff scan them once on site. Every scan attempt is tracked per deal.

-- ── 1. Deal details ───────────────────────────────────────────────────────────────
ALTER TABLE public.venue_offers
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS conditions text,
  ADD COLUMN IF NOT EXISTS min_age integer;
ALTER TABLE public.venue_offers DROP CONSTRAINT IF EXISTS venue_offers_category_check;
ALTER TABLE public.venue_offers ADD CONSTRAINT venue_offers_category_check
  CHECK (category IN ('food', 'drinks', 'alcohol', 'entry', 'other'));
ALTER TABLE public.venue_offers DROP CONSTRAINT IF EXISTS venue_offers_conditions_len;
ALTER TABLE public.venue_offers ADD CONSTRAINT venue_offers_conditions_len
  CHECK (conditions IS NULL OR char_length(conditions) <= 200);
ALTER TABLE public.venue_offers DROP CONSTRAINT IF EXISTS venue_offers_min_age_check;
ALTER TABLE public.venue_offers ADD CONSTRAINT venue_offers_min_age_check
  CHECK (min_age IS NULL OR min_age BETWEEN 16 AND 21);

-- Alcohol deals are always 18+ (JuSchG / no alcohol advertising to minors) — enforced here, not in the UI.
CREATE OR REPLACE FUNCTION public.enforce_offer_age()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.category = 'alcohol' THEN NEW.min_age := greatest(coalesce(NEW.min_age, 18), 18); END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_enforce_offer_age ON public.venue_offers;
CREATE TRIGGER trg_enforce_offer_age BEFORE INSERT OR UPDATE ON public.venue_offers
  FOR EACH ROW EXECUTE FUNCTION public.enforce_offer_age();

-- Public deals: published, not over, and only for viewers old enough.
DROP POLICY IF EXISTS "Published offers are viewable" ON public.venue_offers;
CREATE POLICY "Published offers are viewable" ON public.venue_offers FOR SELECT TO anon, authenticated
  USING (status IN ('scheduled', 'active') AND ends_at > now() AND public.can_view_event_age(min_age));

-- ── 2. Bar staff: may scan deals of a venue, nothing else ─────────────────────────
-- Deliberately separate from venue_members, which also grants event editing and posting as the venue.
CREATE TABLE IF NOT EXISTS public.venue_staff (
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  added_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (venue_id, user_id)
);
GRANT SELECT ON public.venue_staff TO authenticated;
GRANT ALL ON public.venue_staff TO service_role;
ALTER TABLE public.venue_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff see own staff rows" ON public.venue_staff FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.venue_staff_invites (
  code text PRIMARY KEY,
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '48 hours',
  used_by uuid,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.venue_staff_invites TO service_role;
ALTER TABLE public.venue_staff_invites ENABLE ROW LEVEL SECURITY; -- RPC access only

CREATE OR REPLACE FUNCTION public.can_scan_venue(_venue_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_venue_member(_venue_id)
      OR EXISTS (SELECT 1 FROM public.venue_staff s WHERE s.venue_id = _venue_id AND s.user_id = auth.uid());
$$;

-- Unambiguous code alphabet (no 0/O, 1/I/L).
CREATE OR REPLACE FUNCTION public.random_code(_len integer)
RETURNS text LANGUAGE sql VOLATILE AS $$
  SELECT string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1), '')
  FROM generate_series(1, _len);
$$;

CREATE OR REPLACE FUNCTION public.create_staff_invite(_venue_id uuid)
RETURNS TABLE(code text, expires_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _code text;
BEGIN
  IF NOT public.is_venue_owner(_venue_id) THEN RAISE EXCEPTION 'only the venue owner can invite staff'; END IF;
  LOOP
    _code := public.random_code(8);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.venue_staff_invites i WHERE i.code = _code);
  END LOOP;
  INSERT INTO public.venue_staff_invites (code, venue_id, created_by) VALUES (_code, _venue_id, public.current_profile_id());
  RETURN QUERY SELECT i.code, i.expires_at FROM public.venue_staff_invites i WHERE i.code = _code;
END $$;

CREATE OR REPLACE FUNCTION public.accept_staff_invite(_code text)
RETURNS TABLE(venue_id uuid, venue_name text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _inv public.venue_staff_invites;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO _inv FROM public.venue_staff_invites i
  WHERE i.code = upper(regexp_replace(_code, '[^A-Za-z0-9]', '', 'g'))
  FOR UPDATE;
  IF _inv.code IS NULL OR _inv.used_at IS NOT NULL OR _inv.expires_at < now() THEN
    RAISE EXCEPTION 'invite invalid or expired';
  END IF;
  INSERT INTO public.venue_staff (venue_id, user_id, added_by) VALUES (_inv.venue_id, auth.uid(), _inv.created_by)
  ON CONFLICT DO NOTHING;
  UPDATE public.venue_staff_invites SET used_by = auth.uid(), used_at = now() WHERE code = _inv.code;
  RETURN QUERY SELECT v.id, v.name FROM public.venues v WHERE v.id = _inv.venue_id;
END $$;

CREATE OR REPLACE FUNCTION public.list_venue_staff(_venue_id uuid)
RETURNS TABLE(user_id uuid, profile_id uuid, username text, display_name text, avatar_url text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.user_id, p.id, p.username, p.display_name, p.avatar_url, s.created_at
  FROM public.venue_staff s LEFT JOIN public.profiles p ON p.user_id = s.user_id
  WHERE s.venue_id = _venue_id AND public.is_venue_owner(_venue_id)
  ORDER BY s.created_at;
$$;

CREATE OR REPLACE FUNCTION public.remove_venue_staff(_venue_id uuid, _user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_venue_owner(_venue_id) THEN RAISE EXCEPTION 'only the venue owner can remove staff'; END IF;
  DELETE FROM public.venue_staff WHERE venue_id = _venue_id AND user_id = _user_id;
END $$;

-- Venues the caller may scan for (owner/member or staff).
CREATE OR REPLACE FUNCTION public.my_scan_venues()
RETURNS TABLE(venue_id uuid, venue_name text, is_staff_only boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT v.id, v.name, NOT public.is_venue_member(v.id)
  FROM public.venues v
  WHERE public.can_scan_venue(v.id)
  ORDER BY v.name;
$$;

-- ── 3. Activations become wallet tickets with a QR token and a backup code ────────
ALTER TABLE public.offer_activations
  ADD COLUMN IF NOT EXISTS claim_token text,
  ADD COLUMN IF NOT EXISTS short_code text,
  ADD COLUMN IF NOT EXISTS redeemed_at timestamptz,
  ADD COLUMN IF NOT EXISTS redeemed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

UPDATE public.offer_activations SET claim_token = replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '') WHERE claim_token IS NULL;
DO $$
DECLARE r record; _c text;
BEGIN
  FOR r IN SELECT id FROM public.offer_activations WHERE short_code IS NULL LOOP
    LOOP
      _c := public.random_code(6);
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.offer_activations WHERE short_code = _c);
    END LOOP;
    UPDATE public.offer_activations SET short_code = _c WHERE id = r.id;
  END LOOP;
END $$;
ALTER TABLE public.offer_activations ALTER COLUMN claim_token SET NOT NULL;
ALTER TABLE public.offer_activations ALTER COLUMN short_code SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS offer_activations_claim_token_key ON public.offer_activations (claim_token);
CREATE UNIQUE INDEX IF NOT EXISTS offer_activations_short_code_key ON public.offer_activations (short_code);

ALTER TABLE public.offer_activations DROP CONSTRAINT IF EXISTS offer_activations_status_check;
ALTER TABLE public.offer_activations ADD CONSTRAINT offer_activations_status_check
  CHECK (status IN ('active', 'cancelled', 'redeemed'));

-- Clients no longer write activations directly — only through claim_deal / redeem_deal.
DROP POLICY IF EXISTS "Users create own activations" ON public.offer_activations;
DROP POLICY IF EXISTS "Users update own activations" ON public.offer_activations;
REVOKE INSERT, UPDATE ON public.offer_activations FROM authenticated;

-- ── 4. Scan log: every attempt, per deal ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.deal_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  offer_id uuid REFERENCES public.venue_offers(id) ON DELETE SET NULL,
  activation_id uuid REFERENCES public.offer_activations(id) ON DELETE SET NULL,
  scanned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  scanner_user_id uuid,
  result text NOT NULL CHECK (result IN ('ok', 'already_redeemed', 'wrong_venue', 'expired', 'not_started', 'cancelled', 'not_found')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS deal_scans_offer_idx ON public.deal_scans (offer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS deal_scans_scanner_idx ON public.deal_scans (scanner_user_id, created_at DESC);
GRANT SELECT ON public.deal_scans TO authenticated;
GRANT ALL ON public.deal_scans TO service_role;
ALTER TABLE public.deal_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Venue owners see their scans" ON public.deal_scans FOR SELECT TO authenticated
  USING (public.is_venue_owner(venue_id));

-- ── 5. Activate ("Deal aktivieren") ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.claim_deal(_offer_id uuid)
RETURNS TABLE(activation_id uuid, claim_token text, short_code text, status text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _pid uuid := public.current_profile_id();
  _o public.venue_offers;
  _owner uuid;
  _existing public.offer_activations;
  _taken integer;
  _code text;
BEGIN
  IF _pid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  -- Lock the deal so the contingent can't be oversold by parallel taps.
  SELECT * INTO _o FROM public.venue_offers WHERE id = _offer_id FOR UPDATE;
  IF _o.id IS NULL OR _o.status NOT IN ('scheduled', 'active') THEN RAISE EXCEPTION 'deal_unavailable'; END IF;
  IF _o.ends_at <= now() THEN RAISE EXCEPTION 'deal_expired'; END IF;
  IF NOT public.can_view_event_age(_o.min_age) THEN RAISE EXCEPTION 'deal_age_restricted'; END IF;
  IF public.can_scan_venue(_o.venue_id) THEN RAISE EXCEPTION 'deal_own_venue'; END IF;
  SELECT owner_profile_id INTO _owner FROM public.venues WHERE id = _o.venue_id;
  IF _owner IS NOT NULL AND public.is_blocked(_pid, _owner) THEN RAISE EXCEPTION 'deal_unavailable'; END IF;

  SELECT * INTO _existing FROM public.offer_activations a WHERE a.offer_id = _offer_id AND a.profile_id = _pid;
  IF _existing.id IS NOT NULL AND _existing.status IN ('active', 'redeemed') THEN
    RETURN QUERY SELECT _existing.id, _existing.claim_token, _existing.short_code, _existing.status;
    RETURN;
  END IF;

  IF _o.max_activations IS NOT NULL THEN
    SELECT count(*) INTO _taken FROM public.offer_activations a
    WHERE a.offer_id = _offer_id AND a.status IN ('active', 'redeemed');
    IF _taken >= _o.max_activations THEN RAISE EXCEPTION 'deal_sold_out'; END IF;
  END IF;

  IF _existing.id IS NOT NULL THEN -- previously cancelled: reactivate, keep codes
    UPDATE public.offer_activations SET status = 'active', activated_at = now() WHERE id = _existing.id;
    RETURN QUERY SELECT _existing.id, _existing.claim_token, _existing.short_code, 'active'::text;
    RETURN;
  END IF;

  LOOP
    _code := public.random_code(6);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.offer_activations a WHERE a.short_code = _code);
  END LOOP;
  RETURN QUERY
  INSERT INTO public.offer_activations (offer_id, profile_id, status, claim_token, short_code)
  VALUES (_offer_id, _pid, 'active', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), _code)
  RETURNING id, offer_activations.claim_token, offer_activations.short_code, offer_activations.status;
END $$;

-- ── 6. Scan / redeem at the bar ───────────────────────────────────────────────────
-- _code = QR token or the 6-character backup code (dashes/spaces ignored).
CREATE OR REPLACE FUNCTION public.redeem_deal(_venue_id uuid, _code text)
RETURNS TABLE(
  result text, offer_id uuid, offer_title text, display_text text, offer_type text, category text,
  guest_username text, guest_display_name text, guest_avatar_url text, redeemed_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _scanner uuid := public.current_profile_id();
  _norm text := regexp_replace(coalesce(_code, ''), '[\s-]', '', 'g');
  _a public.offer_activations;
  _o public.venue_offers;
  _res text;
  _misses integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF NOT public.can_scan_venue(_venue_id) THEN RAISE EXCEPTION 'not allowed to scan for this venue'; END IF;

  -- Brute-force guard on the short backup codes.
  SELECT count(*) INTO _misses FROM public.deal_scans s
  WHERE s.scanner_user_id = auth.uid() AND s.result = 'not_found' AND s.created_at > now() - interval '10 minutes';
  IF _misses >= 20 THEN RAISE EXCEPTION 'too_many_attempts'; END IF;

  SELECT * INTO _a FROM public.offer_activations a
  WHERE a.claim_token = lower(_norm) OR a.short_code = upper(_norm)
  FOR UPDATE;

  IF _a.id IS NULL THEN
    _res := 'not_found';
  ELSE
    SELECT * INTO _o FROM public.venue_offers WHERE id = _a.offer_id;
    IF _o.venue_id <> _venue_id THEN _res := 'wrong_venue';
    ELSIF _a.status = 'redeemed' THEN _res := 'already_redeemed';
    ELSIF _a.status = 'cancelled' THEN _res := 'cancelled';
    ELSIF now() < _o.starts_at THEN _res := 'not_started';
    ELSIF now() >= _o.ends_at OR _o.status NOT IN ('scheduled', 'active') THEN _res := 'expired';
    ELSE
      UPDATE public.offer_activations
      SET status = 'redeemed', redeemed_at = now(), redeemed_by = _scanner
      WHERE id = _a.id AND status = 'active';
      _res := 'ok';
      SELECT * INTO _a FROM public.offer_activations WHERE id = _a.id;
    END IF;
  END IF;

  INSERT INTO public.deal_scans (venue_id, offer_id, activation_id, scanned_by, scanner_user_id, result)
  VALUES (_venue_id, CASE WHEN _res = 'wrong_venue' THEN NULL ELSE _o.id END,
          CASE WHEN _res = 'wrong_venue' THEN NULL ELSE _a.id END, _scanner, auth.uid(), _res);

  -- Details only for this venue's own deals; a foreign code reveals nothing.
  IF _res IN ('not_found', 'wrong_venue') THEN
    RETURN QUERY SELECT _res, NULL::uuid, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text, NULL::timestamptz;
    RETURN;
  END IF;
  RETURN QUERY
  SELECT _res, _o.id, _o.title, _o.display_text, _o.offer_type, _o.category,
         p.username, p.display_name, p.avatar_url, _a.redeemed_at
  FROM public.profiles p WHERE p.id = _a.profile_id;
END $$;

-- ── 7. Wallet: the caller's own tickets ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.my_deal_wallet()
RETURNS TABLE(
  activation_id uuid, status text, claim_token text, short_code text, activated_at timestamptz, redeemed_at timestamptz,
  offer_id uuid, title text, display_text text, offer_type text, category text, image_url text, conditions text,
  redemption_instruction text, starts_at timestamptz, ends_at timestamptz,
  venue_id uuid, venue_name text, venue_image_url text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.id, a.status, a.claim_token, a.short_code, a.activated_at, a.redeemed_at,
         o.id, o.title, o.display_text, o.offer_type, o.category, o.image_url, o.conditions,
         o.redemption_instruction, o.starts_at, o.ends_at,
         v.id, v.name, v.image_url
  FROM public.offer_activations a
  JOIN public.venue_offers o ON o.id = a.offer_id
  JOIN public.venues v ON v.id = o.venue_id
  WHERE a.profile_id = public.current_profile_id()
    AND a.status IN ('active', 'redeemed')
    AND (o.ends_at > now() - interval '30 days')
  ORDER BY (a.status = 'active' AND o.ends_at > now()) DESC, o.ends_at ASC;
$$;

-- ── 8. Remaining contingent + stats per deal ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.offer_activation_count(_offer_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::int FROM public.offer_activations a
  WHERE a.offer_id = _offer_id AND a.status IN ('active', 'redeemed')
$$;

CREATE OR REPLACE FUNCTION public.offers_remaining(_offer_ids uuid[])
RETURNS TABLE(offer_id uuid, taken integer, remaining integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.id,
         (SELECT count(*)::int FROM public.offer_activations a WHERE a.offer_id = o.id AND a.status IN ('active', 'redeemed')),
         CASE WHEN o.max_activations IS NULL THEN NULL
              ELSE greatest(o.max_activations - (SELECT count(*)::int FROM public.offer_activations a
                                                 WHERE a.offer_id = o.id AND a.status IN ('active', 'redeemed')), 0) END
  FROM public.venue_offers o
  WHERE o.id = ANY (_offer_ids[1:100])
    AND o.status IN ('scheduled', 'active') AND o.ends_at > now() AND public.can_view_event_age(o.min_age);
$$;

DROP FUNCTION IF EXISTS public.venue_offer_stats(uuid);
CREATE FUNCTION public.venue_offer_stats(_venue_id uuid)
RETURNS TABLE(
  offer_id uuid, title text, event_id uuid, starts_at timestamptz, ends_at timestamptz, status text,
  activations bigint, redemptions bigint, failed_scans bigint, max_activations integer
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.id, o.title, o.event_id, o.starts_at, o.ends_at, o.status,
    (SELECT count(*) FROM public.offer_activations a WHERE a.offer_id = o.id AND a.status IN ('active', 'redeemed')),
    (SELECT count(*) FROM public.offer_activations a WHERE a.offer_id = o.id AND a.status = 'redeemed'),
    (SELECT count(*) FROM public.deal_scans s WHERE s.offer_id = o.id AND s.result <> 'ok'),
    o.max_activations
  FROM public.venue_offers o
  WHERE o.venue_id = _venue_id AND public.is_venue_owner(_venue_id)
  ORDER BY o.created_at DESC
$$;

-- ── 9. Feed: running deals of venues the user follows ─────────────────────────────
CREATE OR REPLACE FUNCTION public.feed_live_deals()
RETURNS SETOF public.venue_offers
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.* FROM public.venue_offers o
  JOIN public.venues v ON v.id = o.venue_id
  JOIN public.follows f ON f.following_id = v.owner_profile_id AND f.follower_id = public.current_profile_id()
  WHERE o.status IN ('scheduled', 'active')
    AND o.ends_at > now()
    AND o.starts_at <= now() + interval '12 hours'
    AND public.can_view_event_age(o.min_age)
    AND NOT public.is_blocked(public.current_profile_id(), v.owner_profile_id)
  ORDER BY o.starts_at <= now() DESC, o.ends_at ASC
  LIMIT 20;
$$;

-- ── Grants ────────────────────────────────────────────────────────────────────────
DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'public.can_scan_venue(uuid)', 'public.create_staff_invite(uuid)', 'public.accept_staff_invite(text)',
    'public.list_venue_staff(uuid)', 'public.remove_venue_staff(uuid, uuid)', 'public.my_scan_venues()',
    'public.claim_deal(uuid)', 'public.redeem_deal(uuid, text)', 'public.my_deal_wallet()',
    'public.offers_remaining(uuid[])', 'public.venue_offer_stats(uuid)', 'public.feed_live_deals()',
    'public.offer_activation_count(uuid)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f);
  END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.random_code(integer) FROM PUBLIC, anon, authenticated;
