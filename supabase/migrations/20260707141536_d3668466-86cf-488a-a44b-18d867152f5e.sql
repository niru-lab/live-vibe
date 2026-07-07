CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.archive_old_events()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.events
  SET is_active = false
  WHERE is_active = true
    AND COALESCE(ends_at, starts_at + interval '6 hours') < now() - interval '90 days';
$$;

-- (Re)schedule daily archive job
DO $$
BEGIN
  PERFORM cron.unschedule('archive-old-events');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'archive-old-events',
  '15 3 * * *',
  $$ SELECT public.archive_old_events(); $$
);