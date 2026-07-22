DROP POLICY IF EXISTS "Users can join rooms" ON public.room_members;

CREATE POLICY "Users can join rooms"
ON public.room_members
FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL)
  AND (user_id IN (
    SELECT profiles.id
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
  ))
  AND (NOT public.is_blocked(
    public.current_profile_id(),
    (SELECT rooms.hoster_id FROM public.rooms WHERE rooms.id = room_id)
  ))
);