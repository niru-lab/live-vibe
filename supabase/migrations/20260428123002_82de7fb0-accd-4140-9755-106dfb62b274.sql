CREATE TYPE public.dm_status AS ENUM ('pending', 'accepted', 'declined');

CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  content TEXT NOT NULL,
  status public.dm_status NOT NULL DEFAULT 'pending',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_dm_recipient ON public.direct_messages(recipient_id, created_at DESC);
CREATE INDEX idx_dm_sender ON public.direct_messages(sender_id, created_at DESC);
CREATE INDEX idx_dm_pair ON public.direct_messages(sender_id, recipient_id, created_at DESC);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view DMs"
ON public.direct_messages FOR SELECT
USING (
  sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  OR recipient_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can send DMs respecting privacy"
ON public.direct_messages FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  AND public.can_send_dm(sender_id, recipient_id)
);

CREATE POLICY "Recipient can update DM status"
ON public.direct_messages FOR UPDATE
USING (recipient_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Participants can delete DMs"
ON public.direct_messages FOR DELETE
USING (
  sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  OR recipient_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;