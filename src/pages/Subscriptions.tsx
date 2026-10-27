import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Zap,
  Crown,
  Building2,
  Sparkles,
  Loader2,
  Smartphone,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useClinic } from "@/contexts/ClinicContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  BILLING_PERIODS,
  CLINIC_PLANS,
  computePlanTotal,
  formatFcfa,
  formatPlanPriceLines,
  type BillingPeriodMonths,
  type ClinicPlanId,
} from "@/lib/clinic-plans";
import { BillingPeriodToggle } from "@/components/BillingPeriodToggle";
import { MoneyFusionPaymentDialog } from "@/components/dialogs/MoneyFusionPaymentDialog";
import { moneyfusionService } from "@/services/moneyfusion.service";

const PLAN_ICONS = {
  essentiel: Sparkles,
  pro: Crown,
  premium: Zap,
  custom: Building2,
} as const;

interface PaymentHistoryItem {
  id: string;
  plan: string;
  billing_months: number;
  amount: number;
  status: string;
  moneyfusion_token: string | null;
  moneyfusion_transaction_id: string | null;
  created_at: string;
}

const Subscriptions = () => {
  const { activeClinicId, activeClinic, hasClinicRole, refetch, effectivePlan } = useClinic();
  const { hasRole, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const canManage = hasRole("admin") || hasClinicRole("admin");
  const [billingMonths, setBillingMonths] = useState<BillingPeriodMonths>(1);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<ClinicPlanId | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const currentPlanId = effectivePlan;
  const billing = getBillingSafe(billingMonths);

  // Fetch payment history when activeClinicId changes
  useEffect(() => {
    if (!activeClinicId || !canManage) return;

    let isMounted = true;
    setLoadingHistory(true);
    moneyfusionService
      .getClinicPaymentHistory(activeClinicId)
      .then((history) => {
        if (isMounted) setPaymentHistory(history as PaymentHistoryItem[]);
      })
      .catch((err) => console.warn("Could not load payment history:", err))
      .finally(() => {
        if (isMounted) setLoadingHistory(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeClinicId, canManage]);

  // Handle return from MoneyFusion checkout
  useEffect(() => {
    const isPaymentCheck = searchParams.get("payment") === "check";
    const tokenFromUrl = searchParams.get("token");
    const tokenFromStorage = sessionStorage.getItem("mf_pending_token");
    const tokenToVerify = tokenFromUrl || (isPaymentCheck ? tokenFromStorage : null);

    if (tokenToVerify) {
      let isMounted = true;
      setCheckingPayment(true);

      toast.info("Vérification du statut de votre paiement MoneyFusion...", { id: "mf-check" });

      moneyfusionService
        .confirmPaymentAndActivatePlan(tokenToVerify, activeClinicId || undefined)
        .then(async (result) => {
          if (!isMounted) return;

          if (result.success) {
            toast.success(result.message || "Abonnement activé avec succès !", { id: "mf-check" });
            await refetch();
            sessionStorage.removeItem("mf_pending_token");
            sessionStorage.removeItem("mf_pending_clinic");
            sessionStorage.removeItem("mf_pending_plan");

            // Refresh history
            if (activeClinicId) {
              const history = await moneyfusionService.getClinicPaymentHistory(activeClinicId);
              setPaymentHistory(history as PaymentHistoryItem[]);
            }
          } else if (result.statut === "pending") {
            toast.info("Paiement en cours de traitement par l'opérateur Mobile Money. Votre plan s'activera dès validation.", {
              id: "mf-check",
              duration: 7000,
            });
          } else {
            toast.error(result.message || "Paiement non confirmé ou annulé.", { id: "mf-check" });
          }
        })
        .catch((err) => {
          console.error("Error verifying payment:", err);
          if (isMounted) {
            toast.error("Impossible de vérifier le paiement pour le moment. Réessayez ou contactez le support.", { id: "mf-check" });
          }
        })
        .finally(() => {
          if (isMounted) {
            setCheckingPayment(false);
            const newParams = new URLSearchParams(searchParams);
            newParams.delete("payment");
            newParams.delete("token");
            setSearchParams(newParams, { replace: true });
          }
        });

      return () => {
        isMounted = false;
      };
    }
  }, [searchParams, setSearchParams, activeClinicId, refetch]);

  const handleSelectPlan = (planId: ClinicPlanId) => {
    if (!canManage || !activeClinicId || planId === currentPlanId) return;

    if (planId === "custom") {
      toast.info("Contactez le support Gesclic pour un devis Sur mesure.");
      return;
    }

    setSelectedPlanForPayment(planId);
    setPaymentDialogOpen(true);
  };

  const defaultClientName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    activeClinic?.name ||
    "";
  const defaultPhone =
    (activeClinic?.settings as { phone?: string })?.phone || "";

  return (
    <AppLayout title="Abonnements">
      {/* Verification overlay badge */}
      {checkingPayment && (
        <div className="mb-6 bg-primary/10 border border-primary/20 text-primary p-4 rounded-xl flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">
            Vérification de votre paiement en cours auprès de MoneyFusion...
          </span>
        </div>
      )}

      <div className="text-center mb-8 max-w-2xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Tarifs</h2>
        <p className="text-muted-foreground text-sm sm:text-base mb-1">Simple et transparent</p>
        <p className="text-sm text-muted-foreground mb-4">
          Tarifs en FCFA, par clinique. 7 jours d&apos;essai Pro sans carte. Engagement long = réduction. Plan actuel :{" "}
          <span className="font-medium text-foreground">
            {CLINIC_PLANS.find((p) => p.id === currentPlanId)?.name ?? currentPlanId}
          </span>
        </p>

        {/* Accepted Payment Methods Preview */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground mb-6">
          <span className="font-semibold text-foreground flex items-center gap-1">
            <Smartphone className="w-3.5 h-3.5 text-primary" /> Paiement sécurisé MoneyFusion :
          </span>
          <span>Orange Money</span>
          <span>•</span>
          <span>Wave</span>
          <span>•</span>
          <span>MTN</span>
          <span>•</span>
          <span>Moov</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <CreditCard className="w-3 h-3 text-primary" /> Carte
          </span>
        </div>

        <BillingPeriodToggle value={billingMonths} onChange={setBillingMonths} />
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {CLINIC_PLANS.map((plan) => {
          const Icon = PLAN_ICONS[plan.id] ?? Zap;
          const isActive = plan.id === currentPlanId;
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
                <Icon
                  className="w-8 h-8 mx-auto mb-3 text-primary"
                  strokeWidth={1.75}
                />
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
                disabled={isActive || !canManage || checkingPayment}
                onClick={() => handleSelectPlan(plan.id)}
              >
                {isActive ? (
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
          Seuls les administrateurs de la clinique peuvent changer de plan ou effectuer un paiement.
        </p>
      )}

      {/* Payment History Section */}
      {canManage && paymentHistory.length > 0 && (
        <div className="mt-12 bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Historique des paiements d'abonnement</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Plan</th>
                  <th className="pb-3 font-medium">Durée</th>
                  <th className="pb-3 font-medium">Montant</th>
                  <th className="pb-3 font-medium">Statut</th>
                  <th className="pb-3 font-medium">Réf. MoneyFusion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paymentHistory.map((item) => {
                  const isPaid = item.status === "paid";
                  const isPending = item.status === "pending";
                  const dateStr = item.created_at
                    ? new Date(item.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-";

                  return (
                    <tr key={item.id} className="hover:bg-muted/30">
                      <td className="py-3 text-muted-foreground">{dateStr}</td>
                      <td className="py-3 font-medium capitalize text-foreground">{item.plan}</td>
                      <td className="py-3 text-muted-foreground">{item.billing_months} mois</td>
                      <td className="py-3 font-semibold text-foreground tabular-nums">
                        {formatFcfa(item.amount)} FCFA
                      </td>
                      <td className="py-3">
                        {isPaid ? (
                          <Badge className="bg-success/15 text-success border-success/30 font-medium">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Payé
                          </Badge>
                        ) : isPending ? (
                          <Badge className="bg-warning/15 text-warning border-warning/30 font-medium">
                            <Clock className="w-3 h-3 mr-1" /> En attente
                          </Badge>
                        ) : (
                          <Badge className="bg-destructive/15 text-destructive border-destructive/30 font-medium">
                            <AlertTriangle className="w-3 h-3 mr-1" /> Échoué
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 text-xs text-muted-foreground font-mono">
                        {item.moneyfusion_transaction_id || item.moneyfusion_token || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Frequently Asked Questions */}
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
              a: "Oui, les administrateurs peuvent changer de plan à tout moment en réglant leur nouvelle formule.",
            },
            {
              q: "Comment régler mon abonnement ?",
              a: "Le paiement s'effectue directement en ligne par MoneyFusion : Mobile Money (Orange Money, Wave, MTN, Moov) ou Carte bancaire. Votre abonnement est activé immédiatement dès confirmation.",
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

      {/* MoneyFusion Payment Modal */}
      {selectedPlanForPayment && activeClinicId && (
        <MoneyFusionPaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          clinicId={activeClinicId}
          clinicName={activeClinic?.name ?? "Ma Clinique"}
          planId={selectedPlanForPayment}
          billingMonths={billingMonths}
          defaultClientName={defaultClientName}
          defaultPhone={defaultPhone}
        />
      )}
    </AppLayout>
  );
};

function getBillingSafe(months: BillingPeriodMonths) {
  return BILLING_PERIODS.find((p) => p.months === months) ?? BILLING_PERIODS[0];
}

export default Subscriptions;
