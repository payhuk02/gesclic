import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { securityService } from "@/services/security.service";
import { clearMfaPending, setMfaPending } from "@/lib/mfa-session";
import { toast } from "sonner";
import logo from "@/assets/Logo_Gesclic.png";
import loginImage from "@/assets/auth-login-doctor.jpg";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaUserId, setMfaUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const completeLogin = () => {
    clearMfaPending();
    toast.success("Connexion réussie !");
    navigate("/dashboard");
  };

  const abortMfaChallenge = async () => {
    clearMfaPending();
    await supabase.auth.signOut();
    setMfaUserId(null);
    setMfaCode("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(
          error.message === "Invalid login credentials"
            ? "Email ou mot de passe incorrect"
            : error.message,
        );
        return;
      }

      const userId = data.user?.id;
      if (!userId) {
        toast.error("Session invalide");
        await supabase.auth.signOut();
        return;
      }

      const mfaRequired = await securityService.isMFAEnabled(userId);
      if (mfaRequired) {
        setMfaPending(userId);
        setMfaUserId(userId);
        toast.message("Vérification en deux étapes requise");
        return;
      }

      completeLogin();
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaUserId) return;

    const code = mfaCode.trim().replace(/\s+/g, "");
    if (code.length < 6) {
      toast.error("Entrez le code à 6 chiffres ou un code de secours");
      return;
    }

    setLoading(true);
    try {
      const valid = await securityService.verifyMFA(mfaUserId, code);
      if (!valid) {
        toast.error("Code MFA invalide");
        return;
      }
      setMfaUserId(null);
      setMfaCode("");
      completeLogin();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex flex-1 items-center justify-center p-12">
        <img src={loginImage} alt="Doctor login" className="w-full h-full object-cover rounded-2xl" />
      </div>
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl sm:text-2xl mb-6 sm:mb-8">
            <img src={logo} alt="Gesclic" className="w-7 h-7 sm:w-8 sm:h-8" />
            <span>Gesclic</span>
          </Link>

          {mfaUserId ? (
            <>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Vérification MFA</h2>
              <p className="text-muted-foreground mb-6 sm:mb-8">
                Entrez le code de votre application d&apos;authentification ou un code de secours.
              </p>

              <form onSubmit={handleMfaSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="mfa">Code de vérification</Label>
                  <div className="relative mt-1.5">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="mfa"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="123456"
                      className="pl-10 tracking-widest"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full gradient-hero border-0 text-base h-11" disabled={loading}>
                  {loading ? "Vérification..." : "Valider"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  disabled={loading}
                  onClick={async () => {
                    await abortMfaChallenge();
                    toast.message("Connexion annulée");
                  }}
                >
                  Annuler
                </Button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Bon retour !</h2>
              <p className="text-muted-foreground mb-6 sm:mb-8">Connectez-vous à votre espace médical.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="docteur@clinique.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-muted-foreground">
                    <input type="checkbox" className="rounded border-border" defaultChecked />
                    Se souvenir de moi
                  </label>
                  <Link to="/forgot-password" className="text-primary hover:underline">
                    Mot de passe oublié ?
                  </Link>
                </div>
                <Button type="submit" className="w-full gradient-hero border-0 text-base h-11" disabled={loading}>
                  {loading ? "Connexion..." : "Se connecter"}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Pas encore de compte ?{" "}
                <Link to="/register" className="text-primary font-medium hover:underline">
                  Créer un compte
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
