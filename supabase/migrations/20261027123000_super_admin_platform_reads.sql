-- Super-admins need platform-wide reads for the administration panel.

DROP POLICY IF EXISTS "Super admins can view all appointments" ON public.appointments;
CREATE POLICY "Super admins can view all appointments"
  ON public.appointments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admins can view all payments" ON public.payments;
CREATE POLICY "Super admins can view all payments"
  ON public.payments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admins can view all subscription payments" ON public.subscription_payments;
CREATE POLICY "Super admins can view all subscription payments"
  ON public.subscription_payments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admins can view all api keys" ON public.api_keys;
CREATE POLICY "Super admins can view all api keys"
  ON public.api_keys FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admins can update api keys" ON public.api_keys;
CREATE POLICY "Super admins can update api keys"
  ON public.api_keys FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admins can delete api keys" ON public.api_keys;
CREATE POLICY "Super admins can delete api keys"
  ON public.api_keys FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
