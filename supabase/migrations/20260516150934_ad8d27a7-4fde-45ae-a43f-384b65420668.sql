-- Helper: is the given profile the creator of the given event?
CREATE OR REPLACE FUNCTION public.is_event_owner(_event_id uuid, _profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events
    WHERE id = _event_id AND creator_id = _profile_id
  )
$$;

-- Table
CREATE TABLE public.event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('interested','requested','accepted','declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

CREATE INDEX idx_event_participants_user ON public.event_participants(user_id, status);
CREATE INDEX idx_event_participants_event ON public.event_participants(event_id, status);

ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- SELECT: participant themselves, or the event creator
CREATE POLICY "Participants and host can view"
ON public.event_participants
FOR SELECT
USING (
  user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  OR public.is_event_owner(event_id, (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
);

-- INSERT: own row, only interested/requested, not the creator
CREATE POLICY "Users insert own non-creator participation"
ON public.event_participants
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  AND status IN ('interested','requested')
  AND NOT public.is_event_owner(event_id, user_id)
);

-- UPDATE: own row, or host updating decision
CREATE POLICY "User or host can update participation"
ON public.event_participants
FOR UPDATE
USING (
  user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  OR public.is_event_owner(event_id, (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
);

-- DELETE: own row only
CREATE POLICY "Users delete own participation"
ON public.event_participants
FOR DELETE
USING (
  user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Notify host on new request
CREATE OR REPLACE FUNCTION public.notify_on_participation_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE actor_name text; creator uuid; ev_name text;
BEGIN
  IF NEW.status <> 'requested' THEN RETURN NEW; END IF;
  SELECT creator_id, name INTO creator, ev_name FROM public.events WHERE id = NEW.event_id;
  SELECT COALESCE(display_name, username) INTO actor_name FROM public.profiles WHERE id = NEW.user_id;
  PERFORM public.create_notification(creator, NEW.user_id, 'event_join_request',
    actor_name || ' möchte zu deinem Event kommen', ev_name, 'event', NEW.event_id);
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_participation_insert
AFTER INSERT ON public.event_participants
FOR EACH ROW EXECUTE FUNCTION public.notify_on_participation_insert();

-- Notify user when host accepts/declines
CREATE OR REPLACE FUNCTION public.notify_on_participation_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE host_name text; ev_name text;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('accepted','declined') THEN RETURN NEW; END IF;
  SELECT name INTO ev_name FROM public.events WHERE id = NEW.event_id;
  SELECT COALESCE(p.display_name, p.username) INTO host_name
    FROM public.events e JOIN public.profiles p ON p.id = e.creator_id WHERE e.id = NEW.event_id;
  IF NEW.status = 'accepted' THEN
    PERFORM public.create_notification(NEW.user_id, NULL, 'event_accepted',
      'Du bist dabei! 🎉', host_name || ' hat dich für "' || ev_name || '" akzeptiert', 'event', NEW.event_id);
  ELSE
    PERFORM public.create_notification(NEW.user_id, NULL, 'event_declined',
      'Anfrage abgelehnt', host_name || ' hat deine Anfrage für "' || ev_name || '" abgelehnt', 'event', NEW.event_id);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_participation_update
AFTER UPDATE ON public.event_participants
FOR EACH ROW EXECUTE FUNCTION public.notify_on_participation_update();