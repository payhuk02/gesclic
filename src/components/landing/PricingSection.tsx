import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { CLINIC_PLANS, formatFcfa } from "@/lib/clinic-plans";

const PricingSection = () => {
  return (
    <section id="pricing" className="py-16 sm:py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Des tarifs adaptés à l&apos;Afrique
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground px-4">
            5 900 · 7 500 · 12 500 FCFA/mois. −10 % / −20 % / −30 % sur 3 / 6 / 12 mois.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
          {CLINIC_PLANS.map((plan, i) => {
            const priceLabel =
              plan.monthlyPrice == null ? "Sur mesure" : formatFcfa(plan.monthlyPrice);
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-2xl p-4 sm:p-6 border ${
                  plan.popular
                    ? "border-primary shadow-hero bg-card relative"
                    : "border-border bg-card shadow-card"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-hero text-primary-foreground text-xs font-semibold px-3 sm:px-4 py-1 rounded-full">
                    Populaire
                  </div>
                )}
                <h3 className="font-bold text-base sm:text-lg text-foreground">{plan.name}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">{plan.description}</p>
                <div className="mb-4 sm:mb-6">
                  <span className="text-2xl sm:text-3xl font-extrabold text-foreground">{priceLabel}</span>
                  {plan.monthlyPrice != null && (
                    <span className="text-xs sm:text-sm text-muted-foreground"> FCFA/mois</span>
                  )}
                </div>
                <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs sm:text-sm text-foreground">
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-success flex-shrink-0" />
                      <span className="leading-tight">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className={`w-full text-sm sm:text-base ${plan.popular ? "gradient-hero border-0" : ""}`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  <Link to={plan.contactSales ? "/register" : "/register"}>
                    {plan.contactSales ? "Nous contacter" : "Commencer"}
                  </Link>
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
