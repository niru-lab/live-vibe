
-- 1) rooms: neue Felder
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS requires_approval boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS chat_policy text NOT NULL DEFAULT 'members'
    CHECK (chat_policy IN ('members','hoster_only'));

-- 2) room_members: status
ALTER TABLE public.room_members
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved'
    CHECK (status IN ('pending','approved'));

-- Bestehende auf approved
UPDATE public.room_members SET status = 'approved' WHERE status IS NULL;

-- Hoster-Trigger anpassen (status approved)
CREATE OR REPLACE FUNCTION public.auto_add_room_hoster()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.room_members (room_id, user_id, role, status)
  VALUES (NEW.id, NEW.hoster_id, 'hoster', 'approved');
  RETURN NEW;
END;
$function$;

-- Helper: ist user approved member?
CREATE OR REPLACE FUNCTION public.is_room_approved_member(_user_id uuid, _room_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_members
    WHERE user_id = _user_id AND room_id = _room_id AND status = 'approved'
  )
$$;

-- 3) room_posts
CREATE TABLE IF NOT EXISTS public.room_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_room_posts_room_created
  ON public.room_posts(room_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_posts TO authenticated;
GRANT ALL ON public.room_posts TO service_role;

ALTER TABLE public.room_posts ENABLE ROW LEVEL SECURITY;

-- SELECT: approved members oder Host
CREATE POLICY "Approved members can view room posts"
  ON public.room_posts FOR SELECT
  USING (
    public.is_room_approved_member(
      (SELECT id FROM public.profiles WHERE user_id = auth.uid()),
      room_id
    )
    OR room_id IN (
      SELECT id FROM public.rooms
      WHERE hoster_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
  );

-- INSERT: Host immer; sonst approved member UND chat_policy='members'
CREATE POLICY "Hoster or members can post in room"
  ON public.room_posts FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND (
      -- Host darf immer
      room_id IN (
        SELECT id FROM public.rooms
        WHERE hoster_id = author_id
      )
      OR (
        public.is_room_approved_member(author_id, room_id)
        AND (SELECT chat_policy FROM public.rooms WHERE id = room_id) = 'members'
      )
    )
  );

-- DELETE: Autor oder Host
CREATE POLICY "Author or hoster can delete room posts"
  ON public.room_posts FOR DELETE
  USING (
    author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR room_id IN (
      SELECT id FROM public.rooms
      WHERE hoster_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
  );

-- 4) room_members RLS: Host darf status updaten (bereits durch "Hosters can update member roles" abgedeckt; OK)

-- 5) is_room_member: jetzt nur approved zählen, damit pending kein Zugriff bekommt
CREATE OR REPLACE FUNCTION public.is_room_member(_user_id uuid, _room_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.room_members
    WHERE user_id = _user_id AND room_id = _room_id AND status = 'approved'
  )
$function$;

CREATE OR REPLACE FUNCTION public.get_user_room_ids(_profile_id uuid)
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT room_id FROM public.room_members WHERE user_id = _profile_id AND status = 'approved'
$function$;
