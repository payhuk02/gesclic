-- Phase 2: API Platform
-- Migration for API Platform functionality
-- Enables REST API, GraphQL, API keys, rate limiting, and webhook subscriptions

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- API Keys
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  
  -- Key Details
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  
  -- Permissions
  scopes TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Rate Limiting
  rate_limit_tier TEXT DEFAULT 'basic' CHECK (rate_limit_tier IN ('free', 'basic', 'pro', 'enterprise')),
  requests_per_minute INTEGER DEFAULT 60,
  requests_per_day INTEGER DEFAULT 1000,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- API Request Logs
CREATE TABLE api_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  
  -- Request Details
  method TEXT NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
  path TEXT NOT NULL,
  version TEXT DEFAULT 'v1' CHECK (version IN ('v1', 'v2')),
  query_params JSONB,
  request_body JSONB,
  
  -- Response Details
  status_code INTEGER,
  response_body JSONB,
  response_time_ms INTEGER,
  
  -- Metadata
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Webhook Subscriptions
CREATE TABLE webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  
  -- Subscription Details
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  
  -- Security
  secret TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Delivery Stats
  total_delivered INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  last_delivered_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Rate Limit Tracking
CREATE TABLE rate_limit_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  
  -- Time Window
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  
  -- Counters
  request_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(api_key_id, window_start, window_end)
);

-- API Documentation
CREATE TABLE api_documentation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Document Details
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  content JSONB NOT NULL,
  
  -- Ordering
  order_index INTEGER DEFAULT 0,
  
  -- Status
  is_published BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- API Usage Analytics (Materialized View)
CREATE MATERIALIZED VIEW mv_api_usage_analytics AS
SELECT 
  api_key_id,
  DATE_TRUNC('day', created_at) as usage_date,
  COUNT(*) as total_requests,
  AVG(response_time_ms) as avg_response_time,
  SUM(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 ELSE 0 END) as successful_requests,
  SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as failed_requests,
  COUNT(DISTINCT ip_address) as unique_ips
FROM api_request_logs
GROUP BY api_key_id, DATE_TRUNC('day', created_at);

-- Indexes for performance
CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_clinic ON api_keys(clinic_id);
CREATE INDEX idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);

CREATE INDEX idx_api_request_logs_api_key ON api_request_logs(api_key_id);
CREATE INDEX idx_api_request_logs_created ON api_request_logs(created_at DESC);
CREATE INDEX idx_api_request_logs_status ON api_request_logs(status_code);
CREATE INDEX idx_api_request_logs_path ON api_request_logs(path);

CREATE INDEX idx_webhook_subscriptions_user ON webhook_subscriptions(user_id);
CREATE INDEX idx_webhook_subscriptions_clinic ON webhook_subscriptions(clinic_id);
CREATE INDEX idx_webhook_subscriptions_active ON webhook_subscriptions(is_active) WHERE is_active = true;

CREATE INDEX idx_rate_limit_tracking_api_key ON rate_limit_tracking(api_key_id);
CREATE INDEX idx_rate_limit_tracking_window ON rate_limit_tracking(window_start, window_end);

CREATE INDEX idx_api_documentation_category ON api_documentation(category);
CREATE INDEX idx_api_documentation_published ON api_documentation(is_published) WHERE is_published = true;

-- RLS Policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_documentation ENABLE ROW LEVEL SECURITY;

-- API Keys RLS
CREATE POLICY "Users can view their own API keys" ON api_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Clinic members can view clinic API keys" ON api_keys
  FOR SELECT USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can manage their own API keys" ON api_keys
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Clinic admins can manage clinic API keys" ON api_keys
  FOR ALL USING (
    public.has_clinic_role(clinic_id, auth.uid(), 'admin')
  );

-- API Request Logs RLS
CREATE POLICY "Users can view their own request logs" ON api_request_logs
  FOR SELECT USING (
    api_key_id IN (
      SELECT id FROM api_keys WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Clinic members can view clinic request logs" ON api_request_logs
  FOR SELECT USING (
    api_key_id IN (
      SELECT id FROM api_keys 
      WHERE clinic_id IN (
        SELECT clinic_id FROM clinic_members
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- Webhook Subscriptions RLS
CREATE POLICY "Users can view their own webhook subscriptions" ON webhook_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Clinic members can view clinic webhook subscriptions" ON webhook_subscriptions
  FOR SELECT USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can manage their own webhook subscriptions" ON webhook_subscriptions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Clinic admins can manage clinic webhook subscriptions" ON webhook_subscriptions
  FOR ALL USING (
    public.has_clinic_role(clinic_id, auth.uid(), 'admin')
  );

-- Rate Limit Tracking RLS
CREATE POLICY "Service role can manage rate limit tracking" ON rate_limit_tracking
  FOR ALL USING (auth.role() = 'service_role');

-- API Documentation RLS
CREATE POLICY "Anyone can view published documentation" ON api_documentation
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage documentation" ON api_documentation
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clinic_members
      WHERE clinic_members.user_id = auth.uid()
      AND clinic_members.role = 'admin'
      AND clinic_members.is_active = true
    )
  );

-- Functions

-- Function to generate API key
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
DECLARE
  key_prefix TEXT;
  key_secret TEXT;
  full_key TEXT;
  key_hash TEXT;
BEGIN
  key_prefix := 'gsk_' || substr(md5(random()::text), 1, 8);
  key_secret := substr(md5(random()::text), 1, 32);
  full_key := key_prefix || '_' || key_secret;
  key_hash := encode(extensions.digest(full_key, 'sha256'), 'hex');
  
  RETURN full_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to hash API key
CREATE OR REPLACE FUNCTION hash_api_key(api_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(extensions.digest(api_key, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(api_key_id UUID, window_minutes INTEGER DEFAULT 1)
RETURNS BOOLEAN AS $$
DECLARE
  window_start TIMESTAMPTZ;
  window_end TIMESTAMPTZ;
  current_count INTEGER;
  max_requests INTEGER;
BEGIN
  window_start := date_trunc('minute', now() - (window_minutes || ' minutes')::interval);
  window_end := date_trunc('minute', now());
  
  -- Get max requests for this API key
  SELECT requests_per_minute INTO max_requests
  FROM api_keys
  WHERE id = api_key_id;
  
  -- Get current count
  SELECT COALESCE(SUM(request_count), 0) INTO current_count
  FROM rate_limit_tracking
  WHERE api_key_id = api_key_id
  AND window_start >= window_start
  AND window_end <= window_end;
  
  -- Check if limit exceeded
  IF current_count >= max_requests THEN
    RETURN false;
  END IF;
  
  -- Increment counter
  INSERT INTO rate_limit_tracking (api_key_id, window_start, window_end, request_count)
  VALUES (api_key_id, window_start, window_end, 1)
  ON CONFLICT (api_key_id, window_start, window_end)
  DO UPDATE SET request_count = rate_limit_tracking.request_count + 1;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log API request
CREATE OR REPLACE FUNCTION log_api_request(
  p_api_key_id UUID,
  p_method TEXT,
  p_path TEXT,
  p_status_code INTEGER,
  p_response_time_ms INTEGER,
  p_ip_address TEXT,
  p_user_agent TEXT,
  p_version TEXT DEFAULT 'v1',
  p_query_params JSONB DEFAULT '{}',
  p_request_body JSONB DEFAULT '{}',
  p_response_body JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO api_request_logs (
    api_key_id,
    method,
    path,
    version,
    query_params,
    request_body,
    status_code,
    response_body,
    response_time_ms,
    ip_address,
    user_agent
  )
  VALUES (
    p_api_key_id,
    p_method,
    p_path,
    p_version,
    p_query_params,
    p_request_body,
    p_status_code,
    p_response_body,
    p_response_time_ms,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO log_id;
  
  -- Update last used timestamp for API key
  UPDATE api_keys
  SET last_used_at = now()
  WHERE id = p_api_key_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh API usage analytics
CREATE OR REPLACE FUNCTION refresh_api_usage_analytics()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_api_usage_analytics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get API usage summary
CREATE OR REPLACE FUNCTION get_api_usage_summary(api_key_id_param UUID, days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_requests BIGINT,
  avg_response_time DECIMAL,
  success_rate DECIMAL,
  unique_ips BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    SUM(total_requests) as total_requests,
    AVG(avg_response_time) as avg_response_time,
    CASE 
      WHEN SUM(total_requests) > 0 
      THEN (SUM(successful_requests)::DECIMAL / SUM(total_requests)) * 100 
      ELSE 0 
    END as success_rate,
    SUM(unique_ips) as unique_ips
  FROM mv_api_usage_analytics
  WHERE api_key_id = api_key_id_param
  AND usage_date >= now() - (days || ' days')::interval;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate API key
CREATE OR REPLACE FUNCTION validate_api_key(api_key_param TEXT)
RETURNS TABLE (
  api_key_id UUID,
  user_id UUID,
  clinic_id UUID,
  is_valid BOOLEAN,
  is_active BOOLEAN,
  is_expired BOOLEAN
) AS $$
DECLARE
  key_hash TEXT;
  key_record api_keys%ROWTYPE;
BEGIN
  key_hash := encode(extensions.digest(api_key_param, 'sha256'), 'hex');
  
  SELECT * INTO key_record
  FROM api_keys
  WHERE key_hash = key_hash
  AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::UUID, false, false, false;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    key_record.id,
    key_record.user_id,
    key_record.clinic_id,
    true,
    key_record.is_active,
    CASE 
      WHEN key_record.expires_at IS NULL THEN false
      WHEN key_record.expires_at > now() THEN false
      ELSE true
    END;
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
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_subscriptions_updated_at BEFORE UPDATE ON webhook_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_documentation_updated_at BEFORE UPDATE ON api_documentation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON api_keys TO authenticated;
GRANT ALL ON api_request_logs TO authenticated;
GRANT ALL ON webhook_subscriptions TO authenticated;
GRANT ALL ON rate_limit_tracking TO authenticated;
GRANT ALL ON api_documentation TO authenticated;

GRANT SELECT ON mv_api_usage_analytics TO authenticated;

GRANT EXECUTE ON FUNCTION generate_api_key TO authenticated;
GRANT EXECUTE ON FUNCTION hash_api_key TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION log_api_request TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_api_usage_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_api_usage_summary TO authenticated;
GRANT EXECUTE ON FUNCTION validate_api_key TO authenticated;

-- Insert default API documentation
INSERT INTO api_documentation (title, description, category, content, order_index, is_published) VALUES
('Introduction', 'Introduction à l''API Gesclic', 'overview', '{"sections": [{"title": "Bienvenue", "content": "L''API Gesclic permet d''intégrer facilement les fonctionnalités de gestion médicale dans vos applications."}]}', 1, true),
('Authentication', 'Comment authentifier vos requêtes API', 'authentication', '{"sections": [{"title": "API Keys", "content": "Utilisez votre clé API dans l''en-tête Authorization: Bearer YOUR_API_KEY"}]}', 2, true),
('Rate Limiting', 'Limites de taux de requêtes', 'authentication', '{"sections": [{"title": "Limits", "content": "Le plan basic permet 60 requêtes/minute, le plan pro permet 300 requêtes/minute."}]}', 3, true),
('Endpoints', 'Liste des endpoints disponibles', 'endpoints', '{"endpoints": [{"path": "/api/v1/clinics", "method": "GET", "description": "Liste des cliniques"}]}', 4, true),
('Webhooks', 'Configuration des webhooks', 'webhooks', '{"sections": [{"title": "Setup", "content": "Configurez des webhooks pour recevoir des événements en temps réel."}]}', 5, true),
('Errors', 'Codes d''erreur et gestion', 'errors', '{"errors": [{"code": 401, "message": "Unauthorized"}, {"code": 429, "message": "Rate limit exceeded"}]}', 6, true);
