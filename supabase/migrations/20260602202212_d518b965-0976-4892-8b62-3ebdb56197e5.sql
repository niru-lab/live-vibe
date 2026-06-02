-- FEYRN SECURITY AUDIT 2026-06-02 — RLS Hardening

-- 1) notifications: verhindere Fake-Notifications von beliebigen Clients.
-- Trigger und Edge-Functions laufen als SECURITY DEFINER bzw. service_role
-- und umgehen RLS weiterhin (System-Notifs bleiben funktionsfähig).
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Users can insert notifications only as themselves"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  actor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  AND recipient_id <> actor_id
);

-- 2) profiles: geblockte User dürfen das Profil des Blockers nicht mehr sehen.
-- Anonyme Besucher und nicht-blockierte authenticated User sehen weiterhin alles
-- (Discovery/Search bleibt funktionsfähig).
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Profiles viewable unless blocked"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NULL
  OR auth.uid() = user_id
  OR NOT public.is_blocked(
    (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1),
    profiles.id
  )
);