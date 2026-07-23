DROP POLICY IF EXISTS "Invites viewable by recipient and creator" ON public.event_invites;

CREATE POLICY "Invites viewable by recipient and creator"
ON public.event_invites
FOR SELECT
TO authenticated
USING (
  -- Eigene gesendete Invites immer sichtbar
  invited_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  OR (
    -- Empfänger-Branch: invite sichtbar, wenn Empfänger nicht blockt
    invited_user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND NOT public.is_blocked(
      (SELECT id FROM public.profiles WHERE user_id = auth.uid()),
      invited_by
    )
  )
  OR (
    -- Creator-Branch: Creator darf Invites auf eigenem Event sehen, außer an blockierte Nutzer
    public.is_event_owner(event_id, (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
    AND NOT public.is_blocked(
      (SELECT id FROM public.profiles WHERE user_id = auth.uid()),
      invited_user_id
    )
  )
);
