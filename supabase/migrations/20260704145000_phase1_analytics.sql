-- Phase 1: Advanced Analytics
-- This migration creates tables and views for analytics and reporting

-- Analytics Events Table (for tracking user actions)
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_type TEXT CHECK (user_type IN ('provider', 'admin', 'staff', 'patient')),
  
  -- Event Details
  event_name TEXT NOT NULL,
  event_category TEXT NOT NULL,
  event_properties JSONB,
  
  -- Context
  page_url TEXT,
  referrer_url TEXT,
  user_agent TEXT,
  
  -- Timing
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_analytics_events_clinic ON public.analytics_events(clinic_id);
CREATE INDEX idx_analytics_events_user ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_events_name ON public.analytics_events(event_name);
CREATE INDEX idx_analytics_events_category ON public.analytics_events(event_category);
CREATE INDEX idx_analytics_events_created ON public.analytics_events(created_at DESC);

-- Row Level Security
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Policies: Clinic members can view analytics events
CREATE POLICY "Clinic members can view analytics events"
  ON public.analytics_events FOR SELECT
  TO authenticated
  USING (public.is_clinic_member(clinic_id, auth.uid()));

-- Policies: System can insert analytics events
CREATE POLICY "System can insert analytics events"
  ON public.analytics_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Materialized View: Daily Revenue
CREATE MATERIALIZED VIEW public.mv_daily_revenue AS
SELECT 
  clinic_id,
  DATE(created_at) as date,
  COUNT(*) as transaction_count,
  SUM(amount) as total_revenue,
  AVG(amount) as average_transaction,
  COUNT(DISTINCT patient_name) as unique_patients,
  ARRAY_AGG(DISTINCT currency) as currencies
FROM public.payments
WHERE status = 'completed'
GROUP BY clinic_id, DATE(created_at);

CREATE UNIQUE INDEX idx_mv_daily_revenue ON public.mv_daily_revenue(clinic_id, date);

-- Materialized View: Daily Appointments
CREATE MATERIALIZED VIEW public.mv_daily_appointments AS
SELECT 
  clinic_id,
  DATE(created_at) as date,
  COUNT(*) as total_appointments,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
  SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) as no_shows,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
FROM public.appointments
GROUP BY clinic_id, DATE(created_at);

CREATE UNIQUE INDEX idx_mv_daily_appointments ON public.mv_daily_appointments(clinic_id, date);

-- Materialized View: Provider Performance
CREATE MATERIALIZED VIEW public.mv_provider_performance AS
SELECT 
  d.clinic_id,
  d.id as provider_id,
  d.name as provider_name,
  d.specialty,
  COUNT(DISTINCT a.id) as total_appointments,
  SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completed_appointments,
  SUM(CASE WHEN a.status = 'no_show' THEN 1 ELSE 0 END) as no_shows,
  ROUND(
    (SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END)::FLOAT / 
     NULLIF(COUNT(*), 0)) * 100, 2
  ) as completion_rate,
  COUNT(DISTINCT a.patient_name) as unique_patients_seen
FROM public.doctors d
LEFT JOIN public.appointments a ON d.user_id = a.user_id
GROUP BY d.clinic_id, d.id, d.name, d.specialty;

CREATE UNIQUE INDEX idx_mv_provider_performance ON public.mv_provider_performance(clinic_id, provider_id);

-- Function to refresh analytics materialized views
CREATE OR REPLACE FUNCTION public.refresh_analytics_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_daily_revenue;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_daily_appointments;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_provider_performance;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.refresh_analytics_views FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_analytics_views TO authenticated, service_role;

-- Function to track analytics event
CREATE OR REPLACE FUNCTION public.track_analytics_event(
  p_clinic_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_user_type TEXT DEFAULT NULL,
  p_event_name TEXT,
  p_event_category TEXT,
  p_event_properties JSONB DEFAULT NULL,
  p_page_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.analytics_events (
    clinic_id,
    user_id,
    user_type,
    event_name,
    event_category,
    event_properties,
    page_url,
    user_agent
  ) VALUES (
    p_clinic_id,
    p_user_id,
    p_user_type,
    p_event_name,
    p_event_category,
    p_event_properties,
    p_page_url,
    current_setting('request.headers.user-agent', true)
  ) RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.track_analytics_event FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_analytics_event TO authenticated;

-- Function to get clinic analytics summary
CREATE OR REPLACE FUNCTION public.get_clinic_analytics_summary(
  p_clinic_id UUID,
  p_start_date DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days'),
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'revenue', (
      SELECT json_agg(
        json_build_object(
          'date', date,
          'total_revenue', total_revenue,
          'transaction_count', transaction_count,
          'unique_patients', unique_patients
        )
      )
      FROM public.mv_daily_revenue
      WHERE clinic_id = p_clinic_id
        AND date BETWEEN p_start_date AND p_end_date
    ),
    'appointments', (
      SELECT json_agg(
        json_build_object(
          'date', date,
          'total', total_appointments,
          'completed', completed,
          'cancelled', cancelled,
          'no_shows', no_shows
        )
      )
      FROM public.mv_daily_appointments
      WHERE clinic_id = p_clinic_id
        AND date BETWEEN p_start_date AND p_end_date
    ),
    'providers', (
      SELECT json_agg(
        json_build_object(
          'provider_id', provider_id,
          'provider_name', provider_name,
          'specialty', specialty,
          'total_appointments', total_appointments,
          'completion_rate', completion_rate,
          'unique_patients', unique_patients_seen
        )
      )
      FROM public.mv_provider_performance
      WHERE clinic_id = p_clinic_id
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_clinic_analytics_summary FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_clinic_analytics_summary TO authenticated;

-- Grant read access on materialized views to authenticated users
GRANT SELECT ON public.mv_daily_revenue TO authenticated;
GRANT SELECT ON public.mv_daily_appointments TO authenticated;
GRANT SELECT ON public.mv_provider_performance TO authenticated;
