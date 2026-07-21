DROP POLICY IF EXISTS "Profiles viewable unless blocked" ON public.profiles;

CREATE POLICY "Profiles viewable by allowed viewers"
ON public.profiles
FOR SELECT
USING (
  (auth.uid() = user_id)
  OR public.can_see_user(public.current_profile_id(), id)
);