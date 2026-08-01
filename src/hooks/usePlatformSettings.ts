import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Lecture / écriture des réglages globaux de la plateforme (table `platform_settings`).
 * Chaque `key` porte un objet JSON. Seuls les super-admins peuvent écrire (RLS).
 */
export function usePlatformSettings<T extends Record<string, unknown>>(key: string, defaults: T) {
  const [settings, setSettings] = useState<T>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      console.error("platform_settings load error", error);
      toast.error("Erreur lors du chargement des paramètres");
    } else if (data?.value) {
      setSettings({ ...defaults, ...(data.value as T) });
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (next?: Partial<T>) => {
      const payload = { ...settings, ...(next ?? {}) } as T;
      setSaving(true);
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("platform_settings")
        .upsert(
          { key, value: payload as never, updated_by: auth.user?.id ?? null },
          { onConflict: "key" }
        );
      setSaving(false);

      if (error) {
        console.error("platform_settings save error", error);
        toast.error(
          error.code === "42501"
            ? "Accès refusé : seuls les super-administrateurs peuvent modifier ces paramètres"
            : "Erreur lors de la sauvegarde"
        );
        return false;
      }
      setSettings(payload);
      toast.success("Paramètres sauvegardés");
      return true;
    },
    [key, settings]
  );

  return { settings, setSettings, loading, saving, save, reload: load };
}
