import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Menu, X, Sparkles } from "lucide-react";
import logo from "@/assets/Logo_Gesclic.png";

const LandingNavbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 font-bold text-xl text-foreground">
          <img src={logo} alt="Gesclic" className="h-8 w-auto object-contain" />
          <span className="font-heading text-2xl font-bold tracking-tight">Gesclic</span>
        </Link>

        <div className="hidden lg:flex items-center gap-6 xl:gap-8">
          <Link to="/#showcase" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Modules
          </Link>
          <Link to="/#ai" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            IA Médicale
          </Link>
          <Link to="/#use-cases" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Établissements
          </Link>
          <Link to="/#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Fonctionnalités
          </Link>
          <Link to="/#security" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Sécurité
          </Link>
          <Link to="/#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Tarifs
          </Link>
          <Link to="/#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            FAQ
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="font-medium text-muted-foreground hover:text-foreground">
            <Link to="/login">Connexion</Link>
          </Button>
          <Button asChild size="sm" className="gradient-hero border-0 text-white font-medium shadow-sm">
            <Link to="/register">Démarrer gratuitement</Link>
          </Button>
        </div>

        <button
          className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden bg-card/98 backdrop-blur-lg border-t border-border p-5 space-y-4 shadow-xl">
          <Link to="/#showcase" className="block text-sm font-medium text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>
            Modules
          </Link>
          <Link to="/#ai" className="block text-sm font-medium text-primary flex items-center gap-1.5" onClick={() => setOpen(false)}>
            <Sparkles className="w-3.5 h-3.5" />
            IA Médicale
          </Link>
          <Link to="/#use-cases" className="block text-sm font-medium text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>
            Établissements
          </Link>
          <Link to="/#features" className="block text-sm font-medium text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>
            Fonctionnalités
          </Link>
          <Link to="/#security" className="block text-sm font-medium text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>
            Sécurité
          </Link>
          <Link to="/#pricing" className="block text-sm font-medium text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>
            Tarifs
          </Link>
          <Link to="/#faq" className="block text-sm font-medium text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>
            FAQ
          </Link>
          <div className="flex gap-2 pt-3 border-t border-border">
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link to="/login">Connexion</Link>
            </Button>
            <Button asChild size="sm" className="flex-1 gradient-hero border-0 text-white font-medium">
              <Link to="/register">Inscription</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default LandingNavbar;
