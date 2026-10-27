import { supabase } from "@/integrations/supabase/client";
import {
  CLINIC_PLANS,
  computePlanTotal,
  type BillingPeriodMonths,
  type ClinicPlanId,
} from "@/lib/clinic-plans";
import { clinicSettingsService } from "@/services/clinic-settings.service";

export interface InitiatePaymentParams {
  clinicId: string;
  clinicName?: string;
  planId: ClinicPlanId;
  billingMonths: BillingPeriodMonths;
  clientName: string;
  phoneNumber: string;
  returnUrl?: string;
}

export interface PaymentInitiationResult {
  success: boolean;
  token: string;
  url: string;
  paymentId?: string;
  amount: number;
  message?: string;
}

export interface MoneyFusionNotificationResponse {
  statut: boolean;
  message?: string;
  data?: {
    _id?: string;
    tokenPay: string;
    numeroSend: string;
    nomclient: string;
    personal_Info?: Array<{
      paymentId?: string;
      clinicId?: string;
      planId?: ClinicPlanId;
      billingMonths?: number;
      userId?: string;
    }>;
    numeroTransaction?: string;
    Montant: number;
    frais?: number;
    statut: "paid" | "pending" | "failure" | "no paid" | string;
    moyen?: string;
    return_url?: string;
    createdAt?: string;
  };
}

class MoneyFusionService {
  private getApiUrl(): string {
    const url =
      (import.meta.env.VITE_MONEYFUSION_API_URL as string | undefined) ||
      "https://pay.moneyfusion.net/Amova_Space/dcd2cd8166d9289a/pay/";
    return url.trim();
  }

  /**
   * Initiates payment for a clinic subscription.
   * Tries Supabase Edge Function first, falls back to direct client call if not deployed.
   */
  async initiateSubscriptionPayment(
    params: InitiatePaymentParams
  ): Promise<PaymentInitiationResult> {
    const {
      clinicId,
      planId,
      billingMonths,
      clientName,
      phoneNumber,
      returnUrl = `${window.location.origin}/subscriptions?payment=check`,
    } = params;

    const plan = CLINIC_PLANS.find((p) => p.id === planId);
    if (!plan || plan.monthlyPrice === null) {
      throw new Error("Ce plan ne peut pas être réglé en ligne.");
    }

    const pricing = computePlanTotal(plan.monthlyPrice, billingMonths);
    if (!pricing) {
      throw new Error("Erreur de calcul du montant de l'abonnement.");
    }

    const cleanPhone = phoneNumber.trim().replace(/\s+/g, "");
    if (!cleanPhone || cleanPhone.length < 8) {
      throw new Error("Veuillez renseigner un numéro de téléphone valide pour le paiement.");
    }

    // 1. Try Supabase Edge Function
    try {
      const { data, error } = await supabase.functions.invoke("moneyfusion-pay", {
        body: {
          clinicId,
          planId,
          billingMonths,
          clientName: clientName.trim(),
          phoneNumber: cleanPhone,
          returnUrl,
        },
      });

      if (!error && data?.success && data?.url) {
        return {
          success: true,
          token: data.token,
          url: data.url,
          paymentId: data.paymentId,
          amount: data.amount ?? pricing.total,
          message: data.message,
        };
      }

      if (error && error.message && !error.message.includes("404") && !error.message.includes("Failed to send a request")) {
        // Business error from the edge function (e.g. IP unauthorized or invalid parameters)
        console.warn("Edge function returned error:", error);
      }
    } catch (edgeErr) {
      console.warn("Edge function moneyfusion-pay unavailable, using direct client flow:", edgeErr);
    }

    // 2. Client-side resilient fallback
    return this.initiateDirectClientPayment({
      clinicId,
      planId,
      billingMonths,
      clientName: clientName.trim(),
      phoneNumber: cleanPhone,
      returnUrl,
      amount: pricing.total,
      planName: plan.name,
      discountPercent: pricing.discountPercent,
    });
  }

  private async initiateDirectClientPayment(opts: {
    clinicId: string;
    planId: ClinicPlanId;
    billingMonths: BillingPeriodMonths;
    clientName: string;
    phoneNumber: string;
    returnUrl: string;
    amount: number;
    planName: string;
    discountPercent: number;
  }): Promise<PaymentInitiationResult> {
    const {
      clinicId,
      planId,
      billingMonths,
      clientName,
      phoneNumber,
      returnUrl,
      amount,
      planName,
      discountPercent,
    } = opts;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Create pending record in subscription_payments
    const { data: record, error: insertErr } = await supabase
      .from("subscription_payments")
      .insert({
        clinic_id: clinicId,
        user_id: user?.id ?? null,
        plan: planId,
        billing_months: billingMonths,
        amount,
        currency: "XOF",
        status: "pending",
        payment_method: "moneyfusion",
        client_name: clientName,
        phone_number: phoneNumber,
        metadata: {
          plan_name: planName,
          discount_percent: discountPercent,
          source: "client_direct",
        },
      })
      .select()
      .single();

    if (insertErr || !record) {
      console.error("Error creating payment record in Supabase:", insertErr);
      throw new Error(insertErr?.message || "Impossible d'initialiser la transaction.");
    }

    // 2. Call MoneyFusion API
    const apiUrl = this.getApiUrl();
    const payload = {
      totalPrice: amount,
      article: [
        {
          [`Abonnement ${planName} (${billingMonths} mois)`]: amount,
        },
      ],
      personal_Info: [
        {
          paymentId: record.id,
          clinicId,
          planId,
          billingMonths,
          userId: user?.id,
        },
      ],
      numeroSend: phoneNumber,
      nomclient: clientName,
      return_url: returnUrl,
      webhook_url: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/moneyfusion-webhook`,
    };

    let response: Response;
    try {
      response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (netErr) {
      console.error("Network error connecting to MoneyFusion:", netErr);
      throw new Error(
        "Impossible de contacter la passerelle MoneyFusion. Vérifiez votre connexion internet ou la configuration réseau."
      );
    }

    const data = await response.json().catch(() => null);

    if (!response.ok || !data || !data.statut) {
      const errMsg =
        data?.message ||
        data?.error ||
        `Échec de paiement MoneyFusion (${response.status} ${response.statusText})`;

      // Update record to failed
      await supabase
        .from("subscription_payments")
        .update({
          status: "failed",
          metadata: {
            ...((record.metadata as Record<string, unknown>) || {}),
            error: errMsg,
          },
        })
        .eq("id", record.id);

      throw new Error(errMsg);
    }

    // 3. Update record with MoneyFusion token & checkout URL
    await supabase
      .from("subscription_payments")
      .update({
        moneyfusion_token: data.token,
        moneyfusion_url: data.url,
      })
      .eq("id", record.id);

    return {
      success: true,
      token: data.token,
      url: data.url,
      paymentId: record.id,
      amount,
      message: data.message,
    };
  }

  /**
   * Checks payment status directly with MoneyFusion using token
   */
  async checkPaymentStatus(token: string): Promise<MoneyFusionNotificationResponse> {
    const cleanToken = token.trim();
    if (!cleanToken) {
      throw new Error("Token de paiement invalide.");
    }

    const url = `https://pay.moneyfusion.net/paiementNotif/${encodeURIComponent(cleanToken)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de la vérification du paiement (${response.status})`);
    }

    const result = (await response.json()) as MoneyFusionNotificationResponse;
    return result;
  }

  /**
   * Validates a paid token, updates subscription_payments record, and activates clinic plan.
   */
  async confirmPaymentAndActivatePlan(
    token: string,
    clinicId?: string
  ): Promise<{
    success: boolean;
    statut: string;
    plan?: ClinicPlanId;
    message: string;
  }> {
    const statusData = await this.checkPaymentStatus(token);
    const paymentInfo = statusData.data;

    if (!statusData.statut || !paymentInfo) {
      return {
        success: false,
        statut: "unknown",
        message: statusData.message || "Impossible de récupérer les détails du paiement.",
      };
    }

    const currentStatus = paymentInfo.statut; // "paid" | "pending" | "failure" | "no paid"

    // Find the payment record in Supabase
    const { data: payments } = await supabase
      .from("subscription_payments")
      .select("*")
      .eq("moneyfusion_token", token)
      .limit(1);

    const paymentRecord = payments && payments.length > 0 ? payments[0] : null;
    const targetClinicId = clinicId || paymentRecord?.clinic_id || paymentInfo.personal_Info?.[0]?.clinicId;
    const targetPlanId = (paymentRecord?.plan || paymentInfo.personal_Info?.[0]?.planId) as ClinicPlanId | undefined;

    if (currentStatus === "paid") {
      // 1. Update database payment record
      if (paymentRecord && paymentRecord.status !== "paid") {
        await supabase
          .from("subscription_payments")
          .update({
            status: "paid",
            moneyfusion_transaction_id: paymentInfo.numeroTransaction || null,
            paid_at: new Date().toISOString(),
          })
          .eq("id", paymentRecord.id);
      }

      // 2. Activate the plan on clinic
      if (targetClinicId && targetPlanId) {
        const months = Number(paymentRecord?.billing_months) || 1;
        await clinicSettingsService.updateClinicPlan(targetClinicId, targetPlanId, months);
      }

      return {
        success: true,
        statut: "paid",
        plan: targetPlanId,
        message: "Paiement confirmé avec succès ! Votre plan a été activé.",
      };
    }

    if (currentStatus === "pending") {
      return {
        success: false,
        statut: "pending",
        plan: targetPlanId,
        message: "Paiement en cours de traitement par l'opérateur Mobile Money.",
      };
    }

    // Failure / No paid
    if (paymentRecord && paymentRecord.status === "pending") {
      await supabase
        .from("subscription_payments")
        .update({ status: "failed" })
        .eq("id", paymentRecord.id);
    }

    return {
      success: false,
      statut: currentStatus,
      plan: targetPlanId,
      message: "Le paiement n'a pas abouti ou a été annulé.",
    };
  }

  /**
   * Retrieves past subscription payments for a given clinic.
   */
  async getClinicPaymentHistory(clinicId: string) {
    const { data, error } = await supabase
      .from("subscription_payments")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Error fetching subscription payments history:", error);
      return [];
    }
    return data || [];
  }
}

export const moneyfusionService = new MoneyFusionService();
