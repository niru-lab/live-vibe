DROP POLICY IF EXISTS "Sender can create chat request" ON public.chat_requests;

CREATE POLICY "Sender can create chat request" ON public.chat_requests
FOR INSERT
TO public
WITH CHECK (
  auth.uid() IS NOT NULL
  AND sender_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
  )
  AND NOT public.is_blocked(sender_id, recipient_id)
);
