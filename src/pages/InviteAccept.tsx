import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { Button } from "@/components/ui/button";
import { AlertCircle, Building2, CheckCircle2, Heart, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";

const PENDING_INVITE_KEY = "pending_invitation_token";

interface InvitationInfo {
  id: string;
  clinic_id: string;
  clinic_name: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  invited_by_name: string;
}

const roleLabels: Record<string, string> = {
  admin: "Administrateur",
  medecin: "Médecin",
  secretaire: "Secrétaire",
  infirmier: "Infirmier(ère)",
};

const InviteAccept = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { refetch, setActiveClinicId } = useClinic();
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setError("Lien d'invitation invalide.");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.rpc("get_invitation_by_token", { _token: token });
      if (error) {
        console.error(error);
        setError("Impossible de charger l'invitation.");
      } else if (!data || (Array.isArray(data) && data.length === 0)) {
        setError("Cette invitation n'existe pas.");
      } else {
        setInvitation(Array.isArray(data) ? (data[0] as InvitationInfo) : (data as InvitationInfo));
      }
      setLoading(false);
    };
    load();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    const { data, error } = await supabase.rpc("accept_clinic_invitation", { _token: token });
    setAccepting(false);
    if (error) {
      toast.error("Erreur lors de l'acceptation");
      return;
    }
    const res = data as { ok: boolean; error?: string; clinic_id?: string; expected?: string };
    if (!res?.ok) {
      if (res?.error === "email_mismatch") {
        toast.error(`Cette invitation est destinée à ${res.expected}. Connectez-vous avec cet email.`);
      } else if (res?.error === "expired") {
        toast.error("Cette invitation a expiré.");
      } else if (res?.error === "accepted") {
        toast.info("Vous avez déjà accepté cette invitation.");
        setAccepted(true);
      } else if (res?.error === "revoked") {
        toast.error("Cette invitation a été révoquée.");
      } else {
        toast.error("Impossible d'accepter cette invitation.");
      }
      return;
    }
    localStorage.removeItem(PENDING_INVITE_KEY);
    toast.success(`Bienvenue dans ${invitation?.clinic_name} !`);
    await refetch();
    if (res.clinic_id) setActiveClinicId(res.clinic_id);
    setAccepted(true);
    setTimeout(() => navigate("/dashboard"), 1200);
  };

  const goSignIn = (mode: "login" | "register") => {
    if (token) localStorage.setItem(PENDING_INVITE_KEY, token);
    navigate(mode === "login" ? "/login" : "/register", {
      state: { inviteEmail: invitation?.email, redirectTo: `/invite/${token}` },
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center mb-6 font-bold text-xl">
          <Heart className="w-6 h-6 text-primary fill-primary" />
          <span>Gesclic</span>
        </Link>

        <div className="bg-card border border-border rounded-2xl shadow-card p-6 sm:p-8">
          {loading || authLoading ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Chargement de l'invitation...</p>
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
              <h1 className="text-lg font-semibold mb-2">Invitation introuvable</h1>
              <p className="text-sm text-muted-foreground mb-6">{error}</p>
              <Button asChild variant="outline"><Link to="/">Retour à l'accueil</Link></Button>
            </div>
          ) : accepted ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
              <h1 className="text-lg font-semibold mb-2">Invitation acceptée</h1>
              <p className="text-sm text-muted-foreground mb-6">
                Vous rejoignez <strong>{invitation?.clinic_name}</strong>. Redirection...
              </p>
              <Button asChild><Link to="/dashboard">Aller au tableau de bord</Link></Button>
            </div>
          ) : invitation?.status !== "pending" ? (
            <div className="text-center py-4">
              <AlertCircle className="w-10 h-10 text-warning mx-auto mb-3" />
              <h1 className="text-lg font-semibold mb-2">
                {invitation?.status === "expired" && "Invitation expirée"}
                {invitation?.status === "accepted" && "Déjà acceptée"}
                {invitation?.status === "revoked" && "Invitation révoquée"}
              </h1>
              <p className="text-sm text-muted-foreground mb-6">
                Contactez l'administrateur de {invitation?.clinic_name} pour recevoir une nouvelle invitation.
              </p>
              <Button asChild variant="outline"><Link to="/">Retour à l'accueil</Link></Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl gradient-hero mx-auto mb-4 flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-semibold mb-1">Vous êtes invité(e)</h1>
                <p className="text-sm text-muted-foreground">
                  <strong>{invitation.invited_by_name}</strong> vous invite à rejoindre
                </p>
                <p className="text-lg font-semibold text-primary mt-1">{invitation.clinic_name}</p>
                <p className="text-xs text-muted-foreground mt-3">
                  Rôle : <strong>{roleLabels[invitation.role] ?? invitation.role}</strong> · pour <strong>{invitation.email}</strong>
                </p>
              </div>

              {user ? (
                user.email?.toLowerCase() === invitation.email.toLowerCase() ? (
                  <Button className="w-full gap-2" onClick={handleAccept} disabled={accepting}>
                    {accepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Accepter l'invitation
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3">
                      Vous êtes connecté avec <strong>{user.email}</strong> mais l'invitation est pour <strong>{invitation.email}</strong>. Déconnectez-vous et connectez-vous avec le bon compte.
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={async () => {
                        await supabase.auth.signOut();
                        goSignIn("login");
                      }}
                    >
                      Changer de compte
                    </Button>
                  </div>
                )
              ) : (
                <div className="space-y-2">
                  <Button className="w-full gap-2" onClick={() => goSignIn("register")}>
                    <LogIn className="w-4 h-4" /> Créer un compte pour accepter
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => goSignIn("login")}>
                    J'ai déjà un compte
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Utilisez l'email <strong>{invitation.email}</strong> lors de l'inscription/connexion.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteAccept;