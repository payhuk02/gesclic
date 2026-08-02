import { useEffect } from 'react';
import { useClinic } from '@/contexts/ClinicContext';
import { clinicSettingsService } from '@/services/clinic-settings.service';
import { applyClinicBrandColor, resetClinicBrandColor } from '@/lib/clinic-branding';

/** Applies clinic primary color CSS variables when the active clinic changes. */
export function ClinicBrandingProvider({ children }: { children: React.ReactNode }) {
  const { activeClinicId } = useClinic();

  useEffect(() => {
    if (!activeClinicId) {
      resetClinicBrandColor();
      return;
    }

    let cancelled = false;

    clinicSettingsService
      .getClinicProfile(activeClinicId)
      .then((profile) => {
        if (cancelled) return;
        const color = profile?.settings.appearance.primaryColor;
        applyClinicBrandColor(color || null);
      })
      .catch(() => {
        if (!cancelled) resetClinicBrandColor();
      });

    return () => {
      cancelled = true;
    };
  }, [activeClinicId]);

  return <>{children}</>;
}
