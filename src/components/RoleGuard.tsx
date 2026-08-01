import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";

type AppRole = "admin" | "medecin" | "secretaire" | "infirmier";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: AppRole[];
  fallback?: ReactNode;
}

const RoleGuard = ({ children, allowedRoles, fallback = null }: RoleGuardProps) => {
  const { roles, loading } = useAuth();

  if (loading) return null;

  // If user has no roles yet (demo/dev), show everything
  if (roles.length === 0) return <>{children}</>;

  const hasAccess = allowedRoles.some((role) => roles.includes(role));
  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

export default RoleGuard;
