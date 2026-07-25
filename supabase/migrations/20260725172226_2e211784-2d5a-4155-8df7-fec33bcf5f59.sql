DROP POLICY "Authenticated users can follow" ON public.follows;

CREATE POLICY "Authenticated users can follow"
ON public.follows FOR INSERT TO public
WITH CHECK (
  auth.uid() IS NOT NULL
  AND follower_id = public.current_profile_id()
  AND follower_id <> following_id
  AND public.can_see_user(follower_id, following_id)
);