DROP POLICY IF EXISTS "Users can insert notifications only as themselves" ON public.notifications;

CREATE POLICY "Users can insert notifications only as themselves"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  actor_id = public.current_profile_id()
  AND recipient_id <> actor_id
  AND NOT public.is_blocked(actor_id, recipient_id)
);

-- Verify current state
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'notifications'
ORDER BY policyname;
