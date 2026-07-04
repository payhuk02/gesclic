import { Heart } from "lucide-react";
import { Link } from "react-router-dom";

const FooterSection = () => {
  return (
    <footer className="bg-sidebar text-sidebar-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <Link to="/" className="flex items-center gap-2 font-bold text-xl mb-4">
              <Heart className="w-6 h-6 text-primary fill-primary" />
              <span>Gesclic</span>
            </Link>
            <p className="text-sm opacity-70">La plateforme de gestion médicale conçue pour l'Afrique.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Produit</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li><a href="#features">Fonctionnalités</a></li>
              <li><a href="#pricing">Tarifs</a></li>
              <li><Link to="/login">Connexion</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Support</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li><a href="#faq">FAQ</a></li>
              <li><a href="#">Documentation</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Légal</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li><a href="#">Confidentialité</a></li>
              <li><a href="#">CGU</a></li>
              <li><a href="#">RGPD</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-sidebar-border pt-6 text-center text-sm opacity-50">
          © 2024 Gesclic. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
