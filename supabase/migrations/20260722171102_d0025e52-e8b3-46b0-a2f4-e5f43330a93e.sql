DROP POLICY IF EXISTS "Event creators can invite attendees" ON public.event_attendees;

CREATE POLICY "Event creators can invite attendees"
ON public.event_attendees
FOR INSERT
WITH CHECK (
  status = 'invited'
  AND event_id IN (
    SELECT e.id FROM public.events e
    WHERE e.creator_id IN (
      SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  )
  AND NOT public.is_blocked(
    user_id,
    (SELECT e.creator_id FROM public.events e WHERE e.id = event_attendees.event_id)
  )
);