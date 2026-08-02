-- Seed core feature flags used by the application
INSERT INTO public.feature_flags (key, name, description, category, enabled, rollout_percentage)
VALUES
  (
    'telemedicine_enabled',
    'Téléconsultation',
    'Active la fonctionnalité de téléconsultation vidéo pour les cliniques',
    'core',
    true,
    100
  ),
  (
    'ai_assistant_beta',
    'Assistant IA Beta',
    'Assistant IA médical en phase bêta',
    'beta',
    true,
    50
  )
ON CONFLICT (key) DO NOTHING;
