-- Schedule workflow-scheduler edge function every 5 minutes
-- Processes event queue + due cron schedules

DO $block$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(j.jobid)
    FROM cron.job j
    WHERE j.jobname = 'workflow-scheduler';

    PERFORM cron.schedule(
      'workflow-scheduler',
      '*/5 * * * *',
      $job$
      SELECT net.http_post(
        url := 'https://agjxgomgkzwdmkjapzhs.supabase.co/functions/v1/workflow-scheduler',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := '{}'::jsonb,
        timeout_milliseconds := 60000
      ) AS request_id;
      $job$
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'workflow-scheduler cron skipped: %', SQLERRM;
END;
$block$;
