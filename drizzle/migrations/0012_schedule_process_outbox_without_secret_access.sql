-- lovable-cron-fallback-reviewed: The user explicitly requested migration 0011's 20-second processing cadence; the existing authenticated scheduled request is reused and no work is dispatched while the outbox is empty.
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.kick_process_outbox()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _command text;
BEGIN
  UPDATE public.outbox_events SET status = 'pending'
  WHERE status = 'processing'
    AND created_at < now() - interval '10 minutes'
    AND attempts < max_attempts;

  IF NOT EXISTS (SELECT 1 FROM public.outbox_events WHERE status = 'pending') THEN
    RETURN;
  END IF;

  SELECT command INTO _command
  FROM cron.job
  WHERE jobname = 'process-outbox-every-minute';

  IF _command IS NULL OR position('/process-outbox' in _command) = 0 THEN
    RAISE NOTICE 'kick_process_outbox: protected process-outbox cron command missing';
    RETURN;
  END IF;

  EXECUTE _command;
END $$;

REVOKE ALL ON FUNCTION public.kick_process_outbox() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  _template_job_id bigint;
  _existing_job_id bigint;
BEGIN
  SELECT jobid INTO _template_job_id
  FROM cron.job
  WHERE jobname = 'process-outbox-every-minute';

  IF _template_job_id IS NULL THEN
    RAISE EXCEPTION 'Existing process-outbox-every-minute cron job is required';
  END IF;

  SELECT jobid INTO _existing_job_id
  FROM cron.job
  WHERE jobname = 'process-outbox';

  IF _existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(_existing_job_id);
  END IF;

  PERFORM cron.alter_job(job_id := _template_job_id, active := false);
  PERFORM cron.schedule('process-outbox', '20 seconds', 'SELECT public.kick_process_outbox();');
END $$;