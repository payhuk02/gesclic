import { QueryClient } from '@tanstack/react-query';
import { CACHE_TTL } from './db';

/**
 * Advanced React Query configuration with multi-level caching
 */
export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Multi-level caching strategy
        staleTime: CACHE_TTL.MEDIUM, // Data considered fresh for 15 minutes
        gcTime: CACHE_TTL.VERY_LONG, // Keep in memory for 24 hours
        
        // Retry configuration
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors
          if (error instanceof Error && 'status' in error) {
            const status = (error as any).status;
            if (status >= 400 && status < 500) return false;
          }
          // Retry up to 3 times for network errors
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Refetch strategies
        refetchOnWindowFocus: false, // Don't refetch on window focus (better UX)
        refetchOnReconnect: true, // Refetch on reconnect
        refetchOnMount: false, // Don't refetch on mount (use stale data)
        
        // Network status handling
        networkMode: 'online', // Only fetch when online
        
        // Error handling
        throwOnError: false, // Don't throw errors globally
      },
      mutations: {
        retry: 1,
        networkMode: 'online',
        throwOnError: false,
      },
    },
  });
};

/**
 * Query key generators for consistent cache keys
 */
export const queryKeys = {
  // Patients
  patients: {
    all: ['patients'] as const,
    lists: () => [...queryKeys.patients.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.patients.lists(), filters] as const,
    details: () => [...queryKeys.patients.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.patients.details(), id] as const,
  },
  
  // Appointments
  appointments: {
    all: ['appointments'] as const,
    lists: () => [...queryKeys.appointments.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.appointments.lists(), filters] as const,
    details: () => [...queryKeys.appointments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.appointments.details(), id] as const,
    upcoming: () => [...queryKeys.appointments.all, 'upcoming'] as const,
  },
  
  // Medical Records
  medicalRecords: {
    all: ['medical_records'] as const,
    patient: (patientId: string) => [...queryKeys.medicalRecords.all, patientId] as const,
  },
  
  // Prescriptions
  prescriptions: {
    all: ['prescriptions'] as const,
    patient: (patientId: string) => [...queryKeys.prescriptions.all, patientId] as const,
  },
  
  // Payments
  payments: {
    all: ['payments'] as const,
    patient: (patientId: string) => [...queryKeys.payments.all, patientId] as const,
    clinic: (clinicId: string) => [...queryKeys.payments.all, clinicId] as const,
  },
  
  // Staff
  staff: {
    all: ['staff'] as const,
    clinic: (clinicId: string) => [...queryKeys.staff.all, clinicId] as const,
  },
  
  // Clinic Settings
  clinicSettings: {
    all: ['clinic_settings'] as const,
    clinic: (clinicId: string) => [...queryKeys.clinicSettings.all, clinicId] as const,
  },
  
  // User Profile
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
  },
  
  // Telemedicine
  telemedicine: {
    all: ['telemedicine'] as const,
    sessions: () => [...queryKeys.telemedicine.all, 'sessions'] as const,
    settings: () => [...queryKeys.telemedicine.all, 'settings'] as const,
  },
  
  // Analytics
  analytics: {
    all: ['analytics'] as const,
    metrics: (type: string, period: string) => [...queryKeys.analytics.all, type, period] as const,
  },
  
  // API Platform
  apiPlatform: {
    all: ['api_platform'] as const,
    keys: () => [...queryKeys.apiPlatform.all, 'keys'] as const,
    logs: () => [...queryKeys.apiPlatform.all, 'logs'] as const,
  },
  
  // Webhooks
  webhooks: {
    all: ['webhooks'] as const,
    subscriptions: () => [...queryKeys.webhooks.all, 'subscriptions'] as const,
  },
  
  // Workflows
  workflows: {
    all: ['workflows'] as const,
    definitions: () => [...queryKeys.workflows.all, 'definitions'] as const,
    executions: () => [...queryKeys.workflows.all, 'executions'] as const,
  },
};

/**
 * Cache invalidation strategies
 */
export const invalidateQueriesMap = {
  // When patient data changes
  patient: (patientId: string) => [
    queryKeys.patients.detail(patientId),
    queryKeys.medicalRecords.patient(patientId),
    queryKeys.prescriptions.patient(patientId),
    queryKeys.payments.patient(patientId),
  ],
  
  // When appointment changes
  appointment: () => [
    queryKeys.appointments.all,
    queryKeys.appointments.upcoming(),
  ],
  
  // When clinic settings change
  clinicSettings: (clinicId: string) => [
    queryKeys.clinicSettings.clinic(clinicId),
    queryKeys.staff.clinic(clinicId),
  ],
  
  // When user profile changes
  userProfile: () => [
    queryKeys.user.profile(),
  ],
  
  // When telemedicine settings change
  telemedicine: () => [
    queryKeys.telemedicine.sessions(),
    queryKeys.telemedicine.settings(),
  ],
  
  // When analytics data might be stale
  analytics: () => [
    queryKeys.analytics.all,
  ],
};

/**
 * Prefetch strategies for critical data
 */
export const prefetchStrategies = {
  // Prefetch patient data when viewing list
  patientList: async (queryClient: QueryClient, patientIds: string[]) => {
    patientIds.forEach(id => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.patients.detail(id),
        staleTime: CACHE_TTL.LONG,
      });
    });
  },
  
  // Prefetch upcoming appointments on dashboard load
  dashboard: async (queryClient: QueryClient, clinicId: string) => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.appointments.upcoming(),
        staleTime: CACHE_TTL.SHORT,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.clinicSettings.clinic(clinicId),
        staleTime: CACHE_TTL.LONG,
      }),
    ]);
  },
  
  // Prefetch patient detail data
  patientDetail: async (queryClient: QueryClient, patientId: string) => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.patients.detail(patientId),
        staleTime: CACHE_TTL.LONG,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.medicalRecords.patient(patientId),
        staleTime: CACHE_TTL.MEDIUM,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.prescriptions.patient(patientId),
        staleTime: CACHE_TTL.MEDIUM,
      }),
    ]);
  },
};
