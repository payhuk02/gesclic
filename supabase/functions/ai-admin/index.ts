import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const PROVIDER_DEFAULTS: Record<string, { label: string; base_url: string; default_model: string }> = {
  lovable: { label: "Lovable AI Gateway", base_url: "https://ai.gateway.lovable.dev/v1", default_model: "google/gemini-3.6-flash" },
  openrouter: { label: "OpenRouter", base_url: "https://openrouter.ai/api/v1", default_model: "openai/gpt-4o-mini" },
  openai: { label: "OpenAI", base_url: "https://api.openai.com/v1", default_model: "gpt-4o-mini" },
  gemini: { label: "Google Gemini", base_url: "https://generativelanguage.googleapis.com/v1beta/openai", default_model: "gemini-2.5-flash" },
  anthropic: { label: "Anthropic Claude", base_url: "https://api.anthropic.com/v1", default_model: "claude-3-5-sonnet-latest" },
  custom: { label: "Fournisseur personnalisé", base_url: "", default_model: "" },
};

/** Resolve the API key to use for a provider row (DB key or platform fallback). */
function resolveKey(row: { provider: string; api_key: string | null }) {
  if (row.api_key) return row.api_key;
  if (row.provider === "lovable") return Deno.env.get("LOVABLE_API_KEY") ?? null;
  return null;
}

async function testProvider(row: { provider: string; base_url: string; api_key: string | null; default_model: string | null }, model?: string) {
  const key = resolveKey(row);
  if (!key) return { ok: false, error: "Aucune clé API configurée pour ce fournisseur." };
  const usedModel = model || row.default_model;
  if (!usedModel) return { ok: false, error: "Aucun modèle configuré." };

  const started = Date.now();
  try {
    if (row.provider === "anthropic") {
      const r = await fetch(`${row.base_url.replace(/\/$/, "")}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: usedModel, max_tokens: 16, messages: [{ role: "user", content: "ping" }] }),
      });
      const t = await r.text();
      return r.ok
        ? { ok: true, latency_ms: Date.now() - started, model: usedModel }
        : { ok: false, error: `${r.status}: ${t.slice(0, 300)}` };
    }

    const r = await fetch(`${row.base_url.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: usedModel, messages: [{ role: "user", content: "ping" }], max_tokens: 16 }),
    });
    const t = await r.text();
    return r.ok
      ? { ok: true, latency_ms: Date.now() - started, model: usedModel }
      : { ok: false, error: `${r.status}: ${t.slice(0, 300)}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur réseau" };
  }
}

const maskRow = (r: Record<string, unknown>) => {
  const { api_key, ...rest } = r as any;
  return { ...rest, has_key: Boolean(api_key) || (rest.provider === "lovable" && Boolean(Deno.env.get("LOVABLE_API_KEY"))) };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return json({ error: "unauthorized" }, 401);

    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = body?.action as string;

    switch (action) {
      case "list": {
        const [{ data: providers }, { data: features }, { data: logs }] = await Promise.all([
          admin.from("ai_providers").select("*").order("priority"),
          admin.from("ai_features").select("*").order("label"),
          admin.from("ai_usage_logs").select("*").order("created_at", { ascending: false }).limit(50),
        ]);
        return json({
          providers: (providers ?? []).map(maskRow),
          features: features ?? [],
          logs: logs ?? [],
        });
      }

      case "save_provider": {
        const p = body.provider ?? {};
        const defaults = PROVIDER_DEFAULTS[p.provider] ?? PROVIDER_DEFAULTS.custom;
        const payload: Record<string, unknown> = {
          provider: p.provider,
          label: p.label || defaults.label,
          base_url: (p.base_url || defaults.base_url || "").replace(/\/$/, ""),
          default_model: p.default_model || defaults.default_model || null,
          enabled: p.enabled ?? true,
          priority: p.priority ?? 100,
        };
        if (typeof p.api_key === "string" && p.api_key.trim()) {
          payload.api_key = p.api_key.trim();
          payload.api_key_last4 = p.api_key.trim().slice(-4);
        }
        if (p.clear_key === true) {
          payload.api_key = null;
          payload.api_key_last4 = null;
        }

        const q = p.id
          ? admin.from("ai_providers").update(payload).eq("id", p.id).select("*").single()
          : admin.from("ai_providers").insert(payload).select("*").single();
        const { data, error } = await q;
        if (error) return json({ error: error.message }, 400);
        return json({ provider: maskRow(data) });
      }

      case "delete_provider": {
        const { error } = await admin.from("ai_providers").delete().eq("id", body.id);
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }

      case "save_feature": {
        const f = body.feature ?? {};
        const payload = {
          feature_key: f.feature_key,
          label: f.label,
          description: f.description ?? null,
          provider_id: f.provider_id || null,
          model: f.model || null,
          temperature: f.temperature ?? 0.3,
          max_tokens: f.max_tokens ?? 2048,
          system_prompt: f.system_prompt ?? null,
          enabled: f.enabled ?? true,
        };
        const q = f.id
          ? admin.from("ai_features").update(payload).eq("id", f.id).select("*").single()
          : admin.from("ai_features").insert(payload).select("*").single();
        const { data, error } = await q;
        if (error) return json({ error: error.message }, 400);
        return json({ feature: data });
      }

      case "delete_feature": {
        const { error } = await admin.from("ai_features").delete().eq("id", body.id);
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }

      case "test_provider": {
        const { data: row, error } = await admin.from("ai_providers").select("*").eq("id", body.id).single();
        if (error || !row) return json({ error: "provider_not_found" }, 404);
        const result = await testProvider(row, body.model);
        await admin.from("ai_usage_logs").insert({
          feature_key: "connection_test",
          provider: row.provider,
          model: result.model ?? body.model ?? row.default_model,
          status: result.ok ? "success" : "error",
          latency_ms: result.latency_ms ?? null,
          error: result.ok ? null : result.error,
          user_id: user.id,
        });
        return json(result);
      }

      default:
        return json({ error: "unknown_action" }, 400);
    }
  } catch (e) {
    console.error("ai-admin error", e);
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});
