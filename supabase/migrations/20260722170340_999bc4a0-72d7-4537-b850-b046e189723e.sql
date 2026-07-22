DROP POLICY IF EXISTS "Authenticated users can join events" ON public.event_attendees;

CREATE POLICY "Authenticated users can join events"
ON public.event_attendees
FOR INSERT
TO public
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id IN (
    SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
  )
  AND NOT public.is_blocked(
    user_id,
    (SELECT e.creator_id FROM public.events e WHERE e.id = event_id)
  )
);