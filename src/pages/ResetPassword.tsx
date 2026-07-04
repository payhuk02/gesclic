import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase places the recovery token in the URL hash on arrival.
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("access_token")) setReady(true);
    // Listen for the PASSWORD_RECOVERY event as the SDK parses the URL.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Le mot de passe doit faire au moins 6 caractères");
    if (password !== confirm) return toast.error("Les mots de passe ne correspondent pas");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Mot de passe mis à jour");
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 font-bold text-2xl mb-8">
          <Heart className="w-8 h-8 text-primary fill-primary" />
          <span>Medi<span className="text-primary">Flow</span></span>
        </Link>
        <h2 className="text-2xl font-bold text-foreground mb-2">Nouveau mot de passe</h2>
        <p className="text-muted-foreground mb-8">
          {ready ? "Choisissez un nouveau mot de passe." : "Lien de réinitialisation invalide ou expiré."}
        </p>
        {ready && (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required />
              </div>
            </div>
            <div>
              <Label htmlFor="confirm">Confirmer</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="pl-10" required />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full gradient-hero border-0 h-11">
              {loading ? "Mise à jour..." : "Mettre à jour"}
            </Button>
          </form>
        )}
        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-primary hover:underline">Retour à la connexion</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
