import { useCallback, useEffect } from 'react';
import { cacheService, CACHE_TTL, CACHE_TAGS } from './cache-service';
import { useAuth } from '@/contexts/AuthContext';
import { useClinic } from '@/contexts/ClinicContext';

/**
 * Cache warming service for critical data
 * Preloads essential data to ensure fast app startup
 */
export class CacheWarmingService {
  private warmedKeys = new Set<string>();

  /**
   * Warm cache with critical user data on app startup
   */
  async warmUserData(userId: string, clinicId: string): Promise<void> {
    const warmupKeys = [
      {
        key: `user_profile:${userId}`,
        fetcher: async () => {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          return data;
        },
        options: { ttl: CACHE_TTL.LONG, tags: [CACHE_TAGS.USER_PROFILE] }
      },
      {
        key: `clinic_settings:${clinicId}`,
        fetcher: async () => {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data } = await supabase
            .from('clinics')
            .select('*')
            .eq('id', clinicId)
            .single();
          return data;
        },
        options: { ttl: CACHE_TTL.VERY_LONG, tags: [CACHE_TAGS.CLINIC_SETTINGS] }
      },
      {
        key: `staff:${clinicId}`,
        fetcher: async () => {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data } = await supabase
            .from('staff')
            .select('*')
            .eq('clinic_id', clinicId);
          return data;
        },
        options: { ttl: CACHE_TTL.MEDIUM, tags: [CACHE_TAGS.STAFF] }
      }
    ];

    await cacheService.warmup(warmupKeys);
    warmupKeys.forEach(k => this.warmedKeys.add(k.key));
  }

  /**
   * Warm cache with dashboard data
   */
  async warmDashboardData(clinicId: string): Promise<void> {
    const warmupKeys = [
      {
        key: `appointments_upcoming:${clinicId}`,
        fetcher: async () => {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data } = await supabase
            .from('appointments')
            .select('*')
            .eq('clinic_id', clinicId)
            .gte('scheduled_date', new Date().toISOString())
            .order('scheduled_date', { ascending: true })
            .limit(10);
          return data;
        },
        options: { ttl: CACHE_TTL.SHORT, tags: [CACHE_TAGS.APPOINTMENTS] }
      },
      {
        key: `patients_recent:${clinicId}`,
        fetcher: async () => {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data } = await supabase
            .from('patients')
            .select('*')
            .eq('clinic_id', clinicId)
            .order('created_at', { ascending: false })
            .limit(20);
          return data;
        },
        options: { ttl: CACHE_TTL.MEDIUM, tags: [CACHE_TAGS.PATIENTS] }
      },
      {
        key: `analytics_summary:${clinicId}`,
        fetcher: async () => {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data } = await supabase
            .from('mv_daily_appointments')
            .select('*')
            .eq('clinic_id', clinicId)
            .order('date', { ascending: false })
            .limit(30);
          return data;
        },
        options: { ttl: CACHE_TTL.MEDIUM, tags: [CACHE_TAGS.ANALYTICS] }
      }
    ];

    await cacheService.warmup(warmupKeys);
    warmupKeys.forEach(k => this.warmedKeys.add(k.key));
  }

  /**
   * Warm cache for patient detail view
   */
  async warmPatientData(patientId: string): Promise<void> {
    const warmupKeys = [
      {
        key: `patient:${patientId}`,
        fetcher: async () => {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data } = await supabase
            .from('patients')
            .select('*')
            .eq('id', patientId)
            .single();
          return data;
        },
        options: { ttl: CACHE_TTL.LONG, tags: [CACHE_TAGS.PATIENTS] }
      },
      {
        key: `medical_records:${patientId}`,
        fetcher: async () => {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data } = await supabase
            .from('medical_records')
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false });
          return data;
        },
        options: { ttl: CACHE_TTL.MEDIUM, tags: [CACHE_TAGS.MEDICAL_RECORDS] }
      },
      {
        key: `prescriptions:${patientId}`,
        fetcher: async () => {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data } = await supabase
            .from('prescriptions')
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false });
          return data;
        },
        options: { ttl: CACHE_TTL.MEDIUM, tags: [CACHE_TAGS.PRESCRIPTIONS] }
      },
      {
        key: `appointments_patient:${patientId}`,
        fetcher: async () => {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data } = await supabase
            .from('appointments')
            .select('*')
            .eq('patient_id', patientId)
            .order('scheduled_date', { ascending: true });
          return data;
        },
        options: { ttl: CACHE_TTL.SHORT, tags: [CACHE_TAGS.APPOINTMENTS] }
      }
    ];

    await cacheService.warmup(warmupKeys);
    warmupKeys.forEach(k => this.warmedKeys.add(k.key));
  }

  /**
   * Check if a key has been warmed
   */
  isWarmed(key: string): boolean {
    return this.warmedKeys.has(key);
  }

  /**
   * Clear warmed keys tracking
   */
  clearTracking(): void {
    this.warmedKeys.clear();
  }

  /**
   * Get all warmed keys
   */
  getWarmedKeys(): string[] {
    return Array.from(this.warmedKeys);
  }
}

// Singleton instance
export const cacheWarmingService = new CacheWarmingService();

/**
 * React hook for cache warming
 */
export function useCacheWarming() {
  const { user } = useAuth();
  const { activeClinicId } = useClinic();

  useEffect(() => {
    if (user && activeClinicId) {
      // Warm critical user data
      cacheWarmingService.warmUserData(user.id, activeClinicId);
    }
  }, [user, activeClinicId]);

  const warmDashboard = useCallback(() => {
    if (activeClinicId) {
      cacheWarmingService.warmDashboardData(activeClinicId);
    }
  }, [activeClinicId]);

  const warmPatient = useCallback((patientId: string) => {
    cacheWarmingService.warmPatientData(patientId);
  }, []);

  return {
    warmDashboard,
    warmPatient,
    isWarmed: cacheWarmingService.isWarmed.bind(cacheWarmingService),
    getWarmedKeys: cacheWarmingService.getWarmedKeys.bind(cacheWarmingService)
  };
}
