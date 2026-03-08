
CREATE POLICY "Event creators can update attendees"
ON public.event_attendees
FOR UPDATE
TO authenticated
USING (
  event_id IN (
    SELECT e.id FROM events e
    WHERE e.creator_id IN (
      SELECT p.id FROM profiles p WHERE p.user_id = auth.uid()
    )
  )
);
