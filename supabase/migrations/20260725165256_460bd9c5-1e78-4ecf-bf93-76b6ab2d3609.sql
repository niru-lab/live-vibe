DROP POLICY "Recurring events viewable by members" ON public.room_recurring_events;

CREATE POLICY "Recurring events viewable by members"
ON public.room_recurring_events
FOR SELECT
USING (
  room_id IN (
    SELECT r.id FROM public.rooms r
    WHERE r.hoster_id = public.current_profile_id()
  )
  OR (
    (
      room_id IN (
        SELECT get_user_room_ids((SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()))
      )
      OR room_id IN (SELECT r.id FROM public.rooms r WHERE r.visibility = 'public')
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.rooms r
      WHERE r.id = room_id
        AND public.is_blocked(public.current_profile_id(), r.hoster_id)
    )
  )
);