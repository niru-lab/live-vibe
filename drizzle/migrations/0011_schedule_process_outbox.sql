-- Pushes (bell posts/deals, review digests, RSVP replies, …) are queued in outbox_events and sent by the
-- `process-outbox` edge function — which nothing called so far. This schedules it every 20 s via pg_cron +
-- pg_net, but only fires an HTTP call when there is pending work.
-- Auth: reuses the service_role key that Lovable Cloud already stores in vault for the email queue
-- ('email_queue_service_role_key'). If it is missing, the job logs a notice and does nothing.

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.kick_process_outbox()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _key text;
BEGIN
  -- Recover events stuck in 'processing' (function crashed / timed out).
  UPDATE public.outbox_events SET status = 'pending'
  WHERE status = 'processing' AND created_at < now() - interval '10 minutes' AND attempts < max_attempts;

  IF NOT EXISTS (SELECT 1 FROM public.outbox_events WHERE status = 'pending') THEN RETURN; END IF;

  SELECT decrypted_secret INTO _key FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key' LIMIT 1;
  IF _key IS NULL THEN
    RAISE NOTICE 'kick_process_outbox: vault secret email_queue_service_role_key missing';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := 'https://advxucizvsqeipznabyu.supabase.co/functions/v1/process-outbox',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || _key),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
END $$;

REVOKE ALL ON FUNCTION public.kick_process_outbox() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  BEGIN PERFORM cron.unschedule('process-outbox'); EXCEPTION WHEN OTHERS THEN NULL; END;
  PERFORM cron.schedule('process-outbox', '20 seconds', 'SELECT public.kick_process_outbox();');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron not available, process-outbox not scheduled: %', SQLERRM;
END $$;
