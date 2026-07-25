DROP POLICY IF EXISTS "Public rooms viewable by everyone" ON public.rooms;

CREATE POLICY "Public rooms viewable by everyone"
  ON public.rooms
  FOR SELECT
  TO public
  USING (
    hoster_id IN (
      SELECT profiles.id FROM public.profiles WHERE profiles.user_id = auth.uid()
    )
    OR (
      (
        visibility = 'public'
        OR id IN (SELECT public.get_user_room_ids(public.current_profile_id()))
      )
      AND NOT public.is_blocked(public.current_profile_id(), hoster_id)
    )
  );