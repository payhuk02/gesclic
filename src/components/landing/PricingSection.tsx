import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, ShieldCheck } from "lucide-react";
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
    <section id="pricing" className="py-16 sm:py-24 bg-background relative overflow-hidden">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 sm:mb-14"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Transparence tarifaire • Sans engagement</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-3">
            Tarifs & Abonnements
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground mb-2 font-medium">Simple, prévisible et tout inclus</p>
          <p className="text-xs sm:text-sm text-muted-foreground px-4 mb-5 max-w-xl mx-auto">
            Tarifs en FCFA, par clinique. 7 jours d&apos;essai Pro complet, sans carte bancaire requise.
          </p>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground mb-6">
            <span className="font-semibold text-foreground">Règlement en ligne immédiat :</span>
            <span>Orange Money • Wave • MTN • Moov • Carte bancaire</span>
          </div>

          <div className="flex justify-center">
            <BillingPeriodToggle value={billingMonths} onChange={setBillingMonths} />
          </div>
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
                transition={{ delay: i * 0.08, duration: 0.5 }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className={`rounded-2xl p-5 sm:p-6 border transition-all duration-300 flex flex-col justify-between ${
                  plan.popular
                    ? "border-primary shadow-hero bg-card relative ring-2 ring-primary/20"
                    : "border-border bg-card shadow-card hover:shadow-elevated hover:border-primary/40"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 gradient-hero text-primary-foreground text-xs font-bold px-3.5 py-1 rounded-full shadow-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Le plus choisi</span>
                  </div>
                )}

                <div>
                  <h3 className="font-heading font-bold text-lg sm:text-xl text-foreground mb-1">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed font-medium">{plan.description}</p>

                  <div className="mb-5 min-h-[5.5rem]">
                    {lines && pricing ? (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`pricing-${billingMonths}-${plan.id}`}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.25 }}
                        >
                          {lines.strike && (
                            <p className="text-xs text-muted-foreground line-through mb-0.5">{lines.strike}</p>
                          )}
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums tracking-tight">
                              {lines.headline}
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground"> FCFA</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 leading-snug">{lines.detail}</p>
                          {pricing.savings > 0 && (
                            <p className="text-[11px] font-bold text-emerald-500 mt-1">
                              −{formatFcfa(pricing.savings)} FCFA d'économie
                            </p>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    ) : (
                      <span className="text-2xl sm:text-3xl font-extrabold text-foreground">Sur mesure</span>
                    )}
                  </div>

                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs sm:text-sm text-foreground">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" strokeWidth={2.2} />
                        <span className="leading-snug font-medium">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  asChild
                  className={`w-full text-sm font-bold h-11 rounded-xl transition-all duration-300 hover:scale-[1.02] ${
                    plan.popular ? "gradient-hero border-0 text-white shadow-md hover:shadow-lg" : ""
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  <Link to="/register">{plan.contactSales ? "Nous contacter" : "Démarrer l'essai 7j"}</Link>
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
