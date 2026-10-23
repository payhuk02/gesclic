import { useAuth } from "@/contexts/AuthContext";
import { useClinic, type AppRole } from "@/contexts/ClinicContext";
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: AppRole[];
  fallback?: ReactNode;
  /** Redirect instead of rendering fallback when access is denied */
  redirectTo?: string;
}

/**
 * Guards UI/routes by the active clinic membership role.
 * Super-admins bypass clinic role checks.
 */
const RoleGuard = ({
  children,
  allowedRoles,
  fallback = null,
  redirectTo,
}: RoleGuardProps) => {
  const { roles, loading: authLoading } = useAuth();
  const { activeRole, loading: clinicLoading } = useClinic();

  if (authLoading || clinicLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (roles.includes("super_admin")) {
    return <>{children}</>;
  }

  if (!activeRole || !allowedRoles.includes(activeRole)) {
    if (redirectTo) return <Navigate to={redirectTo} replace />;
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RoleGuard;
