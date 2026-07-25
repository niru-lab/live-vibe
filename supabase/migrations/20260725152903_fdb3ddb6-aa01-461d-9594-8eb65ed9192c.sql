DROP POLICY IF EXISTS "Participants can view chat requests" ON public.chat_requests;

CREATE POLICY "Participants can view chat requests"
  ON public.chat_requests
  FOR SELECT
  TO public
  USING (
    (
      sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      AND NOT public.is_blocked(sender_id, recipient_id)
    )
    OR (
      recipient_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      AND NOT public.is_blocked(recipient_id, sender_id)
    )
  );