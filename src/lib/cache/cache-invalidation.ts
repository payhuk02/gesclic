import { useEffect } from 'react';
import { cacheService } from './cache-service';
import { CACHE_TAGS } from './db';
import { QueryClient } from '@tanstack/react-query';

/**
 * Automatic cache invalidation service
 * Listens to data changes and invalidates related cache entries
 */
export class CacheInvalidationService {
  private eventListeners = new Map<string, Set<Function>>();
  private queryClient: QueryClient | null = null;

  setQueryClient(client: QueryClient): void {
    this.queryClient = client;
  }

  /**
   * Invalidate cache when patient data changes
   */
  async onPatientChange(patientId: string, action: 'create' | 'update' | 'delete'): Promise<void> {
    // Invalidate patient-specific caches
    await cacheService.invalidateByTags([CACHE_TAGS.PATIENTS]);
    
    // Invalidate related data
    await cacheService.invalidateByTags([
      CACHE_TAGS.MEDICAL_RECORDS,
      CACHE_TAGS.PRESCRIPTIONS,
      CACHE_TAGS.APPOINTMENTS
    ]);

    // Invalidate React Query cache if available
    if (this.queryClient) {
      this.queryClient.invalidateQueries({ queryKey: ['patients'] });
      this.queryClient.invalidateQueries({ queryKey: ['medical_records'] });
      this.queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
    }

    this.emit('patient:changed', { patientId, action });
  }

  /**
   * Invalidate cache when appointment changes
   */
  async onAppointmentChange(appointmentId: string, action: 'create' | 'update' | 'delete'): Promise<void> {
    await cacheService.invalidateByTags([CACHE_TAGS.APPOINTMENTS]);
    if (this.queryClient) {
      this.queryClient.invalidateQueries({ queryKey: ['appointments'] });
    }

    this.emit('appointment:changed', { appointmentId, action });
  }

  /**
   * Invalidate cache when clinic settings change
   */
  async onClinicSettingsChange(clinicId: string): Promise<void> {
    await cacheService.invalidateByTags([CACHE_TAGS.CLINIC_SETTINGS]);
    await cacheService.invalidateByTags([CACHE_TAGS.STAFF]);
    
    if (this.queryClient) {
      this.queryClient.invalidateQueries({ queryKey: ['clinic_settings'] });
      this.queryClient.invalidateQueries({ queryKey: ['staff'] });
    }

    this.emit('clinic_settings:changed', { clinicId });
  }

  /**
   * Invalidate cache when user profile changes
   */
  async onUserProfileChange(userId: string): Promise<void> {
    await cacheService.invalidateByTags([CACHE_TAGS.USER_PROFILE]);
    if (this.queryClient) {
      this.queryClient.invalidateQueries({ queryKey: ['user'] });
    }

    this.emit('user_profile:changed', { userId });
  }

  /**
   * Invalidate cache when telemedicine data changes
   */
  async onTelemedicineChange(clinicId: string): Promise<void> {
    await cacheService.invalidateByTags([CACHE_TAGS.TELEmedicine]);
    if (this.queryClient) {
      this.queryClient.invalidateQueries({ queryKey: ['telemedicine'] });
    }

    this.emit('telemedicine:changed', { clinicId });
  }

  /**
   * Invalidate cache when payment data changes
   */
  async onPaymentChange(clinicId: string): Promise<void> {
    await cacheService.invalidateByTags([CACHE_TAGS.PAYMENTS]);
    if (this.queryClient) {
      this.queryClient.invalidateQueries({ queryKey: ['payments'] });
    }

    this.emit('payment:changed', { clinicId });
  }

  /**
   * Invalidate all analytics cache
   */
  async invalidateAnalytics(): Promise<void> {
    await cacheService.invalidateByTags([CACHE_TAGS.ANALYTICS]);
    if (this.queryClient) {
      this.queryClient.invalidateQueries({ queryKey: ['analytics'] });
    }

    this.emit('analytics:invalidated', {});
  }

  /**
   * Invalidate cache by custom tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    await cacheService.invalidateByTags(tags);
    if (this.queryClient) {
      tags.forEach(tag => {
        this.queryClient!.invalidateQueries({ queryKey: [tag] });
      });
    }
  }

  /**
   * Event system for cache invalidation
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Setup automatic invalidation based on Supabase realtime subscriptions
   */
  setupRealtimeInvalidation(): void {
    if (typeof window === 'undefined') return;

    // Listen to Supabase realtime events
    const { supabase } = require('@/integrations/supabase/client');

    // Patients table
    supabase
      .channel('cache-invalidation-patients')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patients' },
        (payload: any) => {
          const patientId = payload.new?.id || payload.old?.id;
          if (patientId) {
            this.onPatientChange(patientId, payload.eventType);
          }
        }
      )
      .subscribe();

    // Appointments table
    supabase
      .channel('cache-invalidation-appointments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload: any) => {
          const appointmentId = payload.new?.id || payload.old?.id;
          if (appointmentId) {
            this.onAppointmentChange(appointmentId, payload.eventType);
          }
        }
      )
      .subscribe();

    // Clinics table
    supabase
      .channel('cache-invalidation-clinics')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clinics' },
        (payload: any) => {
          const clinicId = payload.new?.id || payload.old?.id;
          if (clinicId) {
            this.onClinicSettingsChange(clinicId);
          }
        }
      )
      .subscribe();

    // Medical records table
    supabase
      .channel('cache-invalidation-medical-records')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'medical_records' },
        () => {
          this.invalidateByTags([CACHE_TAGS.MEDICAL_RECORDS]);
        }
      )
      .subscribe();

    // Prescriptions table
    supabase
      .channel('cache-invalidation-prescriptions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prescriptions' },
        () => {
          this.invalidateByTags([CACHE_TAGS.PRESCRIPTIONS]);
        }
      )
      .subscribe();

    // Payments table
    supabase
      .channel('cache-invalidation-payments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        () => {
          this.invalidateByTags([CACHE_TAGS.PAYMENTS]);
        }
      )
      .subscribe();
  }

  /**
   * Cleanup realtime subscriptions
   */
  cleanupRealtimeInvalidation(): void {
    if (typeof window === 'undefined') return;

    const { supabase } = require('@/integrations/supabase/client');
    
    supabase.channel('cache-invalidation-patients').unsubscribe();
    supabase.channel('cache-invalidation-appointments').unsubscribe();
    supabase.channel('cache-invalidation-clinics').unsubscribe();
    supabase.channel('cache-invalidation-medical-records').unsubscribe();
    supabase.channel('cache-invalidation-prescriptions').unsubscribe();
    supabase.channel('cache-invalidation-payments').unsubscribe();
  }
}

// Singleton instance
export const cacheInvalidationService = new CacheInvalidationService();

/**
 * React hook for cache invalidation
 */
export function useCacheInvalidation(queryClient: QueryClient) {
  useEffect(() => {
    // Set query client
    cacheInvalidationService.setQueryClient(queryClient);

    // Setup realtime invalidation on mount
    cacheInvalidationService.setupRealtimeInvalidation();

    // Cleanup on unmount
    return () => {
      cacheInvalidationService.cleanupRealtimeInvalidation();
    };
  }, [queryClient]);

  return {
    onPatientChange: cacheInvalidationService.onPatientChange.bind(cacheInvalidationService),
    onAppointmentChange: cacheInvalidationService.onAppointmentChange.bind(cacheInvalidationService),
    onClinicSettingsChange: cacheInvalidationService.onClinicSettingsChange.bind(cacheInvalidationService),
    onUserProfileChange: cacheInvalidationService.onUserProfileChange.bind(cacheInvalidationService),
    invalidateByTags: cacheInvalidationService.invalidateByTags.bind(cacheInvalidationService),
    invalidateAnalytics: cacheInvalidationService.invalidateAnalytics.bind(cacheInvalidationService),
  };
}
