import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Crown, Building2 } from "lucide-react";

const plans = [
  {
    name: "Gratuit",
    icon: Star,
    price: "0",
    period: "pour toujours",
    description: "Idéal pour tester la plateforme",
    features: ["1 médecin", "50 patients max", "Rendez-vous basiques", "Tableau de bord simple", "Support email"],
    limitations: ["Pas de SMS/WhatsApp", "Pas de vidéo", "Pas d'export PDF"],
    cta: "Plan actuel",
    active: false,
    popular: false,
  },
  {
    name: "Standard",
    icon: Zap,
    price: "14 900",
    period: "/ mois",
    description: "Pour les petits cabinets",
    features: ["5 médecins", "500 patients", "Calendrier avancé", "Ordonnances PDF", "Rappels SMS", "Support prioritaire"],
    limitations: ["Pas de vidéo"],
    cta: "Choisir Standard",
    active: false,
    popular: false,
  },
  {
    name: "Pro",
    icon: Crown,
    price: "29 900",
    period: "/ mois",
    description: "Pour les cliniques en croissance",
    features: ["Médecins illimités", "Patients illimités", "Téléconsultation vidéo", "WhatsApp Business", "Rapports avancés", "Multi-utilisateurs", "API Access", "Support dédié"],
    limitations: [],
    cta: "Plan actuel",
    active: true,
    popular: true,
  },
  {
    name: "Entreprise",
    icon: Building2,
    price: "Sur devis",
    period: "",
    description: "Pour les grands centres de santé",
    features: ["Multi-cliniques", "SSO / LDAP", "Intégrations sur mesure", "Formation sur site", "SLA garanti", "Serveur dédié", "Conformité RGPD+", "Account manager"],
    limitations: [],
    cta: "Nous contacter",
    active: false,
    popular: false,
  },
];

const Subscriptions = () => (
  <AppLayout title="Abonnements">
    <div className="text-center mb-8">
      <h2 className="text-2xl font-bold text-foreground mb-2">Choisissez votre plan</h2>
      <p className="text-muted-foreground">Évoluez à votre rythme. Changez de plan à tout moment.</p>
    </div>

    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {plans.map((plan) => {
        const Icon = plan.icon;
        return (
          <div key={plan.name} className={`bg-card rounded-2xl p-6 border-2 transition-shadow relative ${plan.popular ? "border-primary shadow-elevated" : "border-border"} flex flex-col`}>
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4">Populaire</Badge>
            )}
            <div className="text-center mb-6">
              <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3 ${plan.popular ? "gradient-hero" : "bg-primary/10"}`}>
                <Icon className={`w-6 h-6 ${plan.popular ? "text-primary-foreground" : "text-primary"}`} />
              </div>
              <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
              <p className="text-xs text-muted-foreground mb-3">{plan.description}</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                {plan.period && <span className="text-sm text-muted-foreground">FCFA {plan.period}</span>}
              </div>
            </div>

            <ul className="space-y-2.5 mb-6 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{f}</span>
                </li>
              ))}
            </ul>

            <Button
              className={`w-full ${plan.popular ? "gradient-hero border-0" : ""}`}
              variant={plan.active ? "outline" : plan.popular ? "default" : "outline"}
              disabled={plan.active}
            >
              {plan.cta}
            </Button>
          </div>
        );
      })}
    </div>

    {/* FAQ */}
    <div className="mt-12 bg-card rounded-xl p-6 border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-4">Questions fréquentes</h3>
      <div className="grid sm:grid-cols-2 gap-6">
        {[
          { q: "Puis-je changer de plan ?", a: "Oui, vous pouvez upgrader ou downgrader à tout moment. La différence sera proratisée." },
          { q: "Y a-t-il un engagement ?", a: "Non, tous les plans sont sans engagement. Vous pouvez annuler à tout moment." },
          { q: "Comment payer ?", a: "Nous acceptons Orange Money, Wave, MTN Mobile Money, Moov Money et les cartes bancaires." },
          { q: "L'essai gratuit est-il vraiment gratuit ?", a: "Oui, le plan Gratuit est sans limite de temps. Aucune carte bancaire requise." },
        ].map((item) => (
          <div key={item.q}>
            <p className="text-sm font-semibold text-foreground mb-1">{item.q}</p>
            <p className="text-sm text-muted-foreground">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  </AppLayout>
);

export default Subscriptions;
