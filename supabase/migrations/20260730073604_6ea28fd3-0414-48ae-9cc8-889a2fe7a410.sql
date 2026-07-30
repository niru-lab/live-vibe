CREATE TABLE public.referral_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'link',
  context text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_referral_shares_profile ON public.referral_shares(profile_id, created_at DESC);
GRANT SELECT, INSERT ON public.referral_shares TO authenticated;
GRANT ALL ON public.referral_shares TO service_role;
ALTER TABLE public.referral_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referral_shares_select_own" ON public.referral_shares FOR SELECT TO authenticated
  USING (profile_id = public.current_profile_id());
CREATE POLICY "referral_shares_insert_own" ON public.referral_shares FOR INSERT TO authenticated
  WITH CHECK (profile_id = public.current_profile_id());

CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT referrals_no_self CHECK (referrer_profile_id <> referred_profile_id)
);
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_profile_id, created_at DESC);
GRANT SELECT, INSERT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referrals_select_involved" ON public.referrals FOR SELECT TO authenticated
  USING (referrer_profile_id = public.current_profile_id() OR referred_profile_id = public.current_profile_id());
CREATE POLICY "referrals_insert_self_as_referred" ON public.referrals FOR INSERT TO authenticated
  WITH CHECK (
    referred_profile_id = public.current_profile_id()
    AND referrer_profile_id <> public.current_profile_id()
    AND NOT public.is_blocked(referrer_profile_id, referred_profile_id)
  );

CREATE OR REPLACE FUNCTION public.top_inviters(_limit integer DEFAULT 5)
RETURNS TABLE(profile_id uuid, username text, display_name text, avatar_url text, joined_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.username, p.display_name, p.avatar_url, count(r.id) AS joined_count
  FROM public.referrals r
  JOIN public.profiles p ON p.id = r.referrer_profile_id
  WHERE r.created_at > now() - interval '30 days'
  GROUP BY p.id, p.username, p.display_name, p.avatar_url
  ORDER BY joined_count DESC, p.username ASC
  LIMIT LEAST(GREATEST(COALESCE(_limit, 5), 1), 20)
$$;
GRANT EXECUTE ON FUNCTION public.top_inviters(integer) TO authenticated;