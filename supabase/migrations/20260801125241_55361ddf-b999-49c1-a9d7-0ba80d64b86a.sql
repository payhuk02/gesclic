REVOKE SELECT ON public.v_daily_revenue FROM anon;
REVOKE SELECT ON public.v_daily_appointments FROM anon;
REVOKE SELECT ON public.v_provider_performance FROM anon;
GRANT SELECT ON public.v_daily_revenue TO authenticated;
GRANT SELECT ON public.v_daily_appointments TO authenticated;
GRANT SELECT ON public.v_provider_performance TO authenticated;