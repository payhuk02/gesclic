-- Phase 2: Workflow Automation
-- Migration for Workflow Automation functionality
-- Enables visual workflow builder, triggers, actions, and automation

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Workflow Definitions
CREATE TABLE workflow_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Workflow Details
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('appointment', 'patient', 'billing', 'notification', 'custom')),
  
  -- Workflow Definition (JSON)
  definition JSONB NOT NULL DEFAULT '{"nodes": [], "edges": [], "triggers": []}',
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  version INTEGER DEFAULT 1,
  
  -- Execution Stats
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0,
  last_execution_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Workflow Executions
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  triggered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Execution Context
  trigger_type TEXT CHECK (trigger_type IN ('manual', 'event', 'schedule', 'webhook')),
  trigger_data JSONB DEFAULT '{}',
  input_data JSONB DEFAULT '{}',
  
  -- Execution State
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled', 'paused')),
  current_node_id TEXT,
  execution_state JSONB DEFAULT '{}',
  
  -- Results
  output_data JSONB DEFAULT '{}',
  error_message TEXT,
  error_details JSONB DEFAULT '{}',
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER
);

-- Workflow Logs
CREATE TABLE workflow_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  
  -- Log Details
  level TEXT CHECK (level IN ('info', 'warning', 'error', 'debug')),
  node_id TEXT,
  message TEXT,
  data JSONB DEFAULT '{}',
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Workflow Templates
CREATE TABLE workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template Details
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('appointment', 'patient', 'billing', 'notification', 'custom')),
  
  -- Template Definition
  definition JSONB NOT NULL DEFAULT '{"nodes": [], "edges": [], "triggers": []}',
  
  -- Metadata
  is_public BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Workflow Schedules (for scheduled triggers)
CREATE TABLE workflow_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  
  -- Schedule Details
  cron_expression TEXT NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Workflow Variables (for storing workflow state)
CREATE TABLE workflow_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  
  -- Variable Details
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  variable_type TEXT DEFAULT 'string' CHECK (variable_type IN ('string', 'number', 'boolean', 'object', 'array')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workflow_id, key)
);

-- Workflow Analytics (Materialized View)
CREATE MATERIALIZED VIEW mv_workflow_analytics AS
SELECT 
  workflow_id,
  DATE_TRUNC('day', started_at) as execution_date,
  COUNT(*) as total_executions,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_executions,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_executions,
  AVG(duration_seconds) as avg_duration_seconds,
  SUM(duration_seconds) as total_duration_seconds
FROM workflow_executions
GROUP BY workflow_id, DATE_TRUNC('day', started_at);

-- Indexes for performance
CREATE INDEX idx_workflow_definitions_clinic ON workflow_definitions(clinic_id);
CREATE INDEX idx_workflow_definitions_created_by ON workflow_definitions(created_by);
CREATE INDEX idx_workflow_definitions_status ON workflow_definitions(status);
CREATE INDEX idx_workflow_definitions_category ON workflow_definitions(category);

CREATE INDEX idx_workflow_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_workflow_executions_started ON workflow_executions(started_at DESC);
CREATE INDEX idx_workflow_executions_triggered_by ON workflow_executions(triggered_by);

CREATE INDEX idx_workflow_logs_execution ON workflow_logs(execution_id);
CREATE INDEX idx_workflow_logs_level ON workflow_logs(level);
CREATE INDEX idx_workflow_logs_created ON workflow_logs(created_at DESC);

CREATE INDEX idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX idx_workflow_templates_public ON workflow_templates(is_public) WHERE is_public = true;

CREATE INDEX idx_workflow_schedules_workflow ON workflow_schedules(workflow_id);
CREATE INDEX idx_workflow_schedules_active ON workflow_schedules(is_active) WHERE is_active = true;
CREATE INDEX idx_workflow_schedules_next_run ON workflow_schedules(next_run_at);

CREATE INDEX idx_workflow_variables_workflow ON workflow_variables(workflow_id);
CREATE INDEX idx_workflow_variables_key ON workflow_variables(key);

-- RLS Policies
ALTER TABLE workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_variables ENABLE ROW LEVEL SECURITY;

-- Workflow Definitions RLS
CREATE POLICY "Clinic members can view their workflows" ON workflow_definitions
  FOR SELECT USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Clinic admins can manage workflows" ON workflow_definitions
  FOR ALL USING (
    public.has_clinic_role(clinic_id, auth.uid(), 'admin')
  );

