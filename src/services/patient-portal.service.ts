// Patient Portal Service
// Service layer for patient portal functionality

import { supabase } from '@/integrations/supabase/client';
import type { 
  PatientPortalSettings,
  PatientMessage,
  MessageThread,
  PatientFeedback,
  AppointmentSlot
} from '@/types/phase1';

export class PatientPortalService {
  /**
   * Get patient portal settings
   */
  async getSettings(patientId: string, clinicId: string): Promise<PatientPortalSettings | null> {
    try {
      const { data, error } = await supabase
        .from('patient_portal_settings')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .single();

      if (error) {
        // Return default settings if none exist
        return this.getDefaultSettings(patientId, clinicId);
      }

      return data;
    } catch (error) {
      console.error('Error getting patient portal settings:', error);
      return this.getDefaultSettings(patientId, clinicId);
    }
  }

  /**
   * Update patient portal settings
   */
  async updateSettings(
    patientId: string,
    clinicId: string,
    settings: Partial<PatientPortalSettings>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('patient_portal_settings')
        .upsert({
          patient_id: patientId,
          clinic_id: clinicId,
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating patient portal settings:', error);
      throw new Error('Failed to update portal settings');
    }
  }

  /**
   * Get message threads for patient
   */
  async getMessageThreads(patientId: string): Promise<MessageThread[]> {
    try {
      const { data, error } = await supabase.rpc('get_patient_message_threads', {
        p_patient_id: patientId
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting message threads:', error);
      return [];
    }
  }

  /**
   * Get messages in a thread
   */
  async getThreadMessages(threadId: string): Promise<PatientMessage[]> {
    try {
      const { data, error } = await supabase
        .from('patient_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting thread messages:', error);
      return [];
    }
  }

  /**
   * Send a new message
   */
  async sendMessage(
    patientId: string,
    clinicId: string,
    subject: string,
    body: string,
    messageType: 'inquiry' | 'appointment_request' | 'prescription_refill' | 'test_result' | 'general',
    attachments?: any[]
  ): Promise<PatientMessage> {
    try {
      const { data, error } = await supabase
        .from('patient_messages')
        .insert({
          patient_id: patientId,
          clinic_id: clinicId,
          subject,
          body,
          message_type: messageType,
          attachments,
          status: 'unread',
          priority: messageType === 'inquiry' ? 'normal' : 'normal'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Reply to a message
   */
  async replyToMessage(
    threadId: string,
    body: string,
    attachments?: any[]
  ): Promise<PatientMessage> {
    try {
      const { data: thread } = await supabase
        .from('patient_messages')
        .select('patient_id, clinic_id, subject, message_type')
        .eq('thread_id', threadId)
        .single();

      if (!thread) throw new Error('Thread not found');

      const { data, error } = await supabase
        .from('patient_messages')
        .insert({
          patient_id: thread.patient_id,
          clinic_id: thread.clinic_id,
          subject: thread.subject,
          body,
          message_type: thread.message_type,
          attachments,
          thread_id,
          status: ' replied',
          priority: 'normal'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error replying to message:', error);
      throw new Error('Failed to reply to message');
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    try {
      await supabase.rpc('mark_message_as_read', { p_message_id: messageId });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  /**
   * Get available appointment slots
   */
  async getAvailableSlots(
    clinicId: string,
    providerId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AppointmentSlot[]> {
    try {
      const start = startDate || new Date();
      const end = endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      let query = supabase
        .from('appointments')
        .select('id, user_id, date, time, type, status')
        .eq('clinic_id', clinicId)
        .in('status', ['available', 'pending'])
        .gte('date', start.toISOString().split('T')[0])
        .lte('date', end.toISOString().split('T')[0]);

      if (providerId) {
        query = query.eq('user_id', providerId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(apt => ({
        id: apt.id,
        provider_id: apt.user_id,
        start_time: `${apt.date}T${apt.time}`,
        end_time: new Date(new Date(`${apt.date}T${apt.time}`).getTime() + 30 * 60 * 1000).toISOString(),
        available: apt.status === 'available'
      }));
    } catch (error) {
      console.error('Error getting available slots:', error);
      return [];
    }
  }

  /**
   * Book an appointment
   */
  async bookAppointment(
    slotId: string,
    patientId: string
  ): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({
          patient_id: patientId,
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', slotId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error booking appointment:', error);
      throw new Error('Failed to book appointment');
    }
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(appointmentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw new Error('Failed to cancel appointment');
    }
  }

  /**
   * Get patient appointments
   */
  async getAppointments(patientId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, doctors(*)')
        .eq('patient_id', patientId)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting appointments:', error);
      return [];
    }
  }

  /**
   * Submit patient feedback
   */
  async submitFeedback(feedback: Omit<PatientFeedback, 'id' | 'created_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('patient_feedback')
        .insert(feedback);

      if (error) throw error;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw new Error('Failed to submit feedback');
    }
  }

  /**
   * Get patient medical records
   */
  async getMedicalRecords(patientId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('date', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting medical records:', error);
      return [];
    }
  }

  /**
   * Get patient prescriptions
   */
  async getPrescriptions(patientId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .order('date', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting prescriptions:', error);
      return [];
    }
  }

  /**
   * Request prescription refill
   */
  async requestPrescriptionRefill(prescriptionId: string): Promise<void> {
    try {
      const { data: prescription } = await supabase
        .from('prescriptions')
        .select('patient_id, clinic_id, doctor_name')
        .eq('id', prescriptionId)
        .single();

      if (!prescription) throw new Error('Prescription not found');

      // Send a message requesting refill
      await this.sendMessage(
        prescription.patient_id,
        prescription.clinic_id,
        `Demande de renouvellement - Ordonnance #${prescriptionId}`,
        `Je souhaite renouveler mon ordonnance prescrite par le Dr. ${prescription.doctor_name}.`,
        'prescription_refill'
      );
    } catch (error) {
      console.error('Error requesting prescription refill:', error);
      throw new Error('Failed to request prescription refill');
    }
  }

  /**
   * Get patient payments
   */
  async getPayments(patientId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('patient_id', patientId)
        .order('date', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting payments:', error);
      return [];
    }
  }

  /**
   * Get default portal settings
   */
  private getDefaultSettings(patientId: string, clinicId: string): PatientPortalSettings {
    return {
      id: '',
      patient_id: patientId,
      clinic_id: clinicId,
      enable_appointments: true,
      enable_messaging: true,
      enable_records_access: true,
      enable_payments: true,
      email_appointment_reminders: true,
      sms_appointment_reminders: false,
      email_test_results: true,
      sms_test_results: false,
      require_2fa: false,
      session_timeout_minutes: 30,
      preferred_language: 'fr',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const patientPortalService = new PatientPortalService();
