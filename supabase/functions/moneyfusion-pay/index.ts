import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const PLAN_PRICING: Record<string, { name: string; monthlyPrice: number }> = {
  essentiel: { name: "Essentiel", monthlyPrice: 5900 },
  pro: { name: "Pro", monthlyPrice: 7500 },
  premium: { name: "Premium", monthlyPrice: 12500 },
};

const BILLING_DISCOUNTS: Record<number, number> = {
  1: 0,
  3: 10,
  6: 20,
  12: 30,
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const moneyfusionUrl =
      Deno.env.get("MONEYFUSION_API_URL") ??
      "https://pay.moneyfusion.net/Amova_Space/dcd2cd8166d9289a/pay/";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Non autorisé: En-tête Authorization manquant" }, 401);
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return json({ error: "Session invalide ou expirée" }, 401);
    }

    const body = await req.json();
    const { clinicId, planId, billingMonths = 1, clientName, phoneNumber, returnUrl } = body;

    if (!clinicId || !planId || !clientName || !phoneNumber) {
      return json({ error: "Paramètres requis manquants (clinicId, planId, clientName, phoneNumber)" }, 400);
    }

    const plan = PLAN_PRICING[planId];
    if (!plan) {
      return json({ error: `Plan '${planId}' invalide ou non payable en ligne` }, 400);
    }

    const months = Number(billingMonths);
    const discountPercent = BILLING_DISCOUNTS[months] ?? 0;
    const listTotal = plan.monthlyPrice * months;
    const totalPrice = Math.round(listTotal * (1 - discountPercent / 100));

    // Verify user is an active admin for this clinic
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: member, error: memberError } = await supabaseAdmin
      .from("clinic_members")
      .select("role, is_active")
      .eq("clinic_id", clinicId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (memberError || !member || member.role !== "admin") {
      return json({ error: "Seuls les administrateurs de la clinique peuvent souscrire un abonnement" }, 403);
    }

    // Insert pending subscription payment record
    const { data: paymentRecord, error: insertError } = await supabaseAdmin
      .from("subscription_payments")
      .insert({
        clinic_id: clinicId,
        user_id: user.id,
        plan: planId,
        billing_months: months,
        amount: totalPrice,
        currency: "XOF",
        status: "pending",
        payment_method: "moneyfusion",
        client_name: clientName,
        phone_number: phoneNumber,
        metadata: {
          plan_name: plan.name,
          discount_percent: discountPercent,
          list_total: listTotal,
          initiated_by: user.email,
        },
      })
      .select()
      .single();

    if (insertError || !paymentRecord) {
      console.error("Error creating subscription_payments record:", insertError);
      return json({ error: "Impossible de créer l'enregistrement de paiement" }, 500);
    }

    // Prepare MoneyFusion request payload
    const webhookUrl =
      Deno.env.get("MONEYFUSION_WEBHOOK_URL") ||
      `${supabaseUrl}/functions/v1/moneyfusion-webhook`;

    const cleanPhone = String(phoneNumber).trim().replace(/\s+/g, "");
    const mfPayload = {
      totalPrice,
      article: [
        {
          [`Abonnement ${plan.name} (${months} mois)`]: totalPrice,
        },
      ],
      personal_Info: [
        {
          paymentId: paymentRecord.id,
          clinicId,
          planId,
          billingMonths: months,
          userId: user.id,
        },
      ],
      numeroSend: cleanPhone,
      nomclient: String(clientName).trim(),
      return_url: returnUrl || "",
      webhook_url: webhookUrl,
    };

    console.log("Calling MoneyFusion API:", moneyfusionUrl, JSON.stringify(mfPayload));

    const mfResponse = await fetch(moneyfusionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mfPayload),
    });

    const mfData = await mfResponse.json().catch(() => null);
    console.log("MoneyFusion response:", mfResponse.status, mfData);

    if (!mfResponse.ok || !mfData || !mfData.statut) {
      const errorMessage =
        mfData?.message ||
        mfData?.error ||
        `Échec de connexion à MoneyFusion (HTTP ${mfResponse.status})`;

      // Mark payment as failed
      await supabaseAdmin
        .from("subscription_payments")
        .update({
          status: "failed",
          metadata: {
            ...paymentRecord.metadata,
            error: errorMessage,
          },
        })
        .eq("id", paymentRecord.id);

      return json({ error: errorMessage }, 400);
    }

    // Success: MoneyFusion provided payment url & token
    await supabaseAdmin
      .from("subscription_payments")
      .update({
        moneyfusion_token: mfData.token,
        moneyfusion_url: mfData.url,
      })
      .eq("id", paymentRecord.id);

    return json({
      success: true,
      token: mfData.token,
      url: mfData.url,
      paymentId: paymentRecord.id,
      amount: totalPrice,
      message: mfData.message || "Paiement initié avec succès",
    });
  } catch (error) {
    console.error("Unhandled error in moneyfusion-pay:", error);
    return json(
      { error: error instanceof Error ? error.message : "Erreur interne du serveur" },
      500
    );
  }
});
