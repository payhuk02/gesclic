import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "medecin" | "secretaire" | "infirmier";

export interface ClinicMembership {
  clinic_id: string;
  role: AppRole;
  clinic: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    status: string;
    logo_url: string | null;
  };
}

interface ClinicContextType {
  memberships: ClinicMembership[];
  activeClinicId: string | null;
  activeClinic: ClinicMembership["clinic"] | null;
  activeRole: AppRole | null;
  loading: boolean;
  setActiveClinicId: (id: string) => void;
  refetch: () => Promise<void>;
  hasClinicRole: (role: AppRole) => boolean;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

const STORAGE_KEY = "active_clinic_id";

export const ClinicProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [memberships, setMemberships] = useState<ClinicMembership[]>([]);
  const [activeClinicId, setActiveClinicIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMemberships = useCallback(async () => {
    if (!user) {
      setMemberships([]);
      setActiveClinicIdState(null);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("clinic_members")
      .select("clinic_id, role, clinic:clinics(id, name, slug, plan, status, logo_url)")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (error) {
      console.error("memberships fetch error", error);
      setMemberships([]);
      setLoading(false);
      return;
    }

    const list = (data || []).filter((m: any) => m.clinic) as ClinicMembership[];
    setMemberships(list);

    const stored = localStorage.getItem(STORAGE_KEY);
    const validStored = stored && list.some((m) => m.clinic_id === stored) ? stored : null;
    const next = validStored ?? list[0]?.clinic_id ?? null;
    setActiveClinicIdState(next);
    if (next) localStorage.setItem(STORAGE_KEY, next);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    setLoading(true);
    fetchMemberships();
  }, [user, authLoading, fetchMemberships]);

  const setActiveClinicId = (id: string) => {
    setActiveClinicIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const activeMembership = memberships.find((m) => m.clinic_id === activeClinicId) ?? null;
  const activeClinic = activeMembership?.clinic ?? null;
  const activeRole = activeMembership?.role ?? null;
  const hasClinicRole = (role: AppRole) => activeRole === role;

  return (
    <ClinicContext.Provider
      value={{
        memberships,
        activeClinicId,
        activeClinic,
        activeRole,
        loading,
        setActiveClinicId,
        refetch: fetchMemberships,
        hasClinicRole,
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
};

export const useClinic = () => {
  const ctx = useContext(ClinicContext);
  if (!ctx) throw new Error("useClinic must be used within ClinicProvider");
  return ctx;
};
