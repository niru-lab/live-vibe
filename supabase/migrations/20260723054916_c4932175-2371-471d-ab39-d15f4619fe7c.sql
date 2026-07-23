DROP POLICY IF EXISTS "Users can view their own messages" ON public.event_messages;
CREATE POLICY "Users can view their own messages" ON public.event_messages
FOR SELECT TO authenticated
USING (
  (
    sender_id IN (SELECT profiles.id FROM public.profiles WHERE profiles.user_id = auth.uid())
    AND NOT public.is_blocked(sender_id, recipient_id)
  )
  OR
  (
    recipient_id IN (SELECT profiles.id FROM public.profiles WHERE profiles.user_id = auth.uid())
    AND NOT public.is_blocked(sender_id, recipient_id)
  )
);