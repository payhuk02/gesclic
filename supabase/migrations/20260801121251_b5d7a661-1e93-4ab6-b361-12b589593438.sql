
CREATE TABLE public.ai_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  label text NOT NULL,
  base_url text NOT NULL,
  default_model text,
  api_key text,
  api_key_last4 text,
  enabled boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ai_providers TO service_role;
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ai_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  provider_id uuid REFERENCES public.ai_providers(id) ON DELETE SET NULL,
  model text,
  temperature numeric NOT NULL DEFAULT 0.3,
  max_tokens integer NOT NULL DEFAULT 2048,
  system_prompt text,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_features TO authenticated;
GRANT ALL ON public.ai_features TO service_role;
ALTER TABLE public.ai_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins can view ai features"
ON public.ai_features FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE TABLE public.ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key text,
  provider text,
  model text,
  status text NOT NULL,
  latency_ms integer,
  total_tokens integer,
  error text,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_usage_logs TO authenticated;
GRANT ALL ON public.ai_usage_logs TO service_role;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins can view ai usage logs"
ON public.ai_usage_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));
CREATE INDEX ai_usage_logs_created_at_idx ON public.ai_usage_logs (created_at DESC);

CREATE TRIGGER update_ai_providers_updated_at BEFORE UPDATE ON public.ai_providers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ai_features_updated_at BEFORE UPDATE ON public.ai_features
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.ai_providers (provider, label, base_url, default_model, enabled, priority)
VALUES
 ('lovable', 'Lovable AI Gateway', 'https://ai.gateway.lovable.dev/v1', 'google/gemini-3.6-flash', true, 10),
 ('openrouter', 'OpenRouter', 'https://openrouter.ai/api/v1', 'openai/gpt-4o-mini', false, 20),
 ('openai', 'OpenAI', 'https://api.openai.com/v1', 'gpt-4o-mini', false, 30),
 ('gemini', 'Google Gemini', 'https://generativelanguage.googleapis.com/v1beta/openai', 'gemini-2.5-flash', false, 40),
 ('anthropic', 'Anthropic Claude', 'https://api.anthropic.com/v1', 'claude-3-5-sonnet-latest', false, 50);

INSERT INTO public.ai_features (feature_key, label, description, temperature, max_tokens, system_prompt, enabled)
VALUES
 ('diagnostic', 'Assistant diagnostic', 'Aide au raisonnement clinique à partir des symptômes', 0.3, 2048,
  'Tu es un assistant médical IA spécialisé dans l''aide au diagnostic. Tu ne poses PAS de diagnostic définitif, tu fournis des pistes. Réponds en français, de façon structurée : analyse des symptômes, diagnostics possibles, examens recommandés, signaux d''alerte.', true),
 ('summary', 'Résumé de dossier', 'Synthèse structurée d''un dossier médical', 0.2, 2048,
  'Tu es un assistant médical IA spécialisé dans le résumé de dossiers médicaux. Réponds en français : résumé patient, historique, traitements en cours, points d''attention.', true);
