DROP POLICY "Post media viewable by everyone" ON public.post_media;

CREATE POLICY "Post media viewable by allowed viewers"
ON public.post_media
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = post_media.post_id
      AND (
        p.author_id = public.current_profile_id()
        OR public.can_see_user(public.current_profile_id(), p.author_id)
      )
  )
);