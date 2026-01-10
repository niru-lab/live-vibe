-- Add host acceptance status to event_attendees
ALTER TABLE public.event_attendees 
ADD COLUMN IF NOT EXISTS host_accepted boolean DEFAULT NULL,
ADD COLUMN IF NOT EXISTS host_message text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS host_responded_at timestamp with time zone DEFAULT NULL;

-- Create private messages table for event communication
CREATE TABLE IF NOT EXISTS public.event_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  includes_address boolean DEFAULT false,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on event_messages
ALTER TABLE public.event_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see messages they sent or received
CREATE POLICY "Users can view their own messages"
ON public.event_messages
FOR SELECT
USING (
  sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR recipient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Policy: Event creators can send messages to accepted attendees
CREATE POLICY "Event creators can send messages"
ON public.event_messages
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = event_id 
    AND events.creator_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

-- Policy: Users can mark their received messages as read
CREATE POLICY "Users can update read status"
ON public.event_messages
FOR UPDATE
USING (recipient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_event_messages_recipient ON public.event_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_event_messages_event ON public.event_messages(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_host_accepted ON public.event_attendees(host_accepted);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_messages;