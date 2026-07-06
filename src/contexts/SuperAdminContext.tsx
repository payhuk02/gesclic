import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SuperAdminProfile {
  user_id: string;
  email: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

interface SuperAdminContextType {
  isSuperAdmin: boolean;
  profile: SuperAdminProfile | null;
  loading: boolean;
  checkSuperAdminAccess: () => Promise<boolean>;
}

const SuperAdminContext = createContext<SuperAdminContextType | undefined>(undefined);

export const useSuperAdmin = () => {
  const context = useContext(SuperAdminContext);
  if (context === undefined) {
    throw new Error("useSuperAdmin must be used within a SuperAdminProvider");
  }
  return context;
};

interface SuperAdminProviderProps {
  children: ReactNode;
}

export const SuperAdminProvider = ({ children }: SuperAdminProviderProps) => {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [profile, setProfile] = useState<SuperAdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSuperAdminAccess = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "super_admin")
        .maybeSingle();

      if (roleError || !roleData) {
        setIsSuperAdmin(false);
        setProfile(null);
        return false;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, avatar_url")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profileData) {
        setIsSuperAdmin(false);
        setProfile(null);
        return false;
      }

      const superAdminProfile: SuperAdminProfile = {
        user_id: profileData.user_id,
        email: user.email || "",
        full_name: profileData.first_name && profileData.last_name 
          ? `${profileData.first_name} ${profileData.last_name}` 
          : profileData.first_name || profileData.last_name || null,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        avatar_url: profileData.avatar_url,
      };

      setIsSuperAdmin(true);
      setProfile(superAdminProfile);
      return true;
    } catch (error) {
      console.error("Error checking super admin access:", error);
      setIsSuperAdmin(false);
      setProfile(null);
      return false;
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await checkSuperAdminAccess();
      setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await checkSuperAdminAccess();
      } else if (event === "SIGNED_OUT") {
        setIsSuperAdmin(false);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <SuperAdminContext.Provider value={{ isSuperAdmin, profile, loading, checkSuperAdminAccess }}>
      {children}
    </SuperAdminContext.Provider>
  );
};
