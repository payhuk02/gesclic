<<<<<<< HEAD
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const FALLBACK_PROMPTS: Record<string, string> = {
  diagnostic: `Tu es un assistant médical IA spécialisé dans l'aide au diagnostic. Tu ne poses PAS de diagnostic définitif, tu fournis des pistes. Réponds en français : analyse des symptômes, diagnostics possibles, examens recommandés, signaux d'alerte.`,
  summary: `Tu es un assistant médical IA spécialisé dans le résumé de dossiers médicaux. Réponds en français : résumé patient, historique, traitements en cours, points d'attention.`,
};

const errorResponse = (message: string, status: number) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function sseFromText(text: string) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`),
      );
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const started = Date.now();
  let providerName = "lovable";
  let modelName = "google/gemini-3.6-flash";
  let featureKey = "diagnostic";

  try {
    const { messages, mode } = await req.json();
    featureKey = typeof mode === "string" && mode ? mode : "diagnostic";

    // Resolve feature configuration
    const { data: feature } = await admin
      .from("ai_features")
      .select("*")
      .eq("feature_key", featureKey)
      .maybeSingle();

    if (feature && feature.enabled === false) {
      return errorResponse("Cette fonctionnalité IA est désactivée par l'administrateur.", 403);
    }

    // Resolve provider: feature's provider, else first enabled provider by priority
    let provider: any = null;
    if (feature?.provider_id) {
      const { data } = await admin.from("ai_providers").select("*").eq("id", feature.provider_id).maybeSingle();
      provider = data;
    }
    if (!provider || provider.enabled === false) {
      const { data } = await admin
        .from("ai_providers")
        .select("*")
        .eq("enabled", true)
        .order("priority")
        .limit(1);
      provider = data?.[0] ?? null;
    }
    if (!provider) {
      provider = {
        provider: "lovable",
        base_url: "https://ai.gateway.lovable.dev/v1",
        default_model: "google/gemini-3.6-flash",
        api_key: null,
      };
    }

    providerName = provider.provider;
    modelName = feature?.model || provider.default_model || "google/gemini-3.6-flash";

    const apiKey =
      provider.api_key ||
      (provider.provider === "lovable" ? Deno.env.get("LOVABLE_API_KEY") : null);
    if (!apiKey) {
      return errorResponse(
        `Aucune clé API configurée pour le fournisseur « ${provider.label ?? provider.provider} ». Configurez-la dans Administration → IA.`,
        400,
      );
    }

    const systemMessage =
      feature?.system_prompt || FALLBACK_PROMPTS[featureKey] || FALLBACK_PROMPTS.diagnostic;
    const temperature = feature?.temperature ?? 0.3;
    const maxTokens = feature?.max_tokens ?? 2048;
    const baseUrl = String(provider.base_url).replace(/\/$/, "");

    const logUsage = (status: string, error?: string) =>
      admin.from("ai_usage_logs").insert({
        feature_key: featureKey,
        provider: providerName,
        model: modelName,
        status,
        latency_ms: Date.now() - started,
        error: error ?? null,
      });

    // Anthropic uses a different API shape → non-streamed, converted to SSE.
    if (provider.provider === "anthropic") {
      const r = await fetch(`${baseUrl}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: modelName,
          max_tokens: maxTokens,
          temperature,
          system: systemMessage,
          messages,
        }),
      });
      if (!r.ok) {
        const t = await r.text();
        await logUsage("error", `${r.status}: ${t.slice(0, 300)}`);
        return errorResponse("Erreur du service IA (Anthropic)", r.status === 429 ? 429 : 500);
      }
      const data = await r.json();
      const text = (data.content ?? []).map((c: any) => c.text ?? "").join("");
      await logUsage("success");
      return new Response(sseFromText(text), {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(provider.provider === "openrouter"
          ? { "HTTP-Referer": "https://gesclic3.lovable.app", "X-Title": "Gesclic" }
          : {}),
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: "system", content: systemMessage }, ...messages],
        temperature,
        max_tokens: maxTokens,
=======
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompts: Record<string, string> = {
      diagnostic: `Tu es un assistant médical IA spécialisé dans l'aide au diagnostic. Tu aides les médecins à analyser les symptômes et suggérer des pistes diagnostiques.

IMPORTANT: Tu ne poses PAS de diagnostic définitif. Tu fournis des pistes et suggestions pour aider le médecin dans sa réflexion clinique.

Format de réponse:
1. **Analyse des symptômes** : résumé structuré
2. **Diagnostics possibles** : liste ordonnée par probabilité avec justification
3. **Examens recommandés** : pour confirmer/infirmer
4. **Signaux d'alerte** : à surveiller

Réponds toujours en français. Sois concis mais complet.`,

      summary: `Tu es un assistant médical IA spécialisé dans le résumé de dossiers médicaux. Tu synthétises les informations médicales de manière claire et structurée pour les professionnels de santé.

Format de réponse:
1. **Résumé patient** : informations clés
2. **Historique** : chronologie des consultations
3. **Traitements en cours** : liste avec posologie
4. **Points d'attention** : alertes et suivis nécessaires

Réponds toujours en français. Sois concis et cliniquement pertinent.`,
    };

    const systemMessage = systemPrompts[mode] || systemPrompts.diagnostic;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemMessage },
          ...messages,
        ],
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
        stream: true,
      }),
    });

    if (!response.ok) {
<<<<<<< HEAD
      const t = await response.text();
      console.error("AI provider error:", providerName, response.status, t);
      await logUsage("error", `${response.status}: ${t.slice(0, 300)}`);
      if (response.status === 429) return errorResponse("Trop de requêtes, réessayez dans un instant.", 429);
      if (response.status === 402) return errorResponse("Crédits IA épuisés. Ajoutez des crédits ou changez de fournisseur.", 402);
      if (response.status === 401 || response.status === 403)
        return errorResponse("Clé API invalide pour le fournisseur IA configuré.", 401);
      return errorResponse("Erreur du service IA", 500);
    }

    await logUsage("success");

=======
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, veuillez réessayer dans un instant." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés. Ajoutez des crédits dans les paramètres." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("medical-ai error:", e);
<<<<<<< HEAD
    await admin.from("ai_usage_logs").insert({
      feature_key: featureKey,
      provider: providerName,
      model: modelName,
      status: "error",
      latency_ms: Date.now() - started,
      error: e instanceof Error ? e.message : "unknown",
    });
    return errorResponse(e instanceof Error ? e.message : "Erreur inconnue", 500);
=======
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
  }
});
