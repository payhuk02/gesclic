-- Cloud recording requires a paid Daily.co plan; keep clinic preference off by default
UPDATE public.telemedicine_settings
SET enable_recording = false
WHERE enable_recording IS TRUE;
