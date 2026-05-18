
CREATE OR REPLACE FUNCTION public.notify_on_event_invite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  host_name text;
  ev_name text;
  ev_creator uuid;
BEGIN
  IF NEW.status <> 'invited' THEN RETURN NEW; END IF;
  SELECT name, creator_id INTO ev_name, ev_creator FROM public.events WHERE id = NEW.event_id;
  IF ev_creator IS NULL OR ev_creator = NEW.user_id THEN RETURN NEW; END IF;
  SELECT COALESCE(display_name, username) INTO host_name FROM public.profiles WHERE id = ev_creator;
  PERFORM public.create_notification(
    NEW.user_id,
    ev_creator,
    'event_invite',
    host_name || ' hat dich zu einem Event eingeladen',
    ev_name,
    'event',
    NEW.event_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_event_invite ON public.event_attendees;
CREATE TRIGGER trg_notify_on_event_invite
AFTER INSERT ON public.event_attendees
FOR EACH ROW EXECUTE FUNCTION public.notify_on_event_invite();
