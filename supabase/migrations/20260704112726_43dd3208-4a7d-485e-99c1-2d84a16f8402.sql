
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS logo_url text;
