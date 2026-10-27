DROP POLICY IF EXISTS "Anon can read public platform settings" ON public.platform_settings;
CREATE POLICY "Anon can read public platform settings"
  ON public.platform_settings FOR SELECT TO anon
  USING (key IN ('security', 'general', 'legal'));
