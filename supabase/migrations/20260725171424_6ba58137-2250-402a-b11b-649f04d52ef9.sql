DROP POLICY IF EXISTS "Authenticated users can like posts" ON public.likes;

CREATE POLICY "Authenticated users can like posts"
ON public.likes
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id IN (SELECT profiles.id FROM public.profiles WHERE profiles.user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = likes.post_id
      AND (
        p.author_id = public.current_profile_id()
        OR public.can_see_user(public.current_profile_id(), p.author_id)
      )
  )
);