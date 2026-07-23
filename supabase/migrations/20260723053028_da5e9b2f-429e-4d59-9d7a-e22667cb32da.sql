DROP POLICY IF EXISTS "Participants and host can view" ON public.event_participants;

CREATE POLICY "Participants and host can view"
ON public.event_participants
FOR SELECT
TO authenticated
USING (
  user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  OR (
    public.is_event_owner(event_id, (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
    AND NOT public.is_blocked(
      (SELECT id FROM public.profiles WHERE user_id = auth.uid()),
      user_id
    )
  )
);