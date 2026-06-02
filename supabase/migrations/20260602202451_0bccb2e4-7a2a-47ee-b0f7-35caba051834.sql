-- Fix infinite recursion in profiles SELECT policy
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

DROP POLICY IF EXISTS "Profiles viewable unless blocked" ON public.profiles;

CREATE POLICY "Profiles viewable unless blocked"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NULL
  OR auth.uid() = user_id
  OR NOT public.is_blocked(public.current_profile_id(), profiles.id)
);