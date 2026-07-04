import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading || !session) return;
    const pending = localStorage.getItem("pending_invitation_token");
    if (pending && !location.pathname.startsWith("/invite/")) {
      localStorage.removeItem("pending_invitation_token");
      navigate(`/invite/${pending}`, { replace: true });
      return;
    }
    // Auto-redirect to onboarding until the user completes it.
    // Skip when already on onboarding or handling an invite.
    if (
      profile &&
      !profile.onboarding_completed_at &&
      !location.pathname.startsWith("/onboarding") &&
      !location.pathname.startsWith("/invite/")
    ) {
      navigate("/onboarding", { replace: true });
    }
  }, [loading, session, profile, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
