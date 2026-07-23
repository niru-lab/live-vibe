DROP POLICY IF EXISTS "Participants can view DMs" ON public.direct_messages;

CREATE POLICY "Participants can view DMs"
ON public.direct_messages
FOR SELECT
TO public
USING (
  (
    sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR
    recipient_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
  AND NOT public.is_blocked(sender_id, recipient_id)
);