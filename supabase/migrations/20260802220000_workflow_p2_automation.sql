-- Workflow P2: event queue, DB triggers, schedule fixes, analytics index

-- Unique index required for REFRESH MATERIALIZED VIEW CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_workflow_analytics_unique
  ON public.mv_workflow_analytics (workflow_id, execution_date);

-- One active schedule row per workflow
CREATE UNIQUE INDEX IF NOT EXISTS idx_workflow_schedules_workflow_unique
  ON public.workflow_schedules (workflow_id);

-- Pending runs queue (events + deferred work)
CREATE TABLE IF NOT EXISTS public.workflow_pending_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workflow_definitions(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'event', 'schedule', 'webhook')),
  trigger_data JSONB NOT NULL DEFAULT '{}',
  input_data JSONB NOT NULL DEFAULT '{}',
  triggered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_workflow_pending_runs_status
  ON public.workflow_pending_runs (status, created_at)
  WHERE status = 'pending';

ALTER TABLE public.workflow_pending_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic members can view pending runs"
  ON public.workflow_pending_runs FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM public.clinic_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Helper: does workflow definition listen to this event?
CREATE OR REPLACE FUNCTION public.workflow_matches_event(definition JSONB, event_type TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  trig JSONB;
  node JSONB;
BEGIN
  IF definition->'triggers' IS NOT NULL THEN
    FOR trig IN SELECT jsonb_array_elements(definition->'triggers')
    LOOP
      IF trig->>'type' = 'event'
        AND COALESCE(trig->'config'->>'event', '') = event_type THEN
        RETURN TRUE;
      END IF;
    END LOOP;
  END IF;

  IF definition->'nodes' IS NOT NULL THEN
    FOR node IN SELECT jsonb_array_elements(definition->'nodes')
    LOOP
      IF node->>'type' = 'trigger'
        AND (
          node->'config'->>'event' = event_type
          OR (node->'config'->>'type' = 'event' AND node->'config'->>'event' = event_type)
        ) THEN
        RETURN TRUE;
      END IF;
    END LOOP;
  END IF;

  RETURN FALSE;
END;
$$;

-- Enqueue matching active workflows for a clinic event
CREATE OR REPLACE FUNCTION public.enqueue_workflow_event(
  p_clinic_id UUID,
  p_event_type TEXT,
  p_payload JSONB DEFAULT '{}',
  p_triggered_by UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wf RECORD;
  enqueued INTEGER := 0;
BEGIN
  FOR wf IN
    SELECT id
    FROM public.workflow_definitions
    WHERE clinic_id = p_clinic_id
      AND status = 'active'
      AND public.workflow_matches_event(definition, p_event_type)
  LOOP
    INSERT INTO public.workflow_pending_runs (
      workflow_id,
      clinic_id,
      trigger_type,
      trigger_data,
      input_data,
      triggered_by
    )
    VALUES (
      wf.id,
      p_clinic_id,
      'event',
      jsonb_build_object('event', p_event_type),
      p_payload,
      p_triggered_by
    );
    enqueued := enqueued + 1;
  END LOOP;

  RETURN enqueued;
END;
$$;

-- Atomically claim pending runs for the scheduler worker
CREATE OR REPLACE FUNCTION public.claim_workflow_pending_runs(p_limit INTEGER DEFAULT 20)
RETURNS SETOF public.workflow_pending_runs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.workflow_pending_runs
  SET status = 'processing'
  WHERE id IN (
    SELECT id
    FROM public.workflow_pending_runs
    WHERE status = 'pending'
    ORDER BY created_at
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_workflow_pending_run(
  p_run_id UUID,
  p_status TEXT,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.workflow_pending_runs
  SET
    status = p_status,
    error_message = p_error_message,
    processed_at = now()
  WHERE id = p_run_id;
END;
$$;

-- Improved cron next-run (common patterns; fallback +1 hour)
CREATE OR REPLACE FUNCTION public.calculate_next_run_time(
  cron_expression TEXT,
  timezone TEXT DEFAULT 'UTC'
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_run TIMESTAMPTZ;
  parts TEXT[];
  hour_part INTEGER;
  minute_part INTEGER;
BEGIN
  parts := string_to_array(trim(cron_expression), ' ');

  IF array_length(parts, 1) >= 5 AND parts[1] = '*' AND parts[2] = '*' THEN
    next_run := date_trunc('minute', now()) + INTERVAL '1 minute';
  ELSIF array_length(parts, 1) >= 5 AND parts[1] = '0' AND parts[2] = '*' THEN
    next_run := date_trunc('hour', now()) + INTERVAL '1 hour';
  ELSIF array_length(parts, 1) >= 5 AND parts[1] ~ '^\d+$' AND parts[2] ~ '^\d+$' THEN
    minute_part := parts[1]::INTEGER;
    hour_part := parts[2]::INTEGER;
    next_run := date_trunc('day', now())
      + make_interval(hours => hour_part, mins => minute_part);
    IF next_run <= now() THEN
      next_run := next_run + INTERVAL '1 day';
    END IF;
  ELSE
    next_run := now() + INTERVAL '1 hour';
  END IF;

  RETURN next_run AT TIME ZONE timezone;
END;
$$;

-- DB triggers: patient_created, payment_completed
CREATE OR REPLACE FUNCTION public.trigger_workflow_patient_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.enqueue_workflow_event(
    NEW.clinic_id,
    'patient_created',
    jsonb_build_object(
      'patient_id', NEW.id,
      'patient_name', NEW.name
    ),
    NEW.user_id
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_workflow_payment_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid') THEN
    PERFORM public.enqueue_workflow_event(
      NEW.clinic_id,
      'payment_completed',
      jsonb_build_object(
        'payment_id', NEW.id,
        'patient_name', NEW.patient_name,
        'amount', NEW.amount,
        'currency', NEW.currency
      ),
      NEW.user_id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS workflow_event_patient_created ON public.patients;
CREATE TRIGGER workflow_event_patient_created
  AFTER INSERT ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_workflow_patient_created();

DROP TRIGGER IF EXISTS workflow_event_payment_completed ON public.payments;
CREATE TRIGGER workflow_event_payment_completed
  AFTER UPDATE OF status ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_workflow_payment_completed();

GRANT SELECT ON public.workflow_pending_runs TO authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_workflow_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_workflow_pending_runs TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_workflow_pending_run TO service_role;
