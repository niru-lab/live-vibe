DROP POLICY IF EXISTS "Follows viewable by allowed viewers" ON public.follows;

CREATE POLICY "Follows viewable by allowed viewers"
ON public.follows
FOR SELECT
USING (
  follower_id = public.current_profile_id()
  OR following_id = public.current_profile_id()
  OR (
    public.can_view_profile(public.current_profile_id(), follower_id)
    AND public.can_view_profile(public.current_profile_id(), following_id)
    AND NOT public.is_blocked(public.current_profile_id(), follower_id)
    AND NOT public.is_blocked(public.current_profile_id(), following_id)
  )
);