-- Migration 5: posts SELECT policy becomes block-aware via can_see_user
-- Rollback:
--   DROP POLICY IF EXISTS "Posts viewable by allowed viewers" ON public.posts;
--   CREATE POLICY "Posts viewable by allowed viewers"
--   ON public.posts FOR SELECT
--   USING (
--     author_id = current_profile_id()
--     OR can_view_profile(current_profile_id(), author_id)
--   );

DROP POLICY IF EXISTS "Posts viewable by allowed viewers" ON public.posts;

CREATE POLICY "Posts viewable by allowed viewers"
ON public.posts
FOR SELECT
USING (
  author_id = public.current_profile_id()
  OR public.can_see_user(public.current_profile_id(), posts.author_id)
);