-- Workflow Executions RLS
CREATE POLICY "Clinic members can view their workflow executions" ON workflow_executions
  FOR SELECT USING (
    workflow_id IN (
      SELECT id FROM workflow_definitions
      WHERE clinic_id IN (
        SELECT clinic_id FROM clinic_members
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- Workflow Logs RLS
CREATE POLICY "Clinic members can view their workflow logs" ON workflow_logs
  FOR SELECT USING (
    execution_id IN (
      SELECT id FROM workflow_executions
      WHERE workflow_id IN (
        SELECT id FROM workflow_definitions
        WHERE clinic_id IN (
          SELECT clinic_id FROM clinic_members
          WHERE user_id = auth.uid() AND is_active = true
        )
      )
    )
  );

-- Workflow Templates RLS
CREATE POLICY "Anyone can view public templates" ON workflow_templates
  FOR SELECT USING (is_public = true);

CREATE POLICY "Clinic admins can manage templates" ON workflow_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clinic_members
      WHERE clinic_members.user_id = auth.uid()
      AND clinic_members.role = 'admin'
      AND clinic_members.is_active = true
    )
  );

-- Workflow Schedules RLS
CREATE POLICY "Clinic members can view their workflow schedules" ON workflow_schedules
  FOR SELECT USING (
    workflow_id IN (
      SELECT id FROM workflow_definitions
      WHERE clinic_id IN (
        SELECT clinic_id FROM clinic_members
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

CREATE POLICY "Clinic admins can manage workflow schedules" ON workflow_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clinic_members
      WHERE clinic_members.user_id = auth.uid()
      AND clinic_members.role = 'admin'
      AND clinic_members.is_active = true
    )
  );

-- Workflow Variables RLS
CREATE POLICY "Clinic members can view their workflow variables" ON workflow_variables
  FOR SELECT USING (
    workflow_id IN (
      SELECT id FROM workflow_definitions
      WHERE clinic_id IN (
        SELECT clinic_id FROM clinic_members
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

CREATE POLICY "Clinic admins can manage workflow variables" ON workflow_variables
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clinic_members
      WHERE clinic_members.user_id = auth.uid()
      AND clinic_members.role = 'admin'
      AND clinic_members.is_active = true
    )
  );

-- Functions

-- Function to create workflow execution
CREATE OR REPLACE FUNCTION create_workflow_execution(
  p_workflow_id UUID,
  p_trigger_type TEXT,
  p_trigger_data JSONB DEFAULT '{}',
  p_input_data JSONB DEFAULT '{}',
  p_triggered_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  execution_id UUID;
BEGIN
  INSERT INTO workflow_executions (
    workflow_id,
    trigger_type,
    trigger_data,
    input_data,
    triggered_by,
    status
  )
  VALUES (
    p_workflow_id,
    p_trigger_type,
    p_trigger_data,
    p_input_data,
    p_triggered_by,
    'running'
  )
  RETURNING id INTO execution_id;
  
  -- Update workflow execution stats
  UPDATE workflow_definitions
  SET 
    total_executions = total_executions + 1,
    last_execution_at = now()
  WHERE id = p_workflow_id;
  
  RETURN execution_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete workflow execution
CREATE OR REPLACE FUNCTION complete_workflow_execution(
  p_execution_id UUID,
  p_status TEXT,
  p_output_data JSONB DEFAULT '{}',
  p_error_message TEXT DEFAULT NULL,
  p_error_details JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
DECLARE
  workflow_id UUID;
  duration_seconds INTEGER;
BEGIN
  -- Get workflow_id and calculate duration
  SELECT workflow_id, EXTRACT(EPOCH FROM (now() - started_at))::INTEGER
  INTO workflow_id, duration_seconds
  FROM workflow_executions
  WHERE id = p_execution_id;
  
  -- Update execution
  UPDATE workflow_executions
  SET 
    status = p_status,
    output_data = p_output_data,
    error_message = p_error_message,
    error_details = p_error_details,
    completed_at = now(),
    duration_seconds = duration_seconds
  WHERE id = p_execution_id;
  
  -- Update workflow stats
  IF p_status = 'completed' THEN
    UPDATE workflow_definitions
    SET successful_executions = successful_executions + 1
    WHERE id = workflow_id;
  ELSIF p_status = 'failed' THEN
    UPDATE workflow_definitions
    SET failed_executions = failed_executions + 1
    WHERE id = workflow_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log workflow event
CREATE OR REPLACE FUNCTION log_workflow_event(
  p_execution_id UUID,
  p_level TEXT,
  p_message TEXT,
  p_node_id TEXT DEFAULT NULL,
  p_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO workflow_logs (
    execution_id,
    level,
    node_id,
    message,
    data
  )
  VALUES (
    p_execution_id,
    p_level,
    p_node_id,
    p_message,
    p_data
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get workflow analytics
CREATE OR REPLACE FUNCTION get_workflow_analytics(workflow_id_param UUID, days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_executions BIGINT,
  successful_executions BIGINT,
  failed_executions BIGINT,
  success_rate DECIMAL,
  avg_duration_seconds DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    SUM(total_executions) as total_executions,
    SUM(successful_executions) as successful_executions,
    SUM(failed_executions) as failed_executions,
    CASE 
      WHEN SUM(total_executions) > 0 
      THEN (SUM(successful_executions)::DECIMAL / SUM(total_executions)) * 100 
      ELSE 0 
    END as success_rate,
    AVG(avg_duration_seconds) as avg_duration_seconds
  FROM mv_workflow_analytics
  WHERE workflow_id = workflow_id_param
  AND execution_date >= now() - (days || ' days')::interval;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh workflow analytics
CREATE OR REPLACE FUNCTION refresh_workflow_analytics()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_workflow_analytics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment template usage
CREATE OR REPLACE FUNCTION increment_template_usage(template_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE workflow_templates
  SET usage_count = usage_count + 1
  WHERE id = template_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate next run time for cron schedule
CREATE OR REPLACE FUNCTION calculate_next_run_time(cron_expression TEXT, timezone TEXT DEFAULT 'UTC')
RETURNS TIMESTAMPTZ AS $$
DECLARE
  next_run TIMESTAMPTZ;
BEGIN
  -- This is a simplified implementation
  -- In a real implementation, use a proper cron library
  -- For now, assume hourly execution
  next_run := now() + INTERVAL '1 hour';
  
  RETURN next_run AT TIME ZONE timezone;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update workflow schedule
CREATE OR REPLACE FUNCTION update_workflow_schedule(schedule_id_param UUID)
RETURNS VOID AS $$
DECLARE
  workflow_id UUID;
  cron_expr TEXT;
  tz TEXT;
  next_run TIMESTAMPTZ;
BEGIN
  -- Get schedule details
  SELECT workflow_id, cron_expression, timezone
  INTO workflow_id, cron_expr, tz
  FROM workflow_schedules
  WHERE id = schedule_id_param;
  
  -- Calculate next run time
  next_run := calculate_next_run_time(cron_expr, tz);
  
  -- Update schedule
  UPDATE workflow_schedules
  SET 
    last_run_at = now(),
    next_run_at = next_run
  WHERE id = schedule_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated_at triggers
CREATE TRIGGER update_workflow_definitions_updated_at BEFORE UPDATE ON workflow_definitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_templates_updated_at BEFORE UPDATE ON workflow_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_schedules_updated_at BEFORE UPDATE ON workflow_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_variables_updated_at BEFORE UPDATE ON workflow_variables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON workflow_definitions TO authenticated;
GRANT ALL ON workflow_executions TO authenticated;
GRANT ALL ON workflow_logs TO authenticated;
GRANT ALL ON workflow_templates TO authenticated;
GRANT ALL ON workflow_schedules TO authenticated;
GRANT ALL ON workflow_variables TO authenticated;

GRANT SELECT ON mv_workflow_analytics TO authenticated;

GRANT EXECUTE ON FUNCTION create_workflow_execution TO authenticated;
GRANT EXECUTE ON FUNCTION complete_workflow_execution TO authenticated;
GRANT EXECUTE ON FUNCTION log_workflow_event TO authenticated;
GRANT EXECUTE ON FUNCTION get_workflow_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_workflow_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION increment_template_usage TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_next_run_time TO authenticated;
GRANT EXECUTE ON FUNCTION update_workflow_schedule TO authenticated;

-- Insert default workflow templates
INSERT INTO workflow_templates (name, description, category, definition, is_public) VALUES
('Appointment Reminder', 'Envoyer un rappel automatique avant un rendez-vous', 'appointment', '{"nodes": [{"id": "trigger", "type": "trigger", "config": {"type": "schedule", "cron": "0 9 * * *"}}, {"id": "action", "type": "action", "config": {"type": "notification", "template": "appointment_reminder"}}], "edges": [{"source": "trigger", "target": "action"}], "triggers": [{"id": "trigger", "type": "schedule", "config": {"cron": "0 9 * * *"}}]}', true),
('Patient Welcome', 'Envoi automatique d''un message de bienvenue aux nouveaux patients', 'patient', '{"nodes": [{"id": "trigger", "type": "trigger", "config": {"type": "event", "event": "patient_created"}}, {"id": "action", "type": "action", "config": {"type": "notification", "template": "patient_welcome"}}], "edges": [{"source": "trigger", "target": "action"}], "triggers": [{"id": "trigger", "type": "event", "config": {"event": "patient_created"}}]}', true),
('Payment Confirmation', 'Confirmation automatique après paiement réussi', 'billing', '{"nodes": [{"id": "trigger", "type": "trigger", "config": {"type": "event", "event": "payment_completed"}}, {"id": "action", "type": "action", "config": {"type": "notification", "template": "payment_confirmation"}}], "edges": [{"source": "trigger", "target": "action"}], "triggers": [{"id": "trigger", "type": "event", "config": {"event": "payment_completed"}}]}', true);
