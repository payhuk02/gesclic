import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Smartphone,
  CreditCard,
  ShieldCheck,
  Loader2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Zap,
  Crown,
  Building2,
} from "lucide-react";
import {
  CLINIC_PLANS,
  computePlanTotal,
  formatFcfa,
  type BillingPeriodMonths,
  type ClinicPlanId,
} from "@/lib/clinic-plans";
import { moneyfusionService } from "@/services/moneyfusion.service";
import { toast } from "sonner";

interface MoneyFusionPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicId: string;
  clinicName: string;
  planId: ClinicPlanId | null;
  billingMonths: BillingPeriodMonths;
  defaultClientName?: string;
  defaultPhone?: string;
}

const PLAN_ICONS: Record<ClinicPlanId, React.ElementType> = {
  essentiel: Sparkles,
  pro: Crown,
  premium: Zap,
  custom: Building2,
};

export function MoneyFusionPaymentDialog({
  open,
  onOpenChange,
  clinicId,
  clinicName,
  planId,
  billingMonths,
  defaultClientName = "",
  defaultPhone = "",
}: MoneyFusionPaymentDialogProps) {
  const [clientName, setClientName] = useState(defaultClientName);
  const [phoneNumber, setPhoneNumber] = useState(defaultPhone);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (!clientName && defaultClientName) setClientName(defaultClientName);
      if (!phoneNumber && defaultPhone) setPhoneNumber(defaultPhone);
      setErrorMessage(null);
    }
  }, [open, defaultClientName, defaultPhone]);

  if (!planId) return null;

  const plan = CLINIC_PLANS.find((p) => p.id === planId);
  const pricing = plan ? computePlanTotal(plan.monthlyPrice, billingMonths) : null;
  const PlanIcon = PLAN_ICONS[planId] ?? Zap;

  const periodLabels: Record<BillingPeriodMonths, string> = {
    1: "Mensuel (1 mois)",
    3: "Trimestriel (3 mois)",
    6: "Semestriel (6 mois)",
    12: "Annuel (12 mois)",
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = clientName.trim();
    const cleanPhone = phoneNumber.trim().replace(/\s+/g, "");

    if (!cleanName) {
      setErrorMessage("Veuillez renseigner votre nom ou raison sociale.");
      return;
    }
    if (!cleanPhone || cleanPhone.length < 8) {
      setErrorMessage("Veuillez renseigner un numéro de téléphone valide pour le paiement.");
      return;
    }

    setLoading(true);
    try {
      toast.info("Initialisation de la session MoneyFusion...", { duration: 2500 });

      const returnUrl = `${window.location.origin}/subscriptions?payment=check`;

      const result = await moneyfusionService.initiateSubscriptionPayment({
        clinicId,
        clinicName,
        planId,
        billingMonths,
        clientName: cleanName,
        phoneNumber: cleanPhone,
        returnUrl,
      });

      if (result.success && result.url) {
        toast.success("Redirection vers la passerelle sécurisée...");
        // Store in sessionStorage to remember the pending payment token
        try {
          sessionStorage.setItem("mf_pending_token", result.token);
          sessionStorage.setItem("mf_pending_clinic", clinicId);
          sessionStorage.setItem("mf_pending_plan", planId);
        } catch {
          // ignore storage error
        }

        // Redirect to MoneyFusion hosted checkout page
        window.location.href = result.url;
      } else {
        throw new Error(result.message || "Impossible d'obtenir l'URL de paiement.");
      }
    } catch (err) {
      console.error("Payment initiation error:", err);
      const msg = err instanceof Error ? err.message : "Erreur lors de l'initialisation du paiement";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const isIpError = errorMessage?.toLowerCase().includes("ip non autorisée") ||
    errorMessage?.toLowerCase().includes("application non approuvée");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <PlanIcon className="w-5 h-5" />
            </div>
            <DialogTitle className="text-xl">Paiement d'abonnement</DialogTitle>
          </div>
          <DialogDescription>
            Réglez votre abonnement via Mobile Money (Orange, Wave, MTN, Moov) ou Carte bancaire.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handlePay} className="space-y-4 pt-1">
          {/* Summary Box */}
          <div className="bg-muted/50 rounded-xl p-4 border border-border space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground text-base">Plan {plan?.name}</p>
                <p className="text-xs text-muted-foreground">{periodLabels[billingMonths]}</p>
              </div>
              <Badge variant="outline" className="bg-background text-foreground font-medium">
                {clinicName}
              </Badge>
            </div>

            {pricing && (
              <div className="pt-2 border-t border-border flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-muted-foreground">Total à régler :</span>
                  {pricing.savings > 0 && (
                    <p className="text-[11px] text-success font-medium">
                      Économie de {formatFcfa(pricing.savings)} FCFA ({pricing.discountPercent}%)
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-foreground tabular-nums">
                    {formatFcfa(pricing.total)}
                  </span>
                  <span className="text-sm text-muted-foreground ml-1">FCFA</span>
                </div>
              </div>
            )}

            {/* Payment methods badges */}
            <div className="pt-2 border-t border-border/60 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1 font-medium text-foreground">
                <Smartphone className="w-3.5 h-3.5 text-primary" /> Mobile Money :
              </span>
              <span className="px-1.5 py-0.5 rounded bg-background border text-foreground/80">Orange</span>
              <span className="px-1.5 py-0.5 rounded bg-background border text-foreground/80">Wave</span>
              <span className="px-1.5 py-0.5 rounded bg-background border text-foreground/80">MTN</span>
              <span className="px-1.5 py-0.5 rounded bg-background border text-foreground/80">Moov</span>
              <span className="flex items-center gap-1 ml-auto font-medium text-foreground">
                <CreditCard className="w-3.5 h-3.5 text-primary" /> Carte
              </span>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="clientName" className="text-xs font-semibold">
                Nom complet ou Raison sociale <span className="text-destructive">*</span>
              </Label>
              <Input
                id="clientName"
                placeholder="Ex: Dr. Martin Dupont"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phoneNumber" className="text-xs font-semibold">
                Numéro de téléphone pour le paiement <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="Ex: 0102030405 ou +225 07..."
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-[11px] text-muted-foreground">
                Le compte Mobile Money sur lequel sera initiée la demande de débit.
              </p>
            </div>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertTitle>Échec de l'opération</AlertTitle>
              <AlertDescription className="text-xs mt-1 space-y-1">
                <p>{errorMessage}</p>
                {isIpError && (
                  <p className="text-[11px] text-foreground/90 font-medium pt-1">
                    👉 Veuillez autoriser l'adresse IP affichée dans votre espace marchand sur{" "}
                    <a
                      href="https://moneyfusion.net/dashboard/pay"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-bold"
                    >
                      moneyfusion.net/dashboard/pay
                    </a>
                    .
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Security notice */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/50">
            <ShieldCheck className="w-4 h-4 text-success flex-shrink-0" />
            <span>Paiement crypté et sécurisé par la passerelle agréée Moneyfusion.net.</span>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="gradient-hero border-0 text-white font-medium"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connexion MoneyFusion...
                </>
              ) : (
                <>
                  Payer avec MoneyFusion
                  <ExternalLink className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
