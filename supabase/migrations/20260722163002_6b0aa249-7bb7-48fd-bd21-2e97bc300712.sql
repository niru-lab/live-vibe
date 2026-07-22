DROP POLICY IF EXISTS "Approved members can view room posts" ON public.room_posts;

CREATE POLICY "Approved members can view room posts"
ON public.room_posts
FOR SELECT
USING (
  (
    public.is_room_approved_member(public.current_profile_id(), room_id)
    OR room_id IN (
      SELECT r.id FROM public.rooms r
      WHERE r.hoster_id = public.current_profile_id()
    )
  )
  AND NOT public.is_blocked(public.current_profile_id(), author_id)
);