
-- Add new enum values
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'message_request';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'event_join_request';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'event_created_by_followed_user';

-- Allow service-definer functions to insert notifications
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='notifications';
  IF NOT FOUND THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications';
  END IF;
END $$;

-- Helper: insert notification (no-op if recipient = actor)
CREATE OR REPLACE FUNCTION public.create_notification(
  _recipient uuid, _actor uuid, _type public.notification_type,
  _title text, _body text DEFAULT NULL, _ref_type text DEFAULT NULL, _ref_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _recipient IS NULL OR _recipient = _actor THEN RETURN; END IF;
  INSERT INTO public.notifications (recipient_id, actor_id, type, title, body, ref_type, ref_id)
  VALUES (_recipient, _actor, _type, _title, _body, _ref_type, _ref_id);
END; $$;

-- Trigger: follow
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor_name text;
BEGIN
  SELECT COALESCE(display_name, username) INTO actor_name FROM profiles WHERE id = NEW.follower_id;
  PERFORM public.create_notification(NEW.following_id, NEW.follower_id, 'follow',
    actor_name || ' folgt dir jetzt', NULL, 'profile', NEW.follower_id);
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS notify_on_follow_trg ON public.follows;
CREATE TRIGGER notify_on_follow_trg AFTER INSERT ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.notify_on_follow();

-- Trigger: comment on post (recipient = post author or event creator if event post)
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor_name text; recipient uuid; ev uuid;
BEGIN
  SELECT COALESCE(display_name, username) INTO actor_name FROM profiles WHERE id = NEW.user_id;
  SELECT author_id, event_id INTO recipient, ev FROM posts WHERE id = NEW.post_id;
  PERFORM public.create_notification(recipient, NEW.user_id, 'comment',
    actor_name || ' hat dein Event kommentiert',
    NEW.content, COALESCE(CASE WHEN ev IS NOT NULL THEN 'event' ELSE 'post' END), COALESCE(ev, NEW.post_id));
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS notify_on_comment_trg ON public.comments;
CREATE TRIGGER notify_on_comment_trg AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();

-- Trigger: like
CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor_name text; recipient uuid; ev uuid;
BEGIN
  SELECT COALESCE(display_name, username) INTO actor_name FROM profiles WHERE id = NEW.user_id;
  SELECT author_id, event_id INTO recipient, ev FROM posts WHERE id = NEW.post_id;
  PERFORM public.create_notification(recipient, NEW.user_id, 'like',
    actor_name || ' mag dein Event', NULL,
    CASE WHEN ev IS NOT NULL THEN 'event' ELSE 'post' END, COALESCE(ev, NEW.post_id));
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS notify_on_like_trg ON public.likes;
CREATE TRIGGER notify_on_like_trg AFTER INSERT ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.notify_on_like();

-- Trigger: first DM only
CREATE OR REPLACE FUNCTION public.notify_on_first_dm()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor_name text; existing int;
BEGIN
  SELECT count(*) INTO existing FROM direct_messages
  WHERE sender_id = NEW.sender_id AND recipient_id = NEW.recipient_id AND id <> NEW.id;
  IF existing > 0 THEN RETURN NEW; END IF;
  SELECT COALESCE(display_name, username) INTO actor_name FROM profiles WHERE id = NEW.sender_id;
  PERFORM public.create_notification(NEW.recipient_id, NEW.sender_id, 'message_request',
    actor_name || ' hat dir geschrieben', NEW.content, 'dm', NEW.id);
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS notify_on_first_dm_trg ON public.direct_messages;
CREATE TRIGGER notify_on_first_dm_trg AFTER INSERT ON public.direct_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_on_first_dm();

-- Trigger: event join request
CREATE OR REPLACE FUNCTION public.notify_on_event_join()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor_name text; creator uuid; ev_name text;
BEGIN
  SELECT creator_id, name INTO creator, ev_name FROM events WHERE id = NEW.event_id;
  SELECT COALESCE(display_name, username) INTO actor_name FROM profiles WHERE id = NEW.user_id;
  PERFORM public.create_notification(creator, NEW.user_id, 'event_join_request',
    actor_name || ' möchte zu deinem Event kommen', ev_name, 'event', NEW.event_id);
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS notify_on_event_join_trg ON public.event_attendees;
CREATE TRIGGER notify_on_event_join_trg AFTER INSERT ON public.event_attendees
FOR EACH ROW EXECUTE FUNCTION public.notify_on_event_join();

-- Trigger: notify followers when followed user creates event
CREATE OR REPLACE FUNCTION public.notify_followers_on_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor_name text;
BEGIN
  SELECT COALESCE(display_name, username) INTO actor_name FROM profiles WHERE id = NEW.creator_id;
  INSERT INTO public.notifications (recipient_id, actor_id, type, title, body, ref_type, ref_id)
  SELECT f.follower_id, NEW.creator_id, 'event_created_by_followed_user',
         actor_name || ' hat ein neues Event erstellt', NEW.name, 'event', NEW.id
  FROM follows f WHERE f.following_id = NEW.creator_id;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS notify_followers_on_event_trg ON public.events;
CREATE TRIGGER notify_followers_on_event_trg AFTER INSERT ON public.events
FOR EACH ROW EXECUTE FUNCTION public.notify_followers_on_event();
