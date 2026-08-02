-- Short customizable patient join code (e.g. gesclic.vercel.app/t/abc12xyz)

CREATE OR REPLACE FUNCTION public.generate_patient_join_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars constant text := 'abcdefghjkmnpqrstuvwxyz23456789';
  candidate text;
  tries int := 0;
BEGIN
  LOOP
    candidate := '';
    FOR i IN 1..8 LOOP
      candidate := candidate || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.telemedicine_sessions WHERE patient_join_code = candidate
    );
    tries := tries + 1;
    IF tries > 30 THEN
      RAISE EXCEPTION 'Could not generate unique patient_join_code';
    END IF;
  END LOOP;
  RETURN candidate;
END;
$$;

ALTER TABLE public.telemedicine_sessions
  ADD COLUMN IF NOT EXISTS patient_join_code text;

UPDATE public.telemedicine_sessions
SET patient_join_code = public.generate_patient_join_code()
WHERE patient_join_code IS NULL;

ALTER TABLE public.telemedicine_sessions
  ALTER COLUMN patient_join_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_telemedicine_sessions_patient_join_code
  ON public.telemedicine_sessions (patient_join_code);

ALTER TABLE public.telemedicine_sessions
  DROP CONSTRAINT IF EXISTS telemedicine_sessions_join_code_format;

ALTER TABLE public.telemedicine_sessions
  ADD CONSTRAINT telemedicine_sessions_join_code_format
  CHECK (patient_join_code ~ '^[a-z0-9][a-z0-9_-]{3,31}$');
