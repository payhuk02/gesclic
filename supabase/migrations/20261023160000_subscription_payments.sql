-- Migration: Create subscription_payments table for MoneyFusion payments
CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  plan text NOT NULL CHECK (plan IN ('essentiel', 'pro', 'premium', 'custom')),
  billing_months integer NOT NULL DEFAULT 1 CHECK (billing_months IN (1, 3, 6, 12)),
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'XOF',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  payment_method text NOT NULL DEFAULT 'moneyfusion',
  client_name text,
  phone_number text,
  moneyfusion_token text,
  moneyfusion_url text,
  moneyfusion_transaction_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_payments_clinic ON public.subscription_payments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_token ON public.subscription_payments(moneyfusion_token);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON public.subscription_payments(status);

-- Automatic updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_subscription_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_subscription_payments_updated_at ON public.subscription_payments;
CREATE TRIGGER trg_subscription_payments_updated_at
  BEFORE UPDATE ON public.subscription_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_subscription_payments_updated_at();

-- RLS
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

-- Clinic members can view subscription payments for their clinic
DROP POLICY IF EXISTS "Clinic members can view subscription payments" ON public.subscription_payments;
CREATE POLICY "Clinic members can view subscription payments"
  ON public.subscription_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clinic_members cm
      WHERE cm.clinic_id = subscription_payments.clinic_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  );

-- Clinic admins can insert subscription payments
DROP POLICY IF EXISTS "Clinic admins can insert subscription payments" ON public.subscription_payments;
CREATE POLICY "Clinic admins can insert subscription payments"
  ON public.subscription_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clinic_members cm
      WHERE cm.clinic_id = subscription_payments.clinic_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
        AND cm.is_active = true
    )
  );

-- Clinic admins can update subscription payments
DROP POLICY IF EXISTS "Clinic admins can update subscription payments" ON public.subscription_payments;
CREATE POLICY "Clinic admins can update subscription payments"
  ON public.subscription_payments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clinic_members cm
      WHERE cm.clinic_id = subscription_payments.clinic_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
        AND cm.is_active = true
    )
  );

GRANT ALL ON public.subscription_payments TO authenticated;
GRANT ALL ON public.subscription_payments TO service_role;
