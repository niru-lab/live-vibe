DROP POLICY IF EXISTS "Event creators can send messages" ON public.event_messages;
CREATE POLICY "Event creators can send messages"
ON public.event_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_messages.event_id
      AND events.creator_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
  AND NOT public.is_blocked(sender_id, recipient_id)
);