import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/cache/react-query-config';
import {
  clinicSettingsService,
  type ClinicProfile,
} from '@/services/clinic-settings.service';

export function useClinicSettingsProfile(clinicId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.clinicSettings.clinic(clinicId ?? ''),
    queryFn: () => clinicSettingsService.getClinicProfile(clinicId!),
    enabled: !!clinicId,
    staleTime: 5 * 60 * 1000,
  });

  const invalidate = () => {
    if (clinicId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.clinicSettings.clinic(clinicId) });
    }
  };

  return {
    profile: query.data as ClinicProfile | null | undefined,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  };
}
