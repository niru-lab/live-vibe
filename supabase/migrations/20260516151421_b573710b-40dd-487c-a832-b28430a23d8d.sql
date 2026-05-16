-- chat_requests gates DM conversations
CREATE TABLE IF NOT EXISTS public.chat_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sender_id, recipient_id)
);

ALTER TABLE public.chat_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view chat requests"
  ON public.chat_requests FOR SELECT
  USING (
    sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR recipient_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Sender can create chat request"
  ON public.chat_requests FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Recipient can update chat request"
  ON public.chat_requests FOR UPDATE
  USING (
    recipient_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_chat_requests_recipient ON public.chat_requests(recipient_id, status);
CREATE INDEX IF NOT EXISTS idx_chat_requests_sender ON public.chat_requests(sender_id, status);

CREATE TRIGGER trg_chat_requests_updated_at
  BEFORE UPDATE ON public.chat_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Canonical status helper (checks both directions + mutual follow shortcut)
CREATE OR REPLACE FUNCTION public.chat_request_status(_a uuid, _b uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s text;
  mutual boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.follows f1
    JOIN public.follows f2 ON f2.follower_id = f1.following_id AND f2.following_id = f1.follower_id
    WHERE f1.follower_id = _a AND f1.following_id = _b
  ) INTO mutual;
  IF mutual THEN RETURN 'accepted'; END IF;

  SELECT status INTO s FROM public.chat_requests
    WHERE (sender_id = _a AND recipient_id = _b) OR (sender_id = _b AND recipient_id = _a)
    ORDER BY (status = 'accepted') DESC, created_at DESC LIMIT 1;

  RETURN COALESCE(s, 'none');
END; $$;