import { supabase } from "@/integrations/supabase/client";
import { fromAdmin } from "@/lib/admin-db";

export interface PlatformSecurityPolicy {
  enforce2FA: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  requireStrongPassword: boolean;
  ipWhitelist: string;
  ipBlacklist: string;
}

const SECURITY_DEFAULTS: PlatformSecurityPolicy = {
  enforce2FA: false,
  sessionTimeout: 30,
  maxLoginAttempts: 5,
  passwordMinLength: 8,
  requireStrongPassword: true,
  ipWhitelist: "",
  ipBlacklist: "",
};

function parseList(raw: string) {
  return raw
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export const platformPolicyService = {
  async getSecurityPolicy(): Promise<PlatformSecurityPolicy> {
    const { data, error } = await fromAdmin("platform_settings")
      .select("value")
      .eq("key", "security")
      .maybeSingle();
    if (error || !data?.value) return SECURITY_DEFAULTS;
    return { ...SECURITY_DEFAULTS, ...(data.value as Partial<PlatformSecurityPolicy>) };
  },

  async getClientIp(): Promise<string | null> {
    try {
      const res = await fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(4000) });
      if (!res.ok) return null;
      const json = (await res.json()) as { ip?: string };
      return json.ip ?? null;
    } catch {
      return null;
    }
  },

  ipAllowed(ip: string | null, policy: PlatformSecurityPolicy): { ok: boolean; reason?: string } {
    if (!ip) return { ok: true };
    const deny = parseList(policy.ipBlacklist);
    if (deny.includes(ip)) return { ok: false, reason: "Cette adresse IP est bloquée." };
    const allow = parseList(policy.ipWhitelist);
    if (allow.length > 0 && !allow.includes(ip)) {
      return { ok: false, reason: "Cette adresse IP n'est pas autorisée." };
    }
    return { ok: true };
  },

  passwordMeetsPolicy(password: string, policy: PlatformSecurityPolicy): { ok: boolean; reason?: string } {
    const min = Math.max(6, policy.passwordMinLength || 8);
    if (password.length < min) {
      return { ok: false, reason: `Le mot de passe doit contenir au moins ${min} caractères` };
    }
    if (policy.requireStrongPassword) {
      const strong = /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);
      if (!strong) {
        return { ok: false, reason: "Le mot de passe doit contenir une majuscule, une minuscule et un chiffre" };
      }
    }
    return { ok: true };
  },

  async logDeniedAccess(details: Record<string, unknown>) {
    try {
      const { data: auth } = await supabase.auth.getUser();
      await fromAdmin("security_events").insert({
        event_type: "permission_denied",
        severity: "high",
        details,
        resolved: false,
        user_id: auth.user?.id ?? null,
      });
    } catch {
      /* best-effort audit */
    }
  },
};
