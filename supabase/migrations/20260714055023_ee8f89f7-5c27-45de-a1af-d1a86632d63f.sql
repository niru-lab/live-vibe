CREATE OR REPLACE FUNCTION public.can_see_user(viewer_id uuid, target_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT public.can_view_profile(viewer_id, target_id)
     AND NOT public.is_blocked(viewer_id, target_id);
$$;

REVOKE ALL ON FUNCTION public.can_see_user(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_see_user(uuid, uuid) TO authenticated, anon;