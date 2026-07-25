DROP POLICY IF EXISTS "Users can mark as read" ON public.message_reads;

CREATE POLICY "Users can mark as read"
  ON public.message_reads FOR INSERT TO public
  WITH CHECK (
    user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.event_messages em WHERE em.id = message_id)
  );