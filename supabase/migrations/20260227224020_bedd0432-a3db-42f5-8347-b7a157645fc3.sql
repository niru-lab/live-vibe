
-- Create security definer function to check room membership without recursion
CREATE OR REPLACE FUNCTION public.is_room_member(_user_id uuid, _room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_members
    WHERE user_id = _user_id AND room_id = _room_id
  )
$$;

-- Create security definer function to get user's room IDs
CREATE OR REPLACE FUNCTION public.get_user_room_ids(_profile_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT room_id FROM public.room_members WHERE user_id = _profile_id
$$;

-- Drop old recursive policies
DROP POLICY IF EXISTS "Public rooms viewable by everyone" ON public.rooms;
DROP POLICY IF EXISTS "Members viewable by room members" ON public.room_members;
DROP POLICY IF EXISTS "Recurring events viewable by members" ON public.room_recurring_events;

-- Recreate rooms SELECT policy without recursion
CREATE POLICY "Public rooms viewable by everyone" ON public.rooms
FOR SELECT USING (
  visibility = 'public'
  OR hoster_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR id IN (SELECT public.get_user_room_ids((SELECT id FROM profiles WHERE user_id = auth.uid())))
);

-- Recreate room_members SELECT policy without recursion
CREATE POLICY "Members viewable by room members" ON public.room_members
FOR SELECT USING (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR room_id IN (SELECT public.get_user_room_ids((SELECT id FROM profiles WHERE user_id = auth.uid())))
  OR room_id IN (SELECT id FROM rooms WHERE visibility = 'public')
);

-- Recreate recurring events SELECT policy without recursion
CREATE POLICY "Recurring events viewable by members" ON public.room_recurring_events
FOR SELECT USING (
  room_id IN (SELECT public.get_user_room_ids((SELECT id FROM profiles WHERE user_id = auth.uid())))
  OR room_id IN (SELECT id FROM rooms WHERE visibility = 'public')
);
