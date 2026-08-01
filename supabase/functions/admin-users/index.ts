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

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const VALID_ROLES = ["super_admin", "admin", "medecin", "secretaire", "infirmier"];
const BAN_FOREVER = "876000h"; // ~100 ans

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  // --- Authentification : le JWT est validé en code ---
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Non authentifié" }, 401);

  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) return json({ error: "Session invalide" }, 401);
  const caller = userData.user;

  // --- Autorisation : super_admin uniquement ---
  const { data: isSuper, error: roleErr } = await admin.rpc("has_role", {
    _user_id: caller.id,
    _role: "super_admin",
  });
  if (roleErr) return json({ error: "Vérification du rôle impossible" }, 500);
  if (!isSuper) return json({ error: "Accès réservé aux super administrateurs" }, 403);

  let body: { action?: string; userId?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Corps de requête invalide" }, 400);
  }

  const { action, userId, role } = body;
  if (!action) return json({ error: "Action manquante" }, 400);

  const needsUser = ["suspend", "activate", "delete", "set_role", "revoke_sessions"];
  if (needsUser.includes(action)) {
    if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) {
      return json({ error: "Identifiant utilisateur invalide" }, 400);
    }
    if (userId === caller.id && action !== "set_role") {
      return json({ error: "Vous ne pouvez pas appliquer cette action à votre propre compte" }, 400);
    }
  }

  try {
    switch (action) {
      case "list": {
        const users: Array<Record<string, unknown>> = [];
        let page = 1;
        while (page <= 20) {
          const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
          if (error) throw error;
          for (const u of data.users) {
            users.push({
              id: u.id,
              email: u.email ?? null,
              last_sign_in_at: u.last_sign_in_at ?? null,
              created_at: u.created_at,
              suspended: Boolean((u as { banned_until?: string }).banned_until &&
                new Date((u as { banned_until?: string }).banned_until as string) > new Date()),
            });
          }
          if (data.users.length < 200) break;
          page++;
        }
        return json({ users });
      }

      case "suspend": {
        const { error } = await admin.auth.admin.updateUserById(userId!, { ban_duration: BAN_FOREVER });
        if (error) throw error;
        return json({ ok: true });
      }

      case "activate": {
        const { error } = await admin.auth.admin.updateUserById(userId!, { ban_duration: "none" });
        if (error) throw error;
        return json({ ok: true });
      }

      case "delete": {
        const { error } = await admin.auth.admin.deleteUser(userId!);
        if (error) throw error;
        return json({ ok: true });
      }

      case "revoke_sessions": {
        // GoTrue admin endpoint : déconnecte toutes les sessions de l'utilisateur
        const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}/logout`, {
          method: "POST",
          headers: {
            apikey: SERVICE_ROLE,
            Authorization: `Bearer ${SERVICE_ROLE}`,
            "Content-Type": "application/json",
          },
        });
        if (!r.ok) throw new Error(`Échec de la révocation (${r.status})`);
        return json({ ok: true });
      }

      case "set_role": {

        if (!role || !VALID_ROLES.includes(role)) return json({ error: "Rôle invalide" }, 400);
        const del = await admin.from("user_roles").delete().eq("user_id", userId!);
        if (del.error) throw del.error;
        const ins = await admin.from("user_roles").insert({ user_id: userId!, role });
        if (ins.error) throw ins.error;
        return json({ ok: true });
      }

      default:
        return json({ error: "Action inconnue" }, 400);
    }
  } catch (e) {
    console.error("admin-users error", action, e);
    return json({ error: e instanceof Error ? e.message : "Erreur serveur" }, 500);
  }
});
