
-- Enforce profile_visibility across posts, follows, likes, comments via can_view_profile()

DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
CREATE POLICY "Posts viewable by allowed viewers" ON public.posts FOR SELECT
USING (
  author_id = public.current_profile_id()
  OR public.can_view_profile(public.current_profile_id(), author_id)
);

DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
CREATE POLICY "Follows viewable by allowed viewers" ON public.follows FOR SELECT
USING (
  follower_id = public.current_profile_id()
  OR following_id = public.current_profile_id()
  OR (
    public.can_view_profile(public.current_profile_id(), follower_id)
    AND public.can_view_profile(public.current_profile_id(), following_id)
  )
);

DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes;
CREATE POLICY "Likes viewable by allowed viewers" ON public.likes FOR SELECT
USING (
  user_id = public.current_profile_id()
  OR EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = likes.post_id
      AND public.can_view_profile(public.current_profile_id(), p.author_id)
  )
);

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments viewable by allowed viewers" ON public.comments FOR SELECT
USING (
  user_id = public.current_profile_id()
  OR EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = comments.post_id
      AND public.can_view_profile(public.current_profile_id(), p.author_id)
  )
);
