import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Mail, Lock, User, Eye, EyeOff, Building2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/Logo_Gesclic.png";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName, clinic_name: clinicName },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Compte créé ! Vérifiez votre email pour confirmer.");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex flex-1 gradient-hero items-center justify-center p-12">
        <div className="text-center max-w-md">
          <Heart className="w-16 h-16 text-primary-foreground/90 mx-auto mb-6 fill-primary-foreground/20" />
          <h3 className="text-3xl font-bold text-primary-foreground mb-4">
            Rejoignez +500 cliniques
          </h3>
          <p className="text-primary-foreground/80 text-lg">
            Commencez gratuitement et modernisez votre pratique médicale.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 font-bold text-2xl mb-8">
            <img src={logo} alt="Gesclic" className="w-8 h-8" />
            <span>Gesclic</span>
          </Link>

          <h2 className="text-2xl font-bold text-foreground mb-2">Créer un compte</h2>
          <p className="text-muted-foreground mb-8">Inscrivez votre établissement en quelques minutes.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Prénom</Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="firstName" placeholder="Amina" className="pl-10" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
              </div>
              <div>
                <Label htmlFor="lastName">Nom</Label>
                <Input id="lastName" placeholder="Diallo" className="mt-1.5" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>
            <div>
              <Label htmlFor="clinic">Nom de l'établissement</Label>
              <div className="relative mt-1.5">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="clinic" placeholder="Clinique Santé Plus" className="pl-10" value={clinicName} onChange={(e) => setClinicName(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email professionnel</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="contact@clinique.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min. 6 caractères" className="pl-10 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full gradient-hero border-0 text-base h-11" disabled={loading}>
              {loading ? "Création..." : "Créer mon compte gratuit"}
            </Button>
          </form>

          <p className="mt-4 text-xs text-center text-muted-foreground">
            En vous inscrivant, vous acceptez nos CGU et notre politique de confidentialité.
          </p>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Se connecter</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
