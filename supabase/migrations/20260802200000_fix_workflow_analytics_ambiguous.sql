-- Fix ambiguous column references in get_workflow_analytics (PostgreSQL 42702)

CREATE OR REPLACE FUNCTION public.get_workflow_analytics(workflow_id_param UUID, days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_executions BIGINT,
  successful_executions BIGINT,
  failed_executions BIGINT,
  success_rate DECIMAL,
  avg_duration_seconds DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(m.total_executions), 0)::BIGINT,
    COALESCE(SUM(m.successful_executions), 0)::BIGINT,
    COALESCE(SUM(m.failed_executions), 0)::BIGINT,
    CASE
      WHEN COALESCE(SUM(m.total_executions), 0) > 0
      THEN (COALESCE(SUM(m.successful_executions), 0)::DECIMAL / SUM(m.total_executions)) * 100
      ELSE 0
    END::DECIMAL,
    COALESCE(AVG(m.avg_duration_seconds), 0)::DECIMAL
  FROM public.mv_workflow_analytics m
  WHERE m.workflow_id = workflow_id_param
    AND m.execution_date >= now() - (days || ' days')::interval;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_workflow_analytics(UUID, INTEGER) TO authenticated;
