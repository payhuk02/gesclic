-- Fix ambiguous column references in get_api_usage_summary (PostgreSQL 42702)

CREATE OR REPLACE FUNCTION public.get_api_usage_summary(api_key_id_param UUID, days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_requests BIGINT,
  avg_response_time DECIMAL,
  success_rate DECIMAL,
  unique_ips BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(m.total_requests), 0)::BIGINT,
    COALESCE(AVG(m.avg_response_time), 0)::DECIMAL,
    CASE
      WHEN COALESCE(SUM(m.total_requests), 0) > 0
      THEN (COALESCE(SUM(m.successful_requests), 0)::DECIMAL / SUM(m.total_requests)) * 100
      ELSE 0
    END::DECIMAL,
    COALESCE(SUM(m.unique_ips), 0)::BIGINT
  FROM public.mv_api_usage_analytics m
  WHERE m.api_key_id = api_key_id_param
    AND m.usage_date >= now() - (days || ' days')::interval;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_api_usage_summary(UUID, INTEGER) TO authenticated;
