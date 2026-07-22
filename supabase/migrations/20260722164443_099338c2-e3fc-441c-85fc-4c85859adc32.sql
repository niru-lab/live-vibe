DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;

CREATE POLICY "Events are viewable by everyone"
ON public.events
FOR SELECT
USING (
  (creator_id IN (
    SELECT profiles.id
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
  ))
  OR (NOT public.is_blocked(public.current_profile_id(), creator_id))
);