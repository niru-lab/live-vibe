DROP POLICY IF EXISTS "Event creators can invite" ON public.event_invites;

CREATE POLICY "Event creators can invite"
ON public.event_invites
FOR INSERT
WITH CHECK (
  invited_by IN (
    SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_invites.event_id
      AND e.creator_id = invited_by
  )
  AND NOT public.is_blocked(invited_by, invited_user_id)
);