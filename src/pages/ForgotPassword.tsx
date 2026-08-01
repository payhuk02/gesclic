import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Mail, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
    toast.success("Email envoyé si le compte existe");
  };

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 font-bold text-2xl mb-8">
          <Heart className="w-8 h-8 text-primary fill-primary" />
          <span>Medi<span className="text-primary">Flow</span></span>
        </Link>
        <h2 className="text-2xl font-bold text-foreground mb-2">Mot de passe oublié</h2>
        <p className="text-muted-foreground mb-8">
          {sent ? "Vérifiez votre boîte mail pour le lien de réinitialisation." : "Entrez votre email pour recevoir un lien de réinitialisation."}
        </p>
        {!sent && (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="docteur@clinique.com" className="pl-10" required />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full gradient-hero border-0 h-11">
              {loading ? "Envoi..." : "Envoyer le lien"}
            </Button>
          </form>
        )}
        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
