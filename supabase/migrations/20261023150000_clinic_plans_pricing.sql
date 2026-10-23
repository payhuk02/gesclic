-- New commercial plans: essentiel / pro / premium / custom
-- Must drop CHECK before remapping values

ALTER TABLE public.clinics DROP CONSTRAINT IF EXISTS clinics_plan_check;

UPDATE public.clinics
SET plan = CASE plan
  WHEN 'free' THEN 'essentiel'
  WHEN 'standard' THEN 'essentiel'
  WHEN 'enterprise' THEN 'custom'
  ELSE plan
END
WHERE plan IN ('free', 'standard', 'enterprise');

ALTER TABLE public.clinics
  ALTER COLUMN plan SET DEFAULT 'essentiel';

ALTER TABLE public.clinics
  ADD CONSTRAINT clinics_plan_check
  CHECK (plan IN ('essentiel', 'pro', 'premium', 'custom'));
