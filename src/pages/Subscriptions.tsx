import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Building2, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { useClinic } from "@/contexts/ClinicContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  BILLING_PERIODS,
  CLINIC_PLANS,
  computePlanTotal,
  formatFcfa,
  formatPlanPriceLines,
  normalizeClinicPlanId,
  type BillingPeriodMonths,
  type ClinicPlanId,
} from "@/lib/clinic-plans";
import { clinicSettingsService } from "@/services/clinic-settings.service";

const PLAN_ICONS = {
  essentiel: Sparkles,
  pro: Crown,
  premium: Zap,
  custom: Building2,
} as const;

const Subscriptions = () => {
  const { activeClinicId, activeClinic, hasClinicRole, refetch } = useClinic();
  const { hasRole } = useAuth();
  const canManage = hasRole("admin") || hasClinicRole("admin");
  const [updatingPlan, setUpdatingPlan] = useState<ClinicPlanId | null>(null);
  const [billingMonths, setBillingMonths] = useState<BillingPeriodMonths>(1);

  const currentPlanId = normalizeClinicPlanId(activeClinic?.plan);
  const billing = getBillingSafe(billingMonths);

  const handleSelectPlan = async (planId: ClinicPlanId) => {
    if (!canManage || !activeClinicId || planId === currentPlanId) return;
    if (planId === "custom") {
      toast.info("Contactez le support Gesclic pour un devis Sur mesure.");
      return;
    }

    setUpdatingPlan(planId);
    try {
      await clinicSettingsService.updateClinicPlan(activeClinicId, planId);
      await refetch();
      const plan = CLINIC_PLANS.find((p) => p.id === planId);
      const pricing = computePlanTotal(plan?.monthlyPrice ?? null, billingMonths);
      const periodNote =
        pricing && billingMonths > 1
          ? ` (${formatFcfa(pricing.total)} FCFA · ${billing.label}, −${billing.discountPercent} %)`
          : "";
      toast.success(`Plan ${plan?.name} activé${periodNote}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors du changement de plan");
    } finally {
      setUpdatingPlan(null);
    }
  };

  return (
    <AppLayout title="Abonnements">
      <div className="text-center mb-8 max-w-2xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Tarifs</h2>
        <p className="text-muted-foreground text-sm sm:text-base mb-1">Simple et transparent</p>
        <p className="text-sm text-muted-foreground mb-6">
          Tarifs en FCFA, par clinique. Engagement long = réduction. Plan actuel :{" "}
          <span className="font-medium text-foreground">
            {CLINIC_PLANS.find((p) => p.id === currentPlanId)?.name ?? currentPlanId}
          </span>
        </p>

        <div className="inline-flex flex-wrap items-center justify-center gap-1 p-1 rounded-full bg-muted/70 border border-border">
          {BILLING_PERIODS.map((period) => {
            const active = billingMonths === period.months;
            return (
              <button
                key={period.months}
                type="button"
                onClick={() => setBillingMonths(period.months)}
                className={`px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {period.label}
                {period.discountPercent > 0 && (
                  <span className={`ml-1 text-xs ${active ? "text-primary-foreground/90" : "text-success"}`}>
                    (−{period.discountPercent} %)
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {CLINIC_PLANS.map((plan) => {
          const Icon = PLAN_ICONS[plan.id] ?? Zap;
          const isActive = plan.id === currentPlanId;
          const isLoading = updatingPlan === plan.id;
          const pricing = computePlanTotal(plan.monthlyPrice, billingMonths);
          const lines = pricing ? formatPlanPriceLines(pricing, billing.label) : null;

          return (
            <div
              key={plan.id}
              className={`bg-card rounded-2xl p-6 border-2 transition-shadow relative ${
                plan.popular ? "border-primary shadow-elevated" : "border-border"
              } flex flex-col`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4">
                  Recommandé
                </Badge>
              )}

              <div className="text-center mb-6">
                <div
                  className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3 ${
                    plan.popular ? "gradient-hero" : "bg-primary/10"
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 ${plan.popular ? "text-primary-foreground" : "text-primary"}`}
                  />
                </div>
                <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>

                {lines && pricing ? (
                  <div className="space-y-1.5 min-h-[5.5rem] flex flex-col justify-center">
                    {lines.strike && (
                      <p className="text-sm text-muted-foreground line-through">{lines.strike}</p>
                    )}
                    <div className="flex items-baseline justify-center gap-1.5">
                      <span className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">
                        {lines.headline}
                      </span>
                      <span className="text-sm text-muted-foreground">FCFA</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-snug px-1">{lines.detail}</p>
                    {pricing.savings > 0 && (
                      <p className="text-[11px] font-medium text-success">
                        Vous économisez {formatFcfa(pricing.savings)} FCFA
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="min-h-[5.5rem] flex flex-col justify-center">
                    <span className="text-2xl sm:text-3xl font-bold text-foreground">Sur devis</span>
                    <p className="text-xs text-muted-foreground mt-1">Contactez-nous</p>
                  </div>
                )}
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
                className={`w-full ${plan.popular && !isActive ? "gradient-hero border-0" : ""}`}
                variant={isActive ? "outline" : plan.popular ? "default" : "outline"}
                disabled={isActive || !canManage || isLoading}
                onClick={() => handleSelectPlan(plan.id)}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isActive ? (
                  "Plan actuel"
                ) : plan.contactSales ? (
                  "Nous contacter"
                ) : (
                  `Choisir ${plan.name}`
                )}
              </Button>
            </div>
          );
        })}
      </div>

      {!canManage && (
        <p className="text-center text-sm text-muted-foreground mt-6">
          Seuls les administrateurs de la clinique peuvent changer de plan.
        </p>
      )}

      <div className="mt-12 bg-card rounded-xl p-6 border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Questions fréquentes</h3>
        <div className="grid sm:grid-cols-2 gap-6">
          {[
            {
              q: "Comment est calculé le prix ?",
              a: "Prix catalogue × durée, puis remise (−10 % trimestriel, −20 % semestriel, −30 % annuel). L’équivalent mensuel = total ÷ mois.",
            },
            {
              q: "Puis-je changer de plan ?",
              a: "Oui, les administrateurs peuvent changer de plan à tout moment depuis cette page.",
            },
            {
              q: "Comment payer ?",
              a: "La facturation en ligne (Mobile Money / carte) sera branchée prochainement.",
            },
            {
              q: "Plan Sur mesure ?",
              a: "Contactez le support Gesclic pour un devis adapté à votre réseau de cliniques.",
            },
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
};

function getBillingSafe(months: BillingPeriodMonths) {
  return BILLING_PERIODS.find((p) => p.months === months) ?? BILLING_PERIODS[0];
}

export default Subscriptions;
