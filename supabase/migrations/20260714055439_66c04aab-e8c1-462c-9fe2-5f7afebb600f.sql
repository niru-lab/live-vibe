DROP POLICY IF EXISTS "Comments viewable by allowed viewers" ON public.comments;

CREATE POLICY "Comments viewable by allowed viewers"
ON public.comments
FOR SELECT
USING (
  user_id = public.current_profile_id()
  OR (
    NOT public.is_blocked(public.current_profile_id(), comments.user_id)
    AND EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = comments.post_id
        AND public.can_view_profile(public.current_profile_id(), p.author_id)
    )
  )
);