import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import {
  BILLING_PERIODS,
  CLINIC_PLANS,
  computePlanTotal,
  formatFcfa,
  formatPlanPriceLines,
  type BillingPeriodMonths,
} from "@/lib/clinic-plans";
import { BillingPeriodToggle } from "@/components/BillingPeriodToggle";

const PricingSection = () => {
  const [billingMonths, setBillingMonths] = useState<BillingPeriodMonths>(1);
  const billing = BILLING_PERIODS.find((p) => p.months === billingMonths) ?? BILLING_PERIODS[0];

  return (
    <section id="pricing" className="py-16 sm:py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-12"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-3">
            Tarifs & Abonnements
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground mb-2">Simple et transparent</p>
          <p className="text-sm text-muted-foreground px-4 mb-4">
            Tarifs en FCFA, par clinique. Engagement long = réduction.
          </p>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground mb-6">
            <span className="font-medium text-foreground">Règlement en ligne immédiat :</span>
            <span>Orange Money • Wave • MTN • Moov • Carte bancaire</span>
          </div>

          <BillingPeriodToggle value={billingMonths} onChange={setBillingMonths} />
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
          {CLINIC_PLANS.map((plan, i) => {
            const pricing = computePlanTotal(plan.monthlyPrice, billingMonths);
            const lines = pricing ? formatPlanPriceLines(pricing, billing.label) : null;

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
                    Recommandé
                  </div>
                )}
                <h3 className="font-heading font-bold text-lg sm:text-xl text-foreground">{plan.name}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">{plan.description}</p>

                <div className="mb-4 sm:mb-6 min-h-[5.5rem]">
                  {lines && pricing ? (
                    <>
                      {lines.strike && (
                        <p className="text-sm text-muted-foreground line-through mb-0.5">{lines.strike}</p>
                      )}
                      <div>
                        <span className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums">
                          {lines.headline}
                        </span>
                        <span className="text-xs sm:text-sm text-muted-foreground"> FCFA</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-snug">{lines.detail}</p>
                      {pricing.savings > 0 && (
                        <p className="text-[11px] font-medium text-success mt-1">
                          −{formatFcfa(pricing.savings)} FCFA
                        </p>
                      )}
                    </>
                  ) : (
                    <span className="text-2xl sm:text-3xl font-extrabold text-foreground">Sur mesure</span>
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
                  <Link to="/register">{plan.contactSales ? "Nous contacter" : "Commencer"}</Link>
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
