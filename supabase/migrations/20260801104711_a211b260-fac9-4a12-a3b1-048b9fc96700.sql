-- 1. Fix mutable search_path on public functions
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure::text AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    LEFT JOIN pg_depend d ON d.objid = p.oid AND d.deptype = 'e'
    WHERE n.nspname = 'public'
      AND d.objid IS NULL
      AND p.prokind = 'f'
      AND (p.proconfig IS NULL OR NOT EXISTS (
        SELECT 1 FROM unnest(p.proconfig) c WHERE c LIKE 'search_path=%'))
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', r.sig);
  END LOOP;
END $$;

-- 2. Remove materialized views from the Data API
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT schemaname, matviewname FROM pg_matviews WHERE schemaname = 'public'
  LOOP
    EXECUTE format('REVOKE ALL ON %I.%I FROM anon, authenticated', r.schemaname, r.matviewname);
  END LOOP;
END $$;

-- 3. Restrict EXECUTE on SECURITY DEFINER functions
DO $$
DECLARE
  r record;
  client_fns text[] := ARRAY[
    'accept_clinic_invitation','revoke_clinic_invitation','get_invitation_by_token',
    'create_workflow_execution','complete_workflow_execution','log_workflow_event',
    'get_workflow_analytics','refresh_workflow_analytics','increment_template_usage',
    'log_audit_event','create_security_event','get_clinic_audit_logs',
    'get_patient_message_threads','mark_message_as_read','retry_failed_webhook',
    'generate_api_key','hash_api_key','validate_api_key','check_rate_limit',
    'log_api_request','get_api_usage_summary','refresh_api_usage_analytics',
    'track_analytics_event','get_clinic_analytics_summary','refresh_analytics_views',
    'search_medical_knowledge','has_role','has_clinic_role','is_clinic_member','user_clinic_ids'
  ];
BEGIN
  FOR r IN
    SELECT p.proname, p.oid::regprocedure::text AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    LEFT JOIN pg_depend d ON d.objid = p.oid AND d.deptype = 'e'
    WHERE n.nspname = 'public' AND d.objid IS NULL AND p.prokind = 'f' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
    IF r.proname = ANY(client_fns) THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
    END IF;
    IF r.proname = 'get_invitation_by_token' THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon', r.sig);
    END IF;
  END LOOP;
END $$;

-- 4. Replace always-true INSERT policies with scoped ones
DROP POLICY IF EXISTS "System can insert analytics events" ON public.analytics_events;
CREATE POLICY "Members can insert analytics events for their clinic"
ON public.analytics_events FOR INSERT TO authenticated
WITH CHECK (
  public.is_clinic_member(clinic_id, auth.uid())
  AND (user_id IS NULL OR user_id = auth.uid())
);

DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "Users can insert their own audit logs"
ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid())
  AND (clinic_id IS NULL OR public.is_clinic_member(clinic_id, auth.uid()))
);

DROP POLICY IF EXISTS "System can insert security events" ON public.security_events;
CREATE POLICY "Users can insert their own security events"
ON public.security_events FOR INSERT TO authenticated
WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid())
  AND (clinic_id IS NULL OR public.is_clinic_member(clinic_id, auth.uid()))
);

-- 5. Platform-wide resources: restrict to platform admins (super_admin)
DROP POLICY IF EXISTS "Admins can manage documentation" ON public.api_documentation;
CREATE POLICY "Platform admins can manage documentation"
ON public.api_documentation FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));

DROP POLICY IF EXISTS "Clinic admins can view all integrations" ON public.integration_catalog;
CREATE POLICY "Platform admins can view all integrations"
ON public.integration_catalog FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage medical knowledge" ON public.medical_knowledge;
CREATE POLICY "Platform admins can manage medical knowledge"
ON public.medical_knowledge FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));

DROP POLICY IF EXISTS "Clinic admins can manage templates" ON public.workflow_templates;
CREATE POLICY "Platform admins can manage templates"
ON public.workflow_templates FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- 6. Workflow schedules / variables: scope to the owning clinic's admins
DROP POLICY IF EXISTS "Clinic admins can manage workflow schedules" ON public.workflow_schedules;
CREATE POLICY "Owning clinic admins can manage workflow schedules"
ON public.workflow_schedules FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.workflow_definitions wd
  WHERE wd.id = workflow_schedules.workflow_id
    AND public.has_clinic_role(wd.clinic_id, auth.uid(), 'admin'::public.app_role)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.workflow_definitions wd
  WHERE wd.id = workflow_schedules.workflow_id
    AND public.has_clinic_role(wd.clinic_id, auth.uid(), 'admin'::public.app_role)
));

DROP POLICY IF EXISTS "Clinic admins can manage workflow variables" ON public.workflow_variables;
CREATE POLICY "Owning clinic admins can manage workflow variables"
ON public.workflow_variables FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.workflow_definitions wd
  WHERE wd.id = workflow_variables.workflow_id
    AND public.has_clinic_role(wd.clinic_id, auth.uid(), 'admin'::public.app_role)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.workflow_definitions wd
  WHERE wd.id = workflow_variables.workflow_id
    AND public.has_clinic_role(wd.clinic_id, auth.uid(), 'admin'::public.app_role)
));