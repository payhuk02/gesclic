import { useCallback, useEffect } from 'react';
<<<<<<< HEAD
import { cacheService } from './cache-service';
import { CACHE_TTL, CACHE_TAGS } from './db';
=======
import { cacheService, CACHE_TTL, CACHE_TAGS } from './cache-service';
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
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
<<<<<<< HEAD
            .eq('user_id', userId)
=======
            .eq('id', userId)
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
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
<<<<<<< HEAD
            .from('doctors')
=======
            .from('staff')
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
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
<<<<<<< HEAD
            .gte('date', new Date().toISOString().slice(0, 10))
            .order('date', { ascending: true })
=======
            .gte('scheduled_date', new Date().toISOString())
            .order('scheduled_date', { ascending: true })
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
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
<<<<<<< HEAD
            .from('v_daily_appointments')
=======
            .from('mv_daily_appointments')
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
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
<<<<<<< HEAD
  async warmPatientData(patientId: string, patientName?: string): Promise<void> {
=======
  async warmPatientData(patientId: string): Promise<void> {
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
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
<<<<<<< HEAD
            .eq('patient_name', patientName ?? '')
=======
            .eq('patient_id', patientId)
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
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
<<<<<<< HEAD
            .eq('patient_name', patientName ?? '')
=======
            .eq('patient_id', patientId)
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
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
<<<<<<< HEAD
            .eq('patient_name', patientName ?? '')
            .order('date', { ascending: true });
=======
            .eq('patient_id', patientId)
            .order('scheduled_date', { ascending: true });
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
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

<<<<<<< HEAD
  const warmPatient = useCallback((patientId: string, patientName?: string) => {
    cacheWarmingService.warmPatientData(patientId, patientName);
=======
  const warmPatient = useCallback((patientId: string) => {
    cacheWarmingService.warmPatientData(patientId);
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
  }, []);

  return {
    warmDashboard,
    warmPatient,
    isWarmed: cacheWarmingService.isWarmed.bind(cacheWarmingService),
    getWarmedKeys: cacheWarmingService.getWarmedKeys.bind(cacheWarmingService)
  };
}
