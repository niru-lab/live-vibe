-- Migration: room_members SELECT block-aware
DROP POLICY IF EXISTS "Members viewable by room members" ON public.room_members;

CREATE POLICY "Members viewable by room members"
ON public.room_members
FOR SELECT
USING (
  (user_id = public.current_profile_id())
  OR (
    (
      room_id IN (SELECT public.get_user_room_ids(public.current_profile_id()))
      OR room_id IN (SELECT id FROM public.rooms WHERE visibility = 'public')
    )
    AND NOT public.is_blocked(public.current_profile_id(), user_id)
  )
);