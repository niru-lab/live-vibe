DROP POLICY "User points viewable by everyone" ON public.user_points;

CREATE POLICY "User points viewable by allowed viewers"
ON public.user_points FOR SELECT TO public
USING (
  profile_id = public.current_profile_id()
  OR public.can_see_user(public.current_profile_id(), profile_id)
);