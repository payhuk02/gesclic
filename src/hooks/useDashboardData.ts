// Dashboard Data Hook
// Enterprise-grade data management following React Query best practices
// Consolidates all dashboard data fetching with proper caching and invalidation

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useClinic } from '@/contexts/ClinicContext';

// Query keys following React Query best practices
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  recent: () => [...dashboardKeys.all, 'recent'] as const,
  charts: () => [...dashboardKeys.all, 'charts'] as const,
};

// Types for dashboard data
interface DashboardStats {
  totalPatients: number;
  totalAppointments: number;
  totalRevenue: number;
  pendingPayments: number;
  activeDoctors: number;
  lowStockItems: number;
  pendingLabResults: number;
}

interface RecentActivity {
  id: string;
  type: 'appointment' | 'patient' | 'payment' | 'lab_result';
  description: string;
  timestamp: string;
}

interface ChartData {
  revenue: Array<{ month: string; amount: number }>;
  appointments: Array<{ date: string; count: number }>;
  patientGrowth: Array<{ month: string; count: number }>;
}

interface DashboardData {
  stats: DashboardStats;
  recentActivity: RecentActivity[];
  charts: ChartData;
}

/**
 * Hook for fetching dashboard statistics
 */
function useDashboardStats(clinicId: string | undefined) {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async () => {
      if (!clinicId) throw new Error('Clinic ID required');

      // Fetch all stats in parallel for better performance
      const [
        patientsResult,
        appointmentsResult,
        paymentsResult,
        doctorsResult,
        labResultsResult,
        pharmacyResult
      ] = await Promise.all([
        supabase
          .from('patients')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', clinicId),
        supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', clinicId)
          .gte('date', new Date().toISOString().split('T')[0]),
        supabase
          .from('payments')
          .select('amount, status')
          .eq('clinic_id', clinicId),
        supabase
          .from('clinic_members')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', clinicId)
          .eq('role', 'medecin')
          .eq('is_active', true),
        supabase
          .from('lab_results')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', clinicId)
          .in('status', ['pending', 'in_progress']),
        supabase
          .from('pharmacy_stock')
          .select('quantity, threshold')
          .eq('clinic_id', clinicId),
      ]);

      const queryErrors = [
        patientsResult.error,
        appointmentsResult.error,
        paymentsResult.error,
        doctorsResult.error,
        labResultsResult.error,
        pharmacyResult.error,
      ].filter(Boolean);

      if (queryErrors.length > 0) {
        throw queryErrors[0];
      }

      const payments = paymentsResult.data || [];
      const lowStockItems = (pharmacyResult.data || []).filter(
        (item) => item.quantity <= item.threshold
      ).length;
      const totalRevenue = payments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);
      const pendingPayments = payments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0);

      return {
        totalPatients: patientsResult.count || 0,
        totalAppointments: appointmentsResult.count || 0,
        totalRevenue,
        pendingPayments,
        activeDoctors: doctorsResult.count || 0,
        lowStockItems,
        pendingLabResults: labResultsResult.count || 0,
      };
    },
    enabled: !!clinicId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for fetching recent activity
 */
function useRecentActivity(clinicId: string | undefined) {
  return useQuery({
    queryKey: dashboardKeys.recent(),
    queryFn: async () => {
      if (!clinicId) throw new Error('Clinic ID required');

      // Fetch recent activities from audit logs
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return (data || []).map(log => ({
        id: log.id,
        type: log.action as any,
        description: `${log.action} - ${log.resource_type}`,
        timestamp: log.created_at,
      }));
    },
    enabled: !!clinicId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching chart data
 */
function useChartData(clinicId: string | undefined) {
  return useQuery({
    queryKey: dashboardKeys.charts(),
    queryFn: async () => {
      if (!clinicId) throw new Error('Clinic ID required');

      const [paymentsData, appointmentsData, patientsData] = await Promise.all([
        supabase
          .from('payments')
          .select('date, amount')
          .eq('clinic_id', clinicId)
          .eq('status', 'paid')
          .gte('date', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString()), // Last 6 months
        supabase
          .from('appointments')
          .select('date')
          .eq('clinic_id', clinicId)
          .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()), // Last 30 days
        supabase
          .from('patients')
          .select('created_at')
          .eq('clinic_id', clinicId)
          .gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString()), // Last 6 months
      ]);

      // Process revenue data by month
      const revenueByMonth = new Map<string, number>();
      (paymentsData.data || []).forEach(payment => {
        const month = new Date(payment.date).toLocaleString('fr-FR', { month: 'short' });
        revenueByMonth.set(month, (revenueByMonth.get(month) || 0) + payment.amount);
      });

      // Process appointments by date
      const appointmentsByDate = new Map<string, number>();
      (appointmentsData.data || []).forEach(appointment => {
        const date = new Date(appointment.date).toLocaleDateString('fr-FR');
        appointmentsByDate.set(date, (appointmentsByDate.get(date) || 0) + 1);
      });

      // Process patient growth by month
      const patientsByMonth = new Map<string, number>();
      (patientsData.data || []).forEach(patient => {
        const month = new Date(patient.created_at).toLocaleString('fr-FR', { month: 'short' });
        patientsByMonth.set(month, (patientsByMonth.get(month) || 0) + 1);
      });

      return {
        revenue: Array.from(revenueByMonth.entries()).map(([month, amount]) => ({ month, amount })),
        appointments: Array.from(appointmentsByDate.entries()).map(([date, count]) => ({ date, count })),
        patientGrowth: Array.from(patientsByMonth.entries()).map(([month, count]) => ({ month, count })),
      };
    },
    enabled: !!clinicId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Main dashboard data hook
 * Consolidates all dashboard data with proper loading states
 */
export function useDashboardData() {
  const { user } = useAuth();
  const { activeClinicId } = useClinic();

  const stats = useDashboardStats(activeClinicId);
  const recentActivity = useRecentActivity(activeClinicId);
  const charts = useChartData(activeClinicId);

  const isLoading = stats.isLoading || recentActivity.isLoading || charts.isLoading;
  const isError = stats.isError || recentActivity.isError || charts.isError;
  const error = stats.error || recentActivity.error || charts.error;

  return {
    data: {
      stats: stats.data || {
        totalPatients: 0,
        totalAppointments: 0,
        totalRevenue: 0,
        pendingPayments: 0,
        activeDoctors: 0,
        lowStockItems: 0,
        pendingLabResults: 0,
      },
      recentActivity: recentActivity.data || [],
      charts: charts.data || {
        revenue: [],
        appointments: [],
        patientGrowth: [],
      },
    },
    isLoading,
    isError,
    error,
    refetch: () => {
      stats.refetch();
      recentActivity.refetch();
      charts.refetch();
    },
  };
}

/**
 * Mutation for invalidating dashboard data
 * Call this after any data change that affects dashboard
 */
export function invalidateDashboardData(queryClient: any) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() }),
    queryClient.invalidateQueries({ queryKey: dashboardKeys.recent() }),
    queryClient.invalidateQueries({ queryKey: dashboardKeys.charts() }),
  ]);
}