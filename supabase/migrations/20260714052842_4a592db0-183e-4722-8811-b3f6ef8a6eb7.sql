-- Phase 1: block-triggered cleanup + notification suppression.
-- No RLS, no auth changes.

-- 1) Suppress notifications when a block relation exists (either direction).
CREATE OR REPLACE FUNCTION public.create_notification(
  _recipient uuid,
  _actor uuid,
  _type notification_type,
  _title text,
  _body text DEFAULT NULL::text,
  _ref_type text DEFAULT NULL::text,
  _ref_id uuid DEFAULT NULL::uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF _recipient IS NULL OR _recipient = _actor THEN
    RETURN;
  END IF;
  IF _actor IS NOT NULL AND public.is_blocked(_recipient, _actor) THEN
    RETURN;
  END IF;
  INSERT INTO public.notifications (recipient_id, actor_id, type, title, body, ref_type, ref_id)
  VALUES (_recipient, _actor, _type, _title, _body, _ref_type, _ref_id);
END;
$function$;

-- 2) Bulk notify_followers_on_event bypasses create_notification -> filter directly.
CREATE OR REPLACE FUNCTION public.notify_followers_on_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE actor_name text;
BEGIN
  SELECT COALESCE(display_name, username) INTO actor_name FROM profiles WHERE id = NEW.creator_id;
  INSERT INTO public.notifications (recipient_id, actor_id, type, title, body, ref_type, ref_id)
  SELECT f.follower_id, NEW.creator_id, 'event_created_by_followed_user',
         actor_name || ' hat ein neues Event erstellt', NEW.name, 'event', NEW.id
  FROM follows f
  WHERE f.following_id = NEW.creator_id
    AND NOT public.is_blocked(f.follower_id, NEW.creator_id);
  RETURN NEW;
END;
$function$;

-- 3) Cleanup on new block: follows, chat_requests, event_invites (pending only).
CREATE OR REPLACE FUNCTION public.handle_block_cleanup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Remove mutual follows in both directions
  DELETE FROM public.follows
  WHERE (follower_id = NEW.blocker_id AND following_id = NEW.blocked_id)
     OR (follower_id = NEW.blocked_id AND following_id = NEW.blocker_id);

  -- Cancel pending chat requests in both directions
  DELETE FROM public.chat_requests
  WHERE status = 'pending'
    AND (
      (sender_id = NEW.blocker_id AND recipient_id = NEW.blocked_id)
      OR (sender_id = NEW.blocked_id AND recipient_id = NEW.blocker_id)
    );

  -- Cancel pending event invites in both directions (only unresponded 'invited')
  DELETE FROM public.event_invites
  WHERE status = 'invited'
    AND (
      (invited_by = NEW.blocker_id AND invited_user_id = NEW.blocked_id)
      OR (invited_by = NEW.blocked_id AND invited_user_id = NEW.blocker_id)
    );

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_blocks_cleanup ON public.blocks;
CREATE TRIGGER trg_blocks_cleanup
AFTER INSERT ON public.blocks
FOR EACH ROW EXECUTE FUNCTION public.handle_block_cleanup();