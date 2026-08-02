-- Feature flag for workflow automation module
INSERT INTO public.feature_flags (key, name, description, category, enabled, rollout_percentage)
VALUES (
  'workflow_automation_enabled',
  'Automatisation workflows',
  'Active les workflows automatisés et les notifications déclenchées par workflow',
  'core',
  true,
  100
)
ON CONFLICT (key) DO NOTHING;
