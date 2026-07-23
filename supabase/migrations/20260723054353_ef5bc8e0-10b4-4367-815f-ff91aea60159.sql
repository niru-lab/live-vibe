BEGIN;
DROP POLICY IF EXISTS "Users insert own non-creator participation" ON public.event_participants;
CREATE POLICY "Users insert own non-creator participation" ON public.event_participants FOR INSERT TO public WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id IN (SELECT profiles.id FROM public.profiles WHERE profiles.user_id = auth.uid())
  AND status = ANY (ARRAY['interested','requested'])
  AND NOT public.is_event_owner(event_id, user_id)
  AND NOT public.is_blocked(user_id, (SELECT e.creator_id FROM public.events e WHERE e.id = event_id))
);
COMMIT;