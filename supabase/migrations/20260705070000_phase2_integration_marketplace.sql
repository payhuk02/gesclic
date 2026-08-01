-- Phase 2: Integration Marketplace
-- Migration for Integration Marketplace functionality
-- Enables third-party app integrations, OAuth, webhooks, and app management

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Integration Catalog (App Store)
CREATE TABLE integration_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('ehr', 'medical_device', 'lab', 'imaging', 'billing', 'communication', 'analytics', 'custom')),
  developer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- App Details
  logo_url TEXT,
  screenshots JSONB DEFAULT '[]',
  version TEXT DEFAULT '1.0.0',
  pricing_model TEXT DEFAULT 'free' CHECK (pricing_model IN ('free', 'freemium', 'paid', 'enterprise')),
  pricing_details JSONB DEFAULT '{}',
  
  -- Technical Details
  auth_type TEXT DEFAULT 'api_key' CHECK (auth_type IN ('oauth2', 'api_key', 'basic_auth', 'custom')),
  api_documentation_url TEXT,
  webhook_url TEXT,
  sdk_urls JSONB DEFAULT '{}',
  
  -- Ratings & Reviews
  average_rating DECIMAL(2,1) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_installs INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'deprecated')),
  featured BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Integration Instances (installed apps)
CREATE TABLE integration_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES integration_catalog(id) ON DELETE CASCADE,
  
  -- Configuration
  config JSONB NOT NULL DEFAULT '{}',
  auth_credentials JSONB, -- Encrypted using pgcrypto
  enabled BOOLEAN DEFAULT true,
  
  -- Webhook Configuration
  webhook_url TEXT,
  webhook_events TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Sync Settings
  sync_frequency TEXT DEFAULT 'realtime' CHECK (sync_frequency IN ('realtime', 'hourly', 'daily', 'weekly')),
  last_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error', 'suspended')),
  error_message TEXT,
  
  -- Metadata
  installed_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clinic_id, integration_id)
);

-- Integration Reviews
CREATE TABLE integration_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integration_catalog(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Review
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  review TEXT,
  
  -- Helpful Votes
  helpful_count INTEGER DEFAULT 0,
  
  -- Status
  verified_purchase BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'flagged')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Webhook Events
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_instance_id UUID NOT NULL REFERENCES integration_instances(id) ON DELETE CASCADE,
  
  -- Event Details
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  
  -- Delivery
  delivery_url TEXT NOT NULL,
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'delivered', 'failed', 'retrying')),
  delivery_attempts INTEGER DEFAULT 0,
  last_delivery_attempt TIMESTAMPTZ,
  delivery_response TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ
);

-- OAuth Tokens (for OAuth2 integrations)
CREATE TABLE oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_instance_id UUID NOT NULL REFERENCES integration_instances(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Token Details
  access_token TEXT NOT NULL, -- Encrypted
  refresh_token TEXT, -- Encrypted
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ,
  scope TEXT[],
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(integration_instance_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_integration_catalog_category ON integration_catalog(category);
CREATE INDEX idx_integration_catalog_status ON integration_catalog(status);
CREATE INDEX idx_integration_catalog_featured ON integration_catalog(featured) WHERE featured = true;
CREATE INDEX idx_integration_catalog_rating ON integration_catalog(average_rating DESC);

CREATE INDEX idx_integration_instances_clinic ON integration_instances(clinic_id);
CREATE INDEX idx_integration_instances_integration ON integration_instances(integration_id);
CREATE INDEX idx_integration_instances_status ON integration_instances(status);
CREATE INDEX idx_integration_instances_enabled ON integration_instances(enabled) WHERE enabled = true;

CREATE INDEX idx_integration_reviews_integration ON integration_reviews(integration_id);
CREATE INDEX idx_integration_reviews_clinic ON integration_reviews(clinic_id);
CREATE INDEX idx_integration_reviews_rating ON integration_reviews(rating);

CREATE INDEX idx_webhook_events_instance ON webhook_events(integration_instance_id);
CREATE INDEX idx_webhook_events_status ON webhook_events(delivery_status);
CREATE INDEX idx_webhook_events_created ON webhook_events(created_at DESC);

CREATE INDEX idx_oauth_tokens_instance ON oauth_tokens(integration_instance_id);
CREATE INDEX idx_oauth_tokens_user ON oauth_tokens(user_id);

-- RLS Policies
ALTER TABLE integration_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Integration Catalog RLS
CREATE POLICY "Anyone can view approved integrations" ON integration_catalog
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Developers can manage their integrations" ON integration_catalog
  FOR ALL USING (auth.uid() = developer_id);

CREATE POLICY "Clinic admins can view all integrations" ON integration_catalog
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clinic_members
      WHERE clinic_members.user_id = auth.uid()
      AND clinic_members.role = 'admin'
      AND clinic_members.is_active = true
    )
  );

-- Integration Instances RLS
CREATE POLICY "Clinic members can view their instances" ON integration_instances
  FOR SELECT USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Clinic admins can manage instances" ON integration_instances
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clinic_members
      WHERE clinic_members.user_id = auth.uid()
      AND clinic_members.clinic_id = integration_instances.clinic_id
      AND clinic_members.role = 'admin'
      AND clinic_members.is_active = true
    )
  );

-- Integration Reviews RLS
CREATE POLICY "Anyone can view published reviews" ON integration_reviews
  FOR SELECT USING (status = 'published');

CREATE POLICY "Users can manage their reviews" ON integration_reviews
  FOR ALL USING (auth.uid() = user_id);

-- Webhook Events RLS
CREATE POLICY "Clinic members can view their webhook events" ON webhook_events
  FOR SELECT USING (
    integration_instance_id IN (
      SELECT id FROM integration_instances
      WHERE clinic_id IN (
        SELECT clinic_id FROM clinic_members
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- OAuth Tokens RLS
CREATE POLICY "Users can view their own tokens" ON oauth_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their tokens" ON oauth_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Functions

-- Function to encrypt data
CREATE OR REPLACE FUNCTION encrypt_data(data TEXT, secret_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(extensions.encrypt(data::bytea, secret_key::bytea, 'aes'), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt data
CREATE OR REPLACE FUNCTION decrypt_data(encrypted_data TEXT, secret_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN convert_from(extensions.decrypt(decode(encrypted_data, 'base64'), secret_key::bytea, 'aes'), 'UTF8');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update integration rating
CREATE OR REPLACE FUNCTION update_integration_rating(integration_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE integration_catalog
  SET 
    average_rating = (
      SELECT ROUND(AVG(rating)::numeric, 1) 
      FROM integration_reviews 
      WHERE integration_id = integration_id_param 
      AND status = 'published'
    ),
    total_reviews = (
      SELECT COUNT(*) 
      FROM integration_reviews 
      WHERE integration_id = integration_id_param 
      AND status = 'published'
    )
  WHERE id = integration_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update rating after review insert/update
CREATE OR REPLACE FUNCTION trigger_update_integration_rating()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_integration_rating(NEW.integration_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_integration_rating_trigger
  AFTER INSERT OR UPDATE ON integration_reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_integration_rating();

-- Function to increment install count
CREATE OR REPLACE FUNCTION increment_install_count(integration_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE integration_catalog
  SET total_installs = total_installs + 1
  WHERE id = integration_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to increment install count after instance creation
CREATE OR REPLACE FUNCTION trigger_increment_install_count()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM increment_install_count(NEW.integration_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_install_count_trigger
  AFTER INSERT ON integration_instances
  FOR EACH ROW
  EXECUTE FUNCTION trigger_increment_install_count();

-- Function to retry failed webhooks
CREATE OR REPLACE FUNCTION retry_failed_webhook(event_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  event_record webhook_events%ROWTYPE;
BEGIN
  SELECT * INTO event_record FROM webhook_events WHERE id = event_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  UPDATE webhook_events
  SET 
    delivery_status = 'retrying',
    delivery_attempts = delivery_attempts + 1,
    last_delivery_attempt = now()
  WHERE id = event_id;
  
  -- In a real implementation, this would trigger the actual webhook delivery
  -- via a background worker or queue system
  
  RETURN true;
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
CREATE TRIGGER update_integration_catalog_updated_at BEFORE UPDATE ON integration_catalog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integration_instances_updated_at BEFORE UPDATE ON integration_instances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integration_reviews_updated_at BEFORE UPDATE ON integration_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oauth_tokens_updated_at BEFORE UPDATE ON oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON integration_catalog TO authenticated;
GRANT ALL ON integration_instances TO authenticated;
GRANT ALL ON integration_reviews TO authenticated;
GRANT ALL ON webhook_events TO authenticated;
GRANT ALL ON oauth_tokens TO authenticated;

GRANT EXECUTE ON FUNCTION encrypt_data TO authenticated;
GRANT EXECUTE ON FUNCTION decrypt_data TO authenticated;
GRANT EXECUTE ON FUNCTION update_integration_rating TO authenticated;
GRANT EXECUTE ON FUNCTION increment_install_count TO authenticated;
GRANT EXECUTE ON FUNCTION retry_failed_webhook TO authenticated;
