// Analytics Service
// Service layer for advanced analytics and business intelligence

import { supabase } from '@/integrations/supabase/client';
import type { 
  AnalyticsEvent,
  RevenueMetrics,
  PatientMetrics,
  OperationalMetrics,
  FinancialHealth,
  ProviderPerformance,
  DailyRevenue,
  DailyAppointments
} from '@/types/phase1';

export class AnalyticsService {
  /**
   * Track analytics event
   */
  async trackEvent(
    eventName: string,
    eventCategory: string,
    eventProperties?: Record<string, any>,
    pageUrl?: string
  ): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const clinicId = await this.getCurrentClinicId();

      await supabase.rpc('track_analytics_event', {
        p_clinic_id: clinicId,
        p_user_id: userData.user?.id,
        p_user_type: await this.getUserType(),
        p_event_name: eventName,
        p_event_category: eventCategory,
        p_event_properties: eventProperties,
        p_page_url: pageUrl
      });
    } catch (error) {
      console.error('Error tracking analytics event:', error);
    }
  }

  /**
   * Get clinic analytics summary
   */
  async getClinicSummary(
    clinicId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_clinic_analytics_summary', {
        p_clinic_id: clinicId,
        p_start_date: startDate?.toISOString().split('T')[0],
        p_end_date: endDate?.toISOString().split('T')[0]
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting clinic summary:', error);
      return null;
    }
  }

  /**
   * Get revenue metrics
   */
  async getRevenueMetrics(clinicId: string, days: number = 30): Promise<RevenueMetrics> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: revenueData, error } = await supabase
        .from('mv_daily_revenue')
        .select('*')
        .eq('clinic_id', clinicId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;

      const totalRevenue = revenueData?.reduce((sum, day) => sum + Number(day.total_revenue), 0) || 0;
      const previousPeriodRevenue = await this.getPreviousPeriodRevenue(clinicId, days);
      const revenueGrowth = previousPeriodRevenue > 0 
        ? ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 
        : 0;

      return {
        total_revenue: totalRevenue,
        revenue_growth: revenueGrowth,
        revenue_by_service: await this.getRevenueByService(clinicId, days),
        revenue_by_provider: await this.getRevenueByProvider(clinicId, days),
        revenue_forecast: await this.getRevenueForecast(clinicId),
        average_revenue_per_patient: revenueData?.length > 0 
          ? totalRevenue / revenueData.reduce((sum, day) => sum + Number(day.unique_patients), 0)
          : 0,
        collection_rate: await this.getCollectionRate(clinicId, days)
      };
    } catch (error) {
      console.error('Error getting revenue metrics:', error);
      throw new Error('Failed to get revenue metrics');
    }
  }

  /**
   * Get patient metrics
   */
  async getPatientMetrics(clinicId: string, days: number = 30): Promise<PatientMetrics> {
    try {
      const { data: patients, error } = await supabase
        .from('patients')
        .select('id, created_at')
        .eq('clinic_id', clinicId)
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const { count: totalPatients } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinicId);

      const { data: feedback } = await supabase
        .from('patient_feedback')
        .select('overall_rating')
        .eq('clinic_id', clinicId)
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

      const avgRating = feedback?.length > 0
        ? feedback.reduce((sum, f) => sum + f.overall_rating, 0) / feedback.length
        : 0;

      return {
        total_patients: totalPatients || 0,
        new_patients: patients?.length || 0,
        patient_retention_rate: await this.getRetentionRate(clinicId, days),
        patient_acquisition_cost: await this.getPatientAcquisitionCost(clinicId, days),
        patient_lifetime_value: await this.getPatientLifetimeValue(clinicId),
        patient_satisfaction: avgRating
      };
    } catch (error) {
      console.error('Error getting patient metrics:', error);
      throw new Error('Failed to get patient metrics');
    }
  }

  /**
   * Get operational metrics
   */
  async getOperationalMetrics(clinicId: string, days: number = 30): Promise<OperationalMetrics> {
    try {
      const { data: appointments, error } = await supabase
        .from('mv_daily_appointments')
        .select('*')
        .eq('clinic_id', clinicId)
        .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      if (error) throw error;

      const totalAppointments = appointments?.reduce((sum, day) => sum + Number(day.total_appointments), 0) || 0;
      const completedAppointments = appointments?.reduce((sum, day) => sum + Number(day.completed), 0) || 0;
      const noShows = appointments?.reduce((sum, day) => sum + Number(day.no_shows), 0) || 0;

      return {
        appointment_utilization: totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0,
        average_wait_time: await this.getAverageWaitTime(clinicId, days),
        no_show_rate: totalAppointments > 0 ? (noShows / totalAppointments) * 100 : 0,
        staff_efficiency: await this.getStaffEfficiency(clinicId, days),
        resource_utilization: await this.getResourceUtilization(clinicId, days)
      };
    } catch (error) {
      console.error('Error getting operational metrics:', error);
      throw new Error('Failed to get operational metrics');
    }
  }

  /**
   * Get financial health metrics
   */
  async getFinancialHealth(clinicId: string): Promise<FinancialHealth> {
    try {
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, status, created_at')
        .eq('clinic_id', clinicId)
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

      const totalRevenue = payments?.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const pendingPayments = payments?.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      return {
        current_ratio: await this.getCurrentRatio(clinicId),
        profit_margin: await this.getProfitMargin(clinicId),
        operating_cash_flow: totalRevenue - pendingPayments,
        days_in_ar: await this.getDaysInAR(clinicId),
        bad_debt_ratio: await this.getBadDebtRatio(clinicId)
      };
    } catch (error) {
      console.error('Error getting financial health:', error);
      throw new Error('Failed to get financial health metrics');
    }
  }

  /**
   * Get provider performance
   */
  async getProviderPerformance(clinicId: string): Promise<ProviderPerformance[]> {
    try {
      const { data, error } = await supabase
        .from('mv_provider_performance')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('completion_rate', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting provider performance:', error);
      return [];
    }
  }

  /**
   * Refresh analytics materialized views
   */
  async refreshViews(): Promise<void> {
    try {
      await supabase.rpc('refresh_analytics_views');
    } catch (error) {
      console.error('Error refreshing analytics views:', error);
      throw new Error('Failed to refresh analytics views');
    }
  }

  /**
   * Get analytics events for clinic
   */
  async getAnalyticsEvents(
    clinicId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<AnalyticsEvent[]> {
    try {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting analytics events:', error);
      return [];
    }
  }

  /**
   * Get event analytics by category
   */
  async getEventsByCategory(clinicId: string, days: number = 30): Promise<Record<string, number>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('analytics_events')
        .select('event_category')
        .eq('clinic_id', clinicId)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const categoryCounts: Record<string, number> = {};
      data?.forEach(event => {
        categoryCounts[event.event_category] = (categoryCounts[event.event_category] || 0) + 1;
      });

      return categoryCounts;
    } catch (error) {
      console.error('Error getting events by category:', error);
      return {};
    }
  }

  // Helper methods

  private async getCurrentClinicId(): Promise<string> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return '';

      const { data } = await supabase
        .from('clinic_members')
        .select('clinic_id')
        .eq('user_id', userData.user.id)
        .eq('is_active', true)
        .single();

      return data?.clinic_id || '';
    } catch (error) {
      return '';
    }
  }

  private async getUserType(): Promise<string> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return 'patient';

      const { data } = await supabase
        .from('clinic_members')
        .select('role')
        .eq('user_id', userData.user.id)
        .eq('is_active', true)
        .single();

      return data?.role || 'patient';
    } catch (error) {
      return 'patient';
    }
  }

  private async getPreviousPeriodRevenue(clinicId: string, days: number): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days * 2);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - days);

    const { data } = await supabase
      .from('mv_daily_revenue')
      .select('total_revenue')
      .eq('clinic_id', clinicId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);

    return data?.reduce((sum, day) => sum + Number(day.total_revenue), 0) || 0;
  }

  private async getRevenueByService(clinicId: string, days: number): Promise<any[]> {
    // This would be implemented with service categorization
    return [];
  }

  private async getRevenueByProvider(clinicId: string, days: number): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data } = await supabase
      .from('payments')
      .select('user_id, amount')
      .eq('clinic_id', clinicId)
      .gte('created_at', startDate.toISOString());

    const providerRevenue: Record<string, number> = {};
    data?.forEach(payment => {
      providerRevenue[payment.user_id] = (providerRevenue[payment.user_id] || 0) + Number(payment.amount);
    });

    return Object.entries(providerRevenue).map(([provider_id, revenue]) => ({
      provider_id,
      revenue,
      growth: 0 // Would calculate from previous period
    }));
  }

  private async getRevenueForecast(clinicId: string): Promise<any[]> {
    // Simple linear forecast based on last 30 days
    const { data } = await supabase
      .from('mv_daily_revenue')
      .select('date, total_revenue')
      .eq('clinic_id', clinicId)
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (!data || data.length < 7) return [];

    const avgRevenue = data.reduce((sum, day) => sum + Number(day.total_revenue), 0) / data.length;
    const forecast = [];
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      forecast.push({
        period: date.toISOString().split('T')[0],
        forecast: avgRevenue * (1 + (Math.random() - 0.5) * 0.1), // Add some variance
        confidence: 0.7
      });
    }

    return forecast;
  }

  private async getCollectionRate(clinicId: string, days: number): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data } = await supabase
      .from('payments')
      .select('amount, status')
      .eq('clinic_id', clinicId)
      .gte('created_at', startDate.toISOString());

    if (!data || data.length === 0) return 0;

    const totalAmount = data.reduce((sum, p) => sum + Number(p.amount), 0);
    const collectedAmount = data.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount), 0);

    return totalAmount > 0 ? (collectedAmount / totalAmount) * 100 : 0;
  }

  private async getRetentionRate(clinicId: string, days: number): Promise<number> {
    // Simplified retention calculation
    return 85; // Placeholder
  }

  private async getPatientAcquisitionCost(clinicId: string, days: number): Promise<number> {
    // Would integrate with marketing spend data
    return 50; // Placeholder
  }

  private async getPatientLifetimeValue(clinicId: string): Promise<number> {
    // Simplified LTV calculation
    return 500; // Placeholder
  }

  private async getAverageWaitTime(clinicId: string, days: number): Promise<number> {
    // Would calculate from appointment data
    return 15; // Placeholder in minutes
  }

  private async getStaffEfficiency(clinicId: string, days: number): Promise<number> {
    // Would calculate from provider performance
    return 85; // Placeholder percentage
  }

  private async getResourceUtilization(clinicId: string, days: number): Promise<number> {
    // Would calculate from equipment and room usage
    return 75; // Placeholder percentage
  }

  private async getCurrentRatio(clinicId: string): Promise<number> {
    // Would calculate from financial data
    return 1.5; // Placeholder
  }

  private async getProfitMargin(clinicId: string): Promise<number> {
    // Would calculate from revenue and expenses
    return 25; // Placeholder percentage
  }

  private async getDaysInAR(clinicId: string): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    const { data } = await supabase
      .from('payments')
      .select('created_at, status')
      .eq('clinic_id', clinicId)
      .eq('status', 'pending')
      .gte('created_at', startDate.toISOString());

    if (!data || data.length === 0) return 0;

    const avgAge = data.reduce((sum, p) => {
      const age = Date.now() - new Date(p.created_at).getTime();
      return sum + age;
    }, 0) / data.length;

    return Math.floor(avgAge / (1000 * 60 * 60 * 24));
  }

  private async getBadDebtRatio(clinicId: string): Promise<number> {
    // Would calculate from uncollectible payments
    return 5; // Placeholder percentage
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
