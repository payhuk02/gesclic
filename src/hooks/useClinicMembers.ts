import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic, type AppRole } from "@/contexts/ClinicContext";
import { toast } from "sonner";

export interface ClinicMember {
  id: string;
  user_id: string;
  clinic_id: string;
  role: AppRole;
  is_active: boolean;
  created_at: string;
  profile: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
}

export const useClinicMembers = () => {
  const { user } = useAuth();
  const { activeClinicId } = useClinic();
  const [members, setMembers] = useState<ClinicMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    if (!user || !activeClinicId) {
      setMembers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: raw, error: err2 } = await supabase
        .from("clinic_members")
        .select("id, user_id, clinic_id, role, is_active, created_at")
        .eq("clinic_id", activeClinicId)
        .order("created_at");
    if (err2) {
      console.error("members fetch error", err2);
      toast.error("Erreur chargement membres");
      setLoading(false);
      return;
    }
    const userIds = (raw || []).map((m: any) => m.user_id);
    const { data: profiles } = userIds.length
      ? await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, avatar_url")
          .in("user_id", userIds)
      : { data: [] as any[] };
    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
    setMembers(
      (raw || []).map((m: any) => ({ ...m, profile: profileMap.get(m.user_id) ?? null })),
    );
    setLoading(false);
  }, [user, activeClinicId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const updateRole = async (memberId: string, role: AppRole) => {
    const { error } = await supabase.from("clinic_members").update({ role }).eq("id", memberId);
    if (error) {
      toast.error("Erreur mise à jour du rôle");
      return;
    }
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role } : m)));
    toast.success("Rôle mis à jour");
  };

  const deactivateMember = async (memberId: string) => {
    const { error } = await supabase
      .from("clinic_members")
      .update({ is_active: false })
      .eq("id", memberId);
    if (error) {
      toast.error("Erreur désactivation");
      return;
    }
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, is_active: false } : m)));
    toast.success("Membre désactivé");
  };

  const reactivateMember = async (memberId: string) => {
    const { error } = await supabase
      .from("clinic_members")
      .update({ is_active: true })
      .eq("id", memberId);
    if (error) {
      toast.error("Erreur réactivation");
      return;
    }
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, is_active: true } : m)));
    toast.success("Membre réactivé");
  };

  return { members, loading, updateRole, deactivateMember, reactivateMember, refetch: fetchMembers };
};