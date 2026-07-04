import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Gratuit",
    price: "0",
    desc: "Pour démarrer",
    features: ["1 médecin", "50 patients", "Rendez-vous de base", "Support email"],
    cta: "Commencer",
    popular: false,
  },
  {
    name: "Standard",
    price: "29 900",
    desc: "Pour les cabinets",
    features: ["5 médecins", "500 patients", "Rappels SMS", "Paiements mobiles", "Ordonnances", "Support prioritaire"],
    cta: "Essai gratuit 14 jours",
    popular: true,
  },
  {
    name: "Pro",
    price: "59 900",
    desc: "Pour les cliniques",
    features: ["Médecins illimités", "Patients illimités", "Téléconsultation", "Laboratoire", "Pharmacie", "Multi-clinique", "API & intégrations"],
    cta: "Essai gratuit 14 jours",
    popular: false,
  },
  {
    name: "Entreprise",
    price: "Sur mesure",
    desc: "Pour les grands groupes",
    features: ["Tout du plan Pro", "Déploiement sur site", "Formation dédiée", "SLA garanti", "Support 24/7", "Personnalisation complète"],
    cta: "Nous contacter",
    popular: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Des tarifs adaptés à l'Afrique
          </h2>
          <p className="text-muted-foreground text-lg">
            Paiements en FCFA via Orange Money, MTN, Wave et carte bancaire.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl p-6 border ${
                plan.popular
                  ? "border-primary shadow-hero bg-card relative"
                  : "border-border bg-card shadow-card"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-hero text-primary-foreground text-xs font-semibold px-4 py-1 rounded-full">
                  Populaire
                </div>
              )}
              <h3 className="font-bold text-lg text-foreground">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{plan.desc}</p>
              <div className="mb-6">
                <span className="text-3xl font-extrabold text-foreground">{plan.price}</span>
                {plan.price !== "Sur mesure" && (
                  <span className="text-sm text-muted-foreground"> FCFA/mois</span>
                )}
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={`w-full ${plan.popular ? "gradient-hero border-0" : ""}`}
                variant={plan.popular ? "default" : "outline"}
              >
                <Link to="/register">{plan.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
