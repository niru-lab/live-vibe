DROP POLICY IF EXISTS "Likes viewable by allowed viewers" ON public.likes;

CREATE POLICY "Likes viewable by allowed viewers"
ON public.likes
FOR SELECT
USING (
  (user_id = public.current_profile_id())
  OR (
    public.can_see_user(public.current_profile_id(), likes.user_id)
    AND EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = likes.post_id
        AND public.can_see_user(public.current_profile_id(), p.author_id)
    )
  )
);