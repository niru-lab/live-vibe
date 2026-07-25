DROP POLICY IF EXISTS "Hosters can update member roles" ON public.room_members;

CREATE POLICY "Hosters can update member roles"
  ON public.room_members
  FOR UPDATE
  TO public
  USING (
    room_id IN (
      SELECT rooms.id FROM public.rooms
      WHERE rooms.hoster_id IN (
        SELECT profiles.id FROM public.profiles WHERE profiles.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    room_id IN (
      SELECT rooms.id FROM public.rooms
      WHERE rooms.hoster_id IN (
        SELECT profiles.id FROM public.profiles WHERE profiles.user_id = auth.uid()
      )
    )
    AND NOT public.is_blocked(public.current_profile_id(), user_id)
  );