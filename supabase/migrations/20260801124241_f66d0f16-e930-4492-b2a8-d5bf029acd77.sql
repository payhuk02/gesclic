CREATE OR REPLACE VIEW public.v_daily_revenue
WITH (security_barrier = true) AS
SELECT m.clinic_id, m.date, m.transaction_count, m.total_revenue, m.average_transaction, m.unique_patients, m.currencies
FROM public.mv_daily_revenue m
WHERE auth.uid() IS NOT NULL
  AND m.clinic_id IN (SELECT public.user_clinic_ids(auth.uid()));

CREATE OR REPLACE VIEW public.v_daily_appointments
WITH (security_barrier = true) AS
SELECT m.clinic_id, m.date, m.total_appointments, m.completed, m.cancelled, m.no_shows, m.pending
FROM public.mv_daily_appointments m
WHERE auth.uid() IS NOT NULL
  AND m.clinic_id IN (SELECT public.user_clinic_ids(auth.uid()));

CREATE OR REPLACE VIEW public.v_provider_performance
WITH (security_barrier = true) AS
SELECT m.clinic_id, m.provider_id, m.provider_name, m.specialty, m.total_appointments, m.completed_appointments, m.no_shows, m.completion_rate, m.unique_patients_seen
FROM public.mv_provider_performance m
WHERE auth.uid() IS NOT NULL
  AND m.clinic_id IN (SELECT public.user_clinic_ids(auth.uid()));

REVOKE ALL ON public.mv_daily_revenue FROM anon, authenticated;
REVOKE ALL ON public.mv_daily_appointments FROM anon, authenticated;
REVOKE ALL ON public.mv_provider_performance FROM anon, authenticated;

GRANT SELECT ON public.v_daily_revenue TO authenticated;
GRANT SELECT ON public.v_daily_appointments TO authenticated;
GRANT SELECT ON public.v_provider_performance TO authenticated;
GRANT ALL ON public.mv_daily_revenue TO service_role;
GRANT ALL ON public.mv_daily_appointments TO service_role;
GRANT ALL ON public.mv_provider_performance TO service_role;
GRANT SELECT ON public.v_daily_revenue TO service_role;
GRANT SELECT ON public.v_daily_appointments TO service_role;
GRANT SELECT ON public.v_provider_performance TO service_role;