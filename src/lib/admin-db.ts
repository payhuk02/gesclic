import { supabase } from "@/integrations/supabase/client";

/** Query public tables that may be missing from generated Database types. */
export function fromAdmin(table: string) {
  return (supabase as unknown as { from: (name: string) => ReturnType<typeof supabase.from> }).from(table);
}

export async function invokeAdminUsers(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("admin-users", { body });
  if (error) {
    let msg = error.message;
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx) {
        const parsed = await ctx.clone().json();
        msg = parsed?.error ?? msg;
      }
    } catch {
      /* keep original */
    }
    throw new Error(msg);
  }
  if (data && typeof data === "object" && "error" in data && (data as { error?: string }).error) {
    throw new Error((data as { error: string }).error);
  }
  return data;
}

export function pickAppRole(roles: string[]): "super_admin" | "admin" | "medecin" | "secretaire" | "infirmier" | null {
  const order = ["super_admin", "admin", "medecin", "infirmier", "secretaire"] as const;
  return order.find((r) => roles.includes(r)) ?? null;
}
