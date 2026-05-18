CREATE POLICY "Event creators can invite attendees"
ON public.event_attendees
FOR INSERT
TO authenticated
WITH CHECK (
  status = 'invited'
  AND event_id IN (
    SELECT e.id FROM public.events e
    WHERE e.creator_id IN (
      SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  )
);