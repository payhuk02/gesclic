import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic, type AppRole } from "@/contexts/ClinicContext";
import { toast } from "sonner";

export interface ClinicInvitation {
  id: string;
  clinic_id: string;
  email: string;
  role: AppRole;
  token: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  invited_by: string;
}

export const useInvitations = () => {
  const { user } = useAuth();
  const { activeClinicId } = useClinic();
  const [invitations, setInvitations] = useState<ClinicInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvitations = useCallback(async () => {
    if (!user || !activeClinicId) {
      setInvitations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("clinic_invitations")
      .select("id, clinic_id, email, role, token, status, expires_at, accepted_at, created_at, invited_by")
      .eq("clinic_id", activeClinicId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("invitations fetch error", error);
      toast.error("Erreur chargement invitations");
    } else {
      setInvitations((data || []) as ClinicInvitation[]);
    }
    setLoading(false);
  }, [user, activeClinicId]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const createInvitation = async (email: string, role: AppRole): Promise<ClinicInvitation | null> => {
    if (!user || !activeClinicId) {
      toast.error("Aucune clinique active");
      return null;
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
      toast.error("Email invalide");
      return null;
    }
    const { data, error } = await supabase
      .from("clinic_invitations")
      .insert({
        clinic_id: activeClinicId,
        email: cleanEmail,
        role,
        invited_by: user.id,
      })
      .select("id, clinic_id, email, role, token, status, expires_at, accepted_at, created_at, invited_by")
      .single();

    if (error) {
      if (error.code === "23505") {
        toast.error("Une invitation est déjà en attente pour cet email");
      } else {
        console.error("create invitation error", error);
        toast.error("Erreur lors de la création de l'invitation");
      }
      return null;
    }
    const invitation = data as ClinicInvitation;
    setInvitations((prev) => [invitation, ...prev]);
    return invitation;
  };

  const revokeInvitation = async (id: string) => {
    const { data, error } = await supabase.rpc("revoke_clinic_invitation", { _id: id });
    if (error || !(data as any)?.ok) {
      toast.error("Erreur lors de la révocation");
      return;
    }
    setInvitations((prev) => prev.map((i) => (i.id === id ? { ...i, status: "revoked" } : i)));
    toast.success("Invitation révoquée");
  };

  return { invitations, loading, createInvitation, revokeInvitation, refetch: fetchInvitations };
};

export const buildInvitationUrl = (token: string) =>
  `${window.location.origin}/invite/${token}`;

export const buildInvitationMailto = (email: string, clinicName: string, url: string) => {
  const subject = encodeURIComponent(`Invitation à rejoindre ${clinicName} sur Gesclic`);
  const body = encodeURIComponent(
    `Bonjour,\n\nVous êtes invité(e) à rejoindre ${clinicName} sur Gesclic.\n\nCliquez sur le lien suivant pour accepter l'invitation (valable 7 jours) :\n${url}\n\nÀ bientôt,\nL'équipe ${clinicName}`,
  );
  return `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
};