import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type Provider = "google" | "microsoft" | "salesforce";

const PROVIDERS: Record<
  Provider,
  { token_url: string; client_id_env: string; client_secret_env: string }
> = {
  google: {
    token_url: "https://oauth2.googleapis.com/token",
    client_id_env: "GOOGLE_CLIENT_ID",
    client_secret_env: "GOOGLE_CLIENT_SECRET",
  },
  microsoft: {
    token_url: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    client_id_env: "MICROSOFT_CLIENT_ID",
    client_secret_env: "MICROSOFT_CLIENT_SECRET",
  },
  salesforce: {
    token_url: "https://login.salesforce.com/services/oauth2/token",
    client_id_env: "SALESFORCE_CLIENT_ID",
    client_secret_env: "SALESFORCE_CLIENT_SECRET",
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "Non authentifié" }, 401);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) return json({ error: "Session invalide" }, 401);

  let body: {
    provider?: Provider;
    grant_type?: "authorization_code" | "refresh_token";
    code?: string;
    refresh_token?: string;
    redirect_uri?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Corps invalide" }, 400);
  }

  const providerKey = body.provider;
  if (!providerKey || !(providerKey in PROVIDERS)) {
    return json({ error: "Fournisseur OAuth inconnu" }, 400);
  }

  const provider = PROVIDERS[providerKey];
  const clientId = Deno.env.get(provider.client_id_env);
  const clientSecret = Deno.env.get(provider.client_secret_env);
  if (!clientId || !clientSecret) {
    return json({ error: `Secrets OAuth non configurés pour ${providerKey}` }, 500);
  }

  const grantType = body.grant_type ?? "authorization_code";
  const params = new URLSearchParams({
    grant_type: grantType,
    client_id: clientId,
    client_secret: clientSecret,
  });

  if (grantType === "authorization_code") {
    if (!body.code || !body.redirect_uri) {
      return json({ error: "code et redirect_uri requis" }, 400);
    }
    params.set("code", body.code);
    params.set("redirect_uri", body.redirect_uri);
  } else if (grantType === "refresh_token") {
    if (!body.refresh_token) return json({ error: "refresh_token requis" }, 400);
    params.set("refresh_token", body.refresh_token);
  } else {
    return json({ error: "grant_type invalide" }, 400);
  }

  const tokenRes = await fetch(provider.token_url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: params,
  });

  const raw = await tokenRes.text();
  if (!tokenRes.ok) {
    console.error("oauth-exchange failed", providerKey, tokenRes.status, raw.slice(0, 300));
    return json({ error: "Échange de jeton OAuth échoué" }, 502);
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw);
  } catch {
    return json({ error: "Réponse OAuth invalide" }, 502);
  }

  return json({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    token_type: data.token_type ?? "Bearer",
    expires_in: data.expires_in,
    scope: data.scope,
    user_id: userData.user.id,
  });
});
