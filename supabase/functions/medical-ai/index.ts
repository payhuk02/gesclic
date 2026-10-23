import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
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

async function requireAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token || token === ANON_KEY || token.startsWith("sb_publishable_")) {
    return { user: null, error: "Non authentifié" as const };
  }

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) {
    return { user: null, error: "Session invalide" as const };
  }
  return { user: data.user, error: null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Méthode non autorisée", 405);

  const started = Date.now();
  let providerName = "lovable";
  let modelName = "google/gemini-3.6-flash";
  let featureKey = "diagnostic";

  try {
    const { user, error: authError } = await requireAuthenticatedUser(req);
    if (!user) return errorResponse(authError ?? "Non authentifié", 401);

    const { messages, mode } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return errorResponse("Messages invalides", 400);
    }
    featureKey = typeof mode === "string" && mode ? mode : "diagnostic";

    const { data: feature } = await admin
      .from("ai_features")
      .select("*")
      .eq("feature_key", featureKey)
      .maybeSingle();

    if (feature && feature.enabled === false) {
      return errorResponse("Cette fonctionnalité IA est désactivée par l'administrateur.", 403);
    }

    let provider: Record<string, unknown> | null = null;
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

    providerName = String(provider.provider ?? "lovable");
    modelName = String(feature?.model || provider.default_model || "google/gemini-3.6-flash");

    const apiKey =
      (provider.api_key as string | null) ||
      (providerName === "lovable" ? Deno.env.get("LOVABLE_API_KEY") : null);
    if (!apiKey) {
      return errorResponse(
        `Aucune clé API configurée pour le fournisseur « ${String(provider.label ?? provider.provider)} ». Configurez-la dans Administration → IA.`,
        400,
      );
    }

    const systemMessage =
      (feature?.system_prompt as string | undefined) ||
      FALLBACK_PROMPTS[featureKey] ||
      FALLBACK_PROMPTS.diagnostic;
    const temperature = (feature?.temperature as number | undefined) ?? 0.3;
    const maxTokens = (feature?.max_tokens as number | undefined) ?? 2048;
    const baseUrl = String(provider.base_url).replace(/\/$/, "");

    const logUsage = (status: string, error?: string) =>
      admin.from("ai_usage_logs").insert({
        feature_key: featureKey,
        provider: providerName,
        model: modelName,
        status,
        latency_ms: Date.now() - started,
        error: error ?? null,
        user_id: user.id,
      });

    if (providerName === "anthropic") {
      const r = await fetch(`${baseUrl}/messages`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
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
      const text = (data.content ?? []).map((c: { text?: string }) => c.text ?? "").join("");
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
        ...(providerName === "openrouter"
          ? { "HTTP-Referer": "https://gesclic3.lovable.app", "X-Title": "Gesclic" }
          : {}),
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: "system", content: systemMessage }, ...messages],
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI provider error:", providerName, response.status, t);
      await logUsage("error", `${response.status}: ${t.slice(0, 300)}`);
      if (response.status === 429) return errorResponse("Trop de requêtes, réessayez dans un instant.", 429);
      if (response.status === 402) {
        return errorResponse("Crédits IA épuisés. Ajoutez des crédits ou changez de fournisseur.", 402);
      }
      if (response.status === 401 || response.status === 403) {
        return errorResponse("Clé API invalide pour le fournisseur IA configuré.", 401);
      }
      return errorResponse("Erreur du service IA", 500);
    }

    await logUsage("success");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("medical-ai error:", e);
    await admin.from("ai_usage_logs").insert({
      feature_key: featureKey,
      provider: providerName,
      model: modelName,
      status: "error",
      latency_ms: Date.now() - started,
      error: e instanceof Error ? e.message : "unknown",
    });
    return errorResponse(e instanceof Error ? e.message : "Erreur inconnue", 500);
  }
});
