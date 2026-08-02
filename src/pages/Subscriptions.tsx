import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Crown, Building2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useClinic } from "@/contexts/ClinicContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CLINIC_PLANS, isClinicPlanId, type ClinicPlanId } from "@/lib/clinic-plans";
import { clinicSettingsService } from "@/services/clinic-settings.service";

const PLAN_ICONS = {
  free: Star,
  pro: Crown,
  enterprise: Building2,
} as const;

const Subscriptions = () => {
  const { activeClinicId, activeClinic, hasClinicRole, refetch } = useClinic();
  const { hasRole } = useAuth();
  const canManage = hasRole("admin") || hasClinicRole("admin");
  const [updatingPlan, setUpdatingPlan] = useState<ClinicPlanId | null>(null);

  const currentPlanId = isClinicPlanId(activeClinic?.plan ?? "")
    ? (activeClinic!.plan as ClinicPlanId)
    : "free";

  const handleSelectPlan = async (planId: ClinicPlanId) => {
    if (!canManage || !activeClinicId || planId === currentPlanId) return;
    if (planId === "enterprise") {
      toast.info("Contactez le support Gesclic pour le plan Entreprise.");
      return;
    }

    setUpdatingPlan(planId);
    try {
      await clinicSettingsService.updateClinicPlan(activeClinicId, planId);
      await refetch();
      toast.success(`Plan ${CLINIC_PLANS.find((p) => p.id === planId)?.name} activé`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors du changement de plan");
    } finally {
      setUpdatingPlan(null);
    }
  };

  return (
    <AppLayout title="Abonnements">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Choisissez votre plan</h2>
        <p className="text-muted-foreground">
          Plans alignés sur votre compte : <span className="font-medium">{currentPlanId}</span>
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CLINIC_PLANS.map((plan) => {
          const Icon = PLAN_ICONS[plan.id] ?? Zap;
          const isActive = plan.id === currentPlanId;
          const isLoading = updatingPlan === plan.id;

          return (
            <div
              key={plan.id}
              className={`bg-card rounded-2xl p-6 border-2 transition-shadow relative ${
                plan.popular ? "border-primary shadow-elevated" : "border-border"
              } flex flex-col`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4">
                  Populaire
                </Badge>
              )}
              <div className="text-center mb-6">
                <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3 ${plan.popular ? "gradient-hero" : "bg-primary/10"}`}>
                  <Icon className={`w-6 h-6 ${plan.popular ? "text-primary-foreground" : "text-primary"}`} />
                </div>
                <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-2xl sm:text-3xl font-bold text-foreground">{plan.price}</span>
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
                className={`w-full ${plan.popular && !isActive ? "gradient-hero border-0" : ""}`}
                variant={isActive ? "outline" : plan.popular ? "default" : "outline"}
                disabled={isActive || !canManage || isLoading}
                onClick={() => handleSelectPlan(plan.id)}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isActive ? (
                  "Plan actuel"
                ) : plan.id === "enterprise" ? (
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
            { q: "Puis-je changer de plan ?", a: "Oui, les administrateurs peuvent passer de Gratuit à Pro à tout moment." },
            { q: "Y a-t-il un engagement ?", a: "Non, tous les plans sont sans engagement." },
            { q: "Comment payer ?", a: "La facturation en ligne sera activée prochainement." },
            { q: "Plan Entreprise ?", a: "Contactez le support Gesclic pour un devis personnalisé." },
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

export default Subscriptions;
