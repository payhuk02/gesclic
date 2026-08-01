import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Require an authenticated caller
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "Non authentifié" }, 401);
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) return json({ error: "Non authentifié" }, 401);

    const body = await req.json().catch(() => ({}));
    const input = typeof body?.input === "string" ? body.input.trim() : "";
    if (!input) return json({ error: "Le champ « input » est requis." }, 400);
    if (input.length > 8000) return json({ error: "Texte trop long (max 8000 caractères)." }, 400);

    // Resolve an OpenAI-compatible provider that exposes /embeddings
    const { data: providers } = await admin
      .from("ai_providers")
      .select("provider, base_url, api_key, default_model, enabled, priority")
      .eq("enabled", true)
      .order("priority", { ascending: true });

    const provider = (providers ?? []).find((p) => p.api_key && p.base_url);
    if (!provider) {
      return json({ error: "Aucun fournisseur d'embeddings configuré.", embedding: null }, 503);
    }

    const model = body?.model ?? "text-embedding-3-small";
    const url = `${String(provider.base_url).replace(/\/$/, "")}/embeddings`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, input }),
    });

    if (!res.ok) {
      const text = await res.text();
      return json({ error: `Fournisseur d'embeddings indisponible: ${text.slice(0, 200)}`, embedding: null }, 502);
    }

    const payload = await res.json();
    const embedding = payload?.data?.[0]?.embedding ?? null;
    if (!Array.isArray(embedding)) return json({ error: "Réponse d'embedding invalide.", embedding: null }, 502);

    return json({ embedding, model, dimensions: embedding.length });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Erreur inconnue", embedding: null }, 500);
  }
});
