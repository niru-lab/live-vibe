CREATE TABLE public.venue_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  offer_type text NOT NULL CHECK (offer_type IN ('discount_percent','fixed_price','two_for_one','free_entry','special')),
  display_text text,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','active','expired','paused','archived')),
  redemption_instruction text,
  max_activations integer CHECK (max_activations IS NULL OR max_activations > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT venue_offers_valid_range CHECK (ends_at > starts_at)
);

CREATE INDEX idx_venue_offers_venue ON public.venue_offers(venue_id, status, ends_at DESC);
CREATE INDEX idx_venue_offers_event ON public.venue_offers(event_id) WHERE event_id IS NOT NULL;

GRANT SELECT ON public.venue_offers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.venue_offers TO authenticated;
GRANT ALL ON public.venue_offers TO service_role;

CREATE OR REPLACE FUNCTION public.is_venue_owner(_venue_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.venues v
    WHERE v.id = _venue_id
      AND v.owner_profile_id IS NOT NULL
      AND v.owner_profile_id = public.current_profile_id()
  );
$$;

CREATE OR REPLACE FUNCTION public.validate_offer_event_relation()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE owner_id uuid;
BEGIN
  IF NEW.event_id IS NULL THEN RETURN NEW; END IF;
  SELECT owner_profile_id INTO owner_id FROM public.venues WHERE id = NEW.venue_id;
  IF owner_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.events e WHERE e.id = NEW.event_id AND e.creator_id = owner_id
  ) THEN
    RAISE EXCEPTION 'Event does not belong to this venue';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_offer_event_relation
BEFORE INSERT OR UPDATE ON public.venue_offers
FOR EACH ROW EXECUTE FUNCTION public.validate_offer_event_relation();

CREATE TRIGGER trg_venue_offers_updated_at
BEFORE UPDATE ON public.venue_offers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.venue_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published offers are viewable"
ON public.venue_offers FOR SELECT
TO anon, authenticated
USING (status IN ('scheduled','active') AND ends_at > now());

CREATE POLICY "Venue owners can view own offers"
ON public.venue_offers FOR SELECT
TO authenticated
USING (public.is_venue_owner(venue_id));

CREATE POLICY "Venue owners can create offers"
ON public.venue_offers FOR INSERT
TO authenticated
WITH CHECK (public.is_venue_owner(venue_id));

CREATE POLICY "Venue owners can update own offers"
ON public.venue_offers FOR UPDATE
TO authenticated
USING (public.is_venue_owner(venue_id))
WITH CHECK (public.is_venue_owner(venue_id));

CREATE POLICY "Venue owners can delete own offers"
ON public.venue_offers FOR DELETE
TO authenticated
USING (public.is_venue_owner(venue_id));

CREATE TABLE public.offer_activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.venue_offers(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled')),
  activated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (offer_id, profile_id)
);

CREATE INDEX idx_offer_activations_offer ON public.offer_activations(offer_id);

GRANT SELECT, INSERT, UPDATE ON public.offer_activations TO authenticated;
GRANT ALL ON public.offer_activations TO service_role;

ALTER TABLE public.offer_activations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own activations"
ON public.offer_activations FOR SELECT
TO authenticated
USING (profile_id = public.current_profile_id());

CREATE POLICY "Users create own activations"
ON public.offer_activations FOR INSERT
TO authenticated
WITH CHECK (profile_id = public.current_profile_id());

CREATE POLICY "Users update own activations"
ON public.offer_activations FOR UPDATE
TO authenticated
USING (profile_id = public.current_profile_id())
WITH CHECK (profile_id = public.current_profile_id());

CREATE OR REPLACE FUNCTION public.venue_offer_stats(_venue_id uuid)
RETURNS TABLE(offer_id uuid, title text, event_id uuid, starts_at timestamptz, ends_at timestamptz, status text, activations bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT o.id, o.title, o.event_id, o.starts_at, o.ends_at, o.status,
         (SELECT count(*) FROM public.offer_activations a WHERE a.offer_id = o.id AND a.status = 'active')
  FROM public.venue_offers o
  WHERE o.venue_id = _venue_id
    AND public.is_venue_owner(_venue_id)
  ORDER BY o.created_at DESC
$$;

CREATE OR REPLACE FUNCTION public.offer_activation_count(_offer_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT count(*)::int FROM public.offer_activations a
  WHERE a.offer_id = _offer_id AND a.status = 'active'
$$;