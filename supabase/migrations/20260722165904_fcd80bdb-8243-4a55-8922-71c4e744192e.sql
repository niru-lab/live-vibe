DROP POLICY IF EXISTS "Event attendees are viewable by everyone" ON public.event_attendees;

CREATE POLICY "Event attendees are viewable by everyone"
ON public.event_attendees
FOR SELECT
TO public
USING (
  -- own row always visible
  user_id IN (
    SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
  )
  OR
  -- event creator sees all attendees of their events
  event_id IN (
    SELECT e.id FROM public.events e
    WHERE e.creator_id IN (
      SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  )
  OR
  -- public view: no block between viewer and attendee, and no block between viewer and event creator
  (
    NOT public.is_blocked(public.current_profile_id(), user_id)
    AND NOT public.is_blocked(public.current_profile_id(), (
      SELECT e.creator_id FROM public.events e WHERE e.id = event_id
    ))
  )
);