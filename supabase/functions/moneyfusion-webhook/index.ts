import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Méthode non autorisée" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    console.log("[MoneyFusion Webhook] Données reçues:", JSON.stringify(payload));

    const tokenPay = payload.tokenPay || payload.token;
    const event = payload.event;
    const statut = payload.statut;
    const personalInfo = Array.isArray(payload.personal_Info) && payload.personal_Info.length > 0
      ? payload.personal_Info[0]
      : null;

    if (!tokenPay && !personalInfo?.paymentId) {
      console.warn("[MoneyFusion Webhook] Token ou paymentId manquant dans le webhook");
      return json({ error: "Données de transaction insuffisantes" }, 400);
    }

    // Find the payment record
    let query = supabaseAdmin.from("subscription_payments").select("*");
    if (tokenPay) {
      query = query.eq("moneyfusion_token", tokenPay);
    } else if (personalInfo?.paymentId) {
      query = query.eq("id", personalInfo.paymentId);
    }

    const { data: payments, error: findError } = await query;
    if (findError || !payments || payments.length === 0) {
      console.warn("[MoneyFusion Webhook] Aucun enregistrement trouvé pour le token/paymentId:", tokenPay);
      return json({ error: "Transaction introuvable" }, 404);
    }

    const payment = payments[0];

    // Check if already processed
    if (payment.status === "paid") {
      console.log("[MoneyFusion Webhook] Paiement déjà validé:", payment.id);
      return json({ message: "Paiement déjà traité", paymentId: payment.id });
    }

    const isPaid =
      event === "payin.session.completed" ||
      statut === "paid" ||
      statut === true;

    const isCancelled =
      event === "payin.session.cancelled" ||
      statut === "failure" ||
      statut === "no paid";

    if (isPaid) {
      // 1. Update subscription payment record
      const { error: updatePaymentError } = await supabaseAdmin
        .from("subscription_payments")
        .update({
          status: "paid",
          moneyfusion_transaction_id: payload.numeroTransaction || payment.moneyfusion_transaction_id,
          paid_at: new Date().toISOString(),
          metadata: {
            ...payment.metadata,
            webhook_payload: payload,
          },
        })
        .eq("id", payment.id);

      if (updatePaymentError) {
        console.error("[MoneyFusion Webhook] Erreur mise à jour paiement:", updatePaymentError);
      }

      // 2. Update clinic plan (paid period starts now)
      const months = Math.max(1, Number(payment.billing_months) || 1);
      const subscriptionEnds = new Date();
      subscriptionEnds.setMonth(subscriptionEnds.getMonth() + months);
      const { error: updateClinicError } = await supabaseAdmin
        .from("clinics")
        .update({
          plan: payment.plan,
          subscription_ends_at: subscriptionEnds.toISOString(),
          trial_ends_at: null,
        })
        .eq("id", payment.clinic_id);

      if (updateClinicError) {
        console.error("[MoneyFusion Webhook] Erreur activation plan clinique:", updateClinicError);
      }

      // 3. Log notification for clinic
      try {
        await supabaseAdmin.from("notifications").insert({
          clinic_id: payment.clinic_id,
          title: "Abonnement activé",
          message: `Votre abonnement au plan ${payment.plan.toUpperCase()} a été confirmé via MoneyFusion.`,
          type: "billing",
          user_id: payment.user_id,
        });
      } catch (e) {
        console.warn("[MoneyFusion Webhook] Erreur création notification:", e);
      }

      console.log(`[MoneyFusion Webhook] Clinique ${payment.clinic_id} mise à jour avec succès au plan ${payment.plan}`);
      return json({ message: "Paiement confirmé et abonnement activé", status: "paid" });
    } else if (isCancelled) {
      await supabaseAdmin
        .from("subscription_payments")
        .update({
          status: "failed",
          metadata: {
            ...payment.metadata,
            cancelled_payload: payload,
          },
        })
        .eq("id", payment.id);

      console.log(`[MoneyFusion Webhook] Paiement ${payment.id} marqué comme échoué/annulé`);
      return json({ message: "Paiement annulé enregistré", status: "failed" });
    }

    return json({ message: "Notification reçue (en attente)", status: "pending" });
  } catch (error) {
    console.error("[MoneyFusion Webhook] Erreur non gérée:", error);
    return json({ error: error instanceof Error ? error.message : "Erreur interne" }, 500);
  }
});
