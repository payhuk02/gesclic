import { useEffect, useState } from "react";
import { fromAdmin } from "@/lib/admin-db";
import {
  GENERAL_SITE_DEFAULTS,
  LEGAL_SITE_DEFAULTS,
  type GeneralSiteSettings,
  type LegalSiteSettings,
} from "@/lib/site-content";

export function usePublicSiteContent() {
  const [general, setGeneral] = useState<GeneralSiteSettings>(GENERAL_SITE_DEFAULTS);
  const [legal, setLegal] = useState<LegalSiteSettings>(LEGAL_SITE_DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [g, l] = await Promise.all([
        fromAdmin("platform_settings").select("value").eq("key", "general").maybeSingle(),
        fromAdmin("platform_settings").select("value").eq("key", "legal").maybeSingle(),
      ]);
      if (cancelled) return;
      if (g.data?.value) setGeneral({ ...GENERAL_SITE_DEFAULTS, ...(g.data.value as Partial<GeneralSiteSettings>) });
      if (l.data?.value) setLegal({ ...LEGAL_SITE_DEFAULTS, ...(l.data.value as Partial<LegalSiteSettings>) });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { general, legal, loading };
}
