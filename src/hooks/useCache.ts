import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cacheService } from '@/lib/cache/cache-service';
import { CACHE_TTL, CACHE_TAGS } from '@/lib/cache/db';
import { queryKeys, invalidateQueriesMap } from '@/lib/cache/react-query-config';

/**
 * Custom hook for cached data fetching with multi-level caching
 */
export function useCachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    tags?: string[];
    enabled?: boolean;
    staleTime?: number;
  } = {}
) {
  const { ttl = CACHE_TTL.MEDIUM, tags = [], enabled = true, staleTime } = options;

  return useQuery({
    queryKey: [key],
    queryFn: async () => {
      // Try cache first
      const cached = await cacheService.get<T>(key);
      if (cached) return cached;

      // Fetch from network
      const data = await fetcher();
      await cacheService.set(key, data, { ttl, tags });
      return data;
    },
    enabled,
    staleTime: staleTime || ttl,
  });
}

/**
 * Custom hook for cached mutations with automatic invalidation
 */
export function useCachedMutation<TData, TVariables>(
  key: string,
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    invalidateTags?: string[];
    onSuccess?: (data: TData) => void;
  } = {}
) {
  const queryClient = useQueryClient();
  const { invalidateTags = [], onSuccess } = options;

  return useMutation({
    mutationFn,
    onSuccess: async (data) => {
      // Invalidate related cache entries
      await Promise.all(
        invalidateTags.map(tag => cacheService.invalidateByTag(tag))
      );

      // Invalidate React Query cache
      invalidateTags.forEach(tag => {
        queryClient.invalidateQueries({ queryKey: [tag] });
      });

      onSuccess?.(data);
    },
  });
}

/**
 * Hook for patient data with automatic prefetching
 * Generic version - pass your own fetcher
 */
export function usePatient<T>(patientId: string, fetcher: (id: string) => Promise<T>) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.patients.detail(patientId),
    queryFn: async () => {
      const cached = await cacheService.get<T>(`patient:${patientId}`);
      if (cached) return cached;

      const data = await fetcher(patientId);
      await cacheService.set(`patient:${patientId}`, data, {
        ttl: CACHE_TTL.LONG,
        tags: [CACHE_TAGS.PATIENTS]
      });
      return data;
    },
    enabled: !!patientId,
    staleTime: CACHE_TTL.LONG,
  });

  // Prefetch related data
  if (patientId && query.data) {
    queryClient.prefetchQuery({
      queryKey: queryKeys.medicalRecords.patient(patientId),
      staleTime: CACHE_TTL.MEDIUM,
    });
    queryClient.prefetchQuery({
      queryKey: queryKeys.prescriptions.patient(patientId),
      staleTime: CACHE_TTL.MEDIUM,
    });
  }

  return query;
}

/**
 * Hook for appointments with real-time updates
 * Generic version - pass your own fetcher
 */
export function useAppointments<T>(filters?: any, fetcher?: (filters?: any) => Promise<T>) {
  return useQuery({
    queryKey: queryKeys.appointments.list(filters),
    queryFn: async () => {
      const cacheKey = `appointments:${JSON.stringify(filters)}`;
      const cached = await cacheService.get<T>(cacheKey);
      if (cached) return cached;

      if (!fetcher) throw new Error('Fetcher is required');
      const data = await fetcher(filters);
      await cacheService.set(cacheKey, data, {
        ttl: CACHE_TTL.SHORT,
        tags: [CACHE_TAGS.APPOINTMENTS]
      });
      return data;
    },
    enabled: !!fetcher,
    staleTime: CACHE_TTL.SHORT,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

/**
 * Hook for clinic settings with long cache
 * Generic version - pass your own fetcher
 */
export function useClinicSettings<T>(clinicId: string, fetcher: (id: string) => Promise<T>) {
  return useQuery({
    queryKey: queryKeys.clinicSettings.clinic(clinicId),
    queryFn: async () => {
      const cacheKey = `clinic_settings:${clinicId}`;
      const cached = await cacheService.get<T>(cacheKey);
      if (cached) return cached;

      const data = await fetcher(clinicId);
      await cacheService.set(cacheKey, data, {
        ttl: CACHE_TTL.VERY_LONG,
        tags: [CACHE_TAGS.CLINIC_SETTINGS]
      });
      return data;
    },
    enabled: !!clinicId,
    staleTime: CACHE_TTL.VERY_LONG,
  });
}

/**
 * Hook for cache statistics monitoring
 */
export function useCacheStats() {
  const [stats, setStats] = useState({
    hits: 0,
    misses: 0,
    hitRate: 0,
    size: 0
  });

  useEffect(() => {
    const updateStats = async () => {
      const currentStats = await cacheService.getStats();
      setStats(currentStats);
    };

    updateStats();
    const interval = setInterval(updateStats, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return stats;
}

/**
 * Hook for offline-first data access
 */
export function useOfflineData<T>(key: string, fetcher: () => Promise<T>) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return useQuery({
    queryKey: [key, 'offline'],
    queryFn: async () => {
      // Always try cache first
      const cached = await cacheService.get<T>(key);
      if (cached) return cached;

      // Only fetch if online
      if (!isOnline) {
        throw new Error('Offline - no cached data available');
      }

      return fetcher();
    },
    enabled: true,
    staleTime: Infinity, // Never consider cached data stale
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}

/**
 * Hook for cache warming on component mount
 */
export function useCacheWarming(keys: Array<{
  key: string;
  fetcher: () => Promise<any>;
  options?: { ttl?: number; tags?: string[] };
}>) {
  useEffect(() => {
    cacheService.warmup(keys);
  }, [keys]);
}

/**
 * Hook for automatic cache invalidation based on events
 */
export function useCacheInvalidation() {
  const queryClient = useQueryClient();

  const invalidatePatient = (patientId: string) => {
    const keys = invalidateQueriesMap.patient(patientId);
    keys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: key });
    });
    cacheService.invalidateByTags([CACHE_TAGS.PATIENTS]);
  };

  const invalidateAppointments = () => {
    const keys = invalidateQueriesMap.appointment();
    keys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: key });
    });
    cacheService.invalidateByTags([CACHE_TAGS.APPOINTMENTS]);
  };

  const invalidateClinicSettings = (clinicId: string) => {
    const keys = invalidateQueriesMap.clinicSettings(clinicId);
    keys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: key });
    });
    cacheService.invalidateByTags([CACHE_TAGS.CLINIC_SETTINGS]);
  };

  return {
    invalidatePatient,
    invalidateAppointments,
    invalidateClinicSettings,
  };
}
