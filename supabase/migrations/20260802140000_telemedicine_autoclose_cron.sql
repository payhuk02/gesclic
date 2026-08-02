-- Schedule telemedicine-autoclose edge function every 15 minutes
-- Requires pg_cron + pg_net (available on Supabase hosted projects)

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

DO $block$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(j.jobid)
    FROM cron.job j
    WHERE j.jobname = 'telemedicine-autoclose';

    PERFORM cron.schedule(
      'telemedicine-autoclose',
      '*/15 * * * *',
      $job$
      SELECT net.http_post(
        url := 'https://agjxgomgkzwdmkjapzhs.supabase.co/functions/v1/telemedicine-autoclose',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := '{}'::jsonb,
        timeout_milliseconds := 30000
      ) AS request_id;
      $job$
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'telemedicine-autoclose cron skipped: %', SQLERRM;
END;
$block$;
