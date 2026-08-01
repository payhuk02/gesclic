-- Requires pgcrypto for gen_random_bytes()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Table for clinic invitations
CREATE TABLE public.clinic_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.app_role NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(24), 'hex'),
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clinic_invitations_status_check CHECK (status IN ('pending','accepted','revoked','expired'))
);

CREATE INDEX idx_clinic_invitations_clinic ON public.clinic_invitations(clinic_id);
CREATE INDEX idx_clinic_invitations_email ON public.clinic_invitations(lower(email));
CREATE INDEX idx_clinic_invitations_token ON public.clinic_invitations(token);

-- Prevent duplicate active invites for the same email/clinic
CREATE UNIQUE INDEX uniq_clinic_invitations_pending
  ON public.clinic_invitations(clinic_id, lower(email))
  WHERE status = 'pending';

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinic_invitations TO authenticated;
GRANT ALL ON public.clinic_invitations TO service_role;

-- RLS
ALTER TABLE public.clinic_invitations ENABLE ROW LEVEL SECURITY;

-- Admins of the clinic can view invitations
CREATE POLICY "Clinic admins can view invitations"
  ON public.clinic_invitations
  FOR SELECT
  TO authenticated
  USING (public.has_clinic_role(clinic_id, auth.uid(), 'admin'::public.app_role));

-- Admins can create invitations for their clinic
CREATE POLICY "Clinic admins can create invitations"
  ON public.clinic_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_clinic_role(clinic_id, auth.uid(), 'admin'::public.app_role)
    AND invited_by = auth.uid()
  );

-- Admins can update (e.g. revoke) invitations of their clinic
CREATE POLICY "Clinic admins can update invitations"
  ON public.clinic_invitations
  FOR UPDATE
  TO authenticated
  USING (public.has_clinic_role(clinic_id, auth.uid(), 'admin'::public.app_role));

-- Admins can delete
CREATE POLICY "Clinic admins can delete invitations"
  ON public.clinic_invitations
  FOR DELETE
  TO authenticated
  USING (public.has_clinic_role(clinic_id, auth.uid(), 'admin'::public.app_role));

-- Trigger updated_at
CREATE TRIGGER trg_clinic_invitations_updated_at
  BEFORE UPDATE ON public.clinic_invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SECURITY DEFINER RPC: fetch invitation by token (any authenticated user can preview)
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(_token text)
RETURNS TABLE (
  id uuid,
  clinic_id uuid,
  clinic_name text,
  email text,
  role public.app_role,
  status text,
  expires_at timestamptz,
  invited_by_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    i.id,
    i.clinic_id,
    c.name AS clinic_name,
    i.email,
    i.role,
    CASE
      WHEN i.status = 'pending' AND i.expires_at < now() THEN 'expired'
      ELSE i.status
    END AS status,
    i.expires_at,
    COALESCE(p.first_name || ' ' || p.last_name, 'Un administrateur') AS invited_by_name
  FROM public.clinic_invitations i
  JOIN public.clinics c ON c.id = i.clinic_id
  LEFT JOIN public.profiles p ON p.user_id = i.invited_by
  WHERE i.token = _token
$$;

GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(text) TO authenticated, anon;

-- SECURITY DEFINER RPC: accept invitation for the current user
CREATE OR REPLACE FUNCTION public.accept_clinic_invitation(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.clinic_invitations%ROWTYPE;
  v_user_email text;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO v_invite FROM public.clinic_invitations WHERE token = _token FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF v_invite.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'error', v_invite.status);
  END IF;

  IF v_invite.expires_at < now() THEN
    UPDATE public.clinic_invitations SET status = 'expired' WHERE id = v_invite.id;
    RETURN jsonb_build_object('ok', false, 'error', 'expired');
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = v_uid;
  IF lower(v_user_email) <> lower(v_invite.email) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'email_mismatch', 'expected', v_invite.email);
  END IF;

  -- Insert membership (reactivate if previously deactivated)
  INSERT INTO public.clinic_members (clinic_id, user_id, role, invited_by, is_active)
  VALUES (v_invite.clinic_id, v_uid, v_invite.role, v_invite.invited_by, true)
  ON CONFLICT (clinic_id, user_id)
  DO UPDATE SET role = EXCLUDED.role, is_active = true, invited_by = EXCLUDED.invited_by;

  UPDATE public.clinic_invitations
  SET status = 'accepted', accepted_at = now(), accepted_by = v_uid
  WHERE id = v_invite.id;

  RETURN jsonb_build_object('ok', true, 'clinic_id', v_invite.clinic_id, 'role', v_invite.role);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.accept_clinic_invitation(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_clinic_invitation(text) TO authenticated;

-- SECURITY DEFINER RPC: revoke invitation (admins only)
CREATE OR REPLACE FUNCTION public.revoke_clinic_invitation(_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clinic_id uuid;
BEGIN
  SELECT clinic_id INTO v_clinic_id FROM public.clinic_invitations WHERE id = _id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF NOT public.has_clinic_role(v_clinic_id, auth.uid(), 'admin'::public.app_role) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  UPDATE public.clinic_invitations
  SET status = 'revoked'
  WHERE id = _id AND status = 'pending';

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.revoke_clinic_invitation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.revoke_clinic_invitation(uuid) TO authenticated;
