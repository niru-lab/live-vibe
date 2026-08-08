CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON public.event_attendees (event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user_id ON public.event_attendees (user_id);

DROP POLICY IF EXISTS "Users can update own RSVP" ON public.event_attendees;
CREATE POLICY "Users can update own RSVP"
ON public.event_attendees
FOR UPDATE
TO authenticated
USING (user_id = public.current_profile_id())
WITH CHECK (
  user_id = public.current_profile_id()
  AND status IN ('going','interested','declined')
);