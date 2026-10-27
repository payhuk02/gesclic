import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import logo from "@/assets/Logo_Gesclic.png";
import { usePublicSiteContent } from "@/hooks/usePublicSiteContent";

const FooterSection = () => {
  const { general } = usePublicSiteContent();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-sidebar text-sidebar-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <Link to="/" className="flex items-center gap-2 font-bold text-xl mb-4">
              <img src={logo} alt={general.platformName} className="h-6 w-auto" />
              <span>{general.platformName}</span>
            </Link>
            <p className="text-sm opacity-70 mb-4">{general.tagline}</p>
            <ul className="space-y-2 text-sm opacity-80">
              {general.address && (
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0 opacity-70" />
                  {general.address}
                </li>
              )}
              {general.phone && (
                <li>
                  <a className="flex items-center gap-2 hover:opacity-100" href={`tel:${general.phone.replace(/\s/g, "")}`}>
                    <Phone className="w-4 h-4 shrink-0 opacity-70" />
                    {general.phone}
                  </a>
                </li>
              )}
              <li>
                <a className="flex items-center gap-2 hover:opacity-100" href={`mailto:${general.supportEmail}`}>
                  <Mail className="w-4 h-4 shrink-0 opacity-70" />
                  {general.supportEmail}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Produit</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li><Link className="hover:opacity-100" to="/#features">Fonctionnalités</Link></li>
              <li><Link className="hover:opacity-100" to="/#pricing">Tarifs</Link></li>
              <li><Link className="hover:opacity-100" to="/#security">Sécurité</Link></li>
              <li><Link className="hover:opacity-100" to="/register">Essai gratuit</Link></li>
              <li><Link className="hover:opacity-100" to="/login">Connexion</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Support</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li><Link className="hover:opacity-100" to="/#faq">FAQ</Link></li>
              <li><Link className="hover:opacity-100" to="/documentation">Documentation</Link></li>
              <li><Link className="hover:opacity-100" to="/contact">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Légal</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li><Link className="hover:opacity-100" to="/confidentialite">Confidentialité</Link></li>
              <li><Link className="hover:opacity-100" to="/cgu">CGU</Link></li>
              <li><Link className="hover:opacity-100" to="/rgpd">RGPD</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-sidebar-border pt-6 text-center text-sm opacity-50">
          © {year} {general.platformName}. {general.footerNote}
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
