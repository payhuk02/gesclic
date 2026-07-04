// Telemedicine Service
// Service layer for video consultation management

import { supabase } from '@/integrations/supabase/client';
import type { 
  TelemedicineSession,
  TelemedicineSettings,
  JoinToken,
  SessionSummary
} from '@/types/phase1';

export class TelemedicineService {
  private readonly DAILY_API_KEY = import.meta.env.VITE_DAILY_API_KEY;
  private readonly DAILY_API_URL = 'https://api.daily.co/v1';

  /**
   * Create a new telemedicine session
   */
  async createSession(appointmentId: string): Promise<TelemedicineSession> {
    try {
      // Get appointment details
      const { data: appointment, error: apptError } = await supabase
        .from('appointments')
        .select('*, patients(*), doctors(*)')
        .eq('id', appointmentId)
        .single();

      if (apptError || !appointment) {
        throw new Error('Appointment not found');
      }

      // Get clinic settings
      const { data: settings } = await supabase
        .from('telemedicine_settings')
        .select('*')
        .eq('clinic_id', appointment.clinic_id)
        .single();

      // Create Daily.co room
      const room = await this.createDailyRoom(settings);

      // Create telemedicine session in database
      const { data: userData } = await supabase.auth.getUser();
      const { data: session, error: sessionError } = await supabase
        .from('telemedicine_sessions')
        .insert({
          appointment_id: appointmentId,
          patient_id: appointment.patient_id,
          provider_id: appointment.user_id,
          clinic_id: appointment.clinic_id,
          daily_room_name: room.name,
          daily_room_url: room.url,
          scheduled_start: appointment.appointment_date || new Date().toISOString(),
          scheduled_end: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // Default 30 min
          status: 'scheduled',
          consent_recording: settings?.enable_recording || false,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      return session;
    } catch (error) {
      console.error('Error creating telemedicine session:', error);
      throw new Error('Failed to create telemedicine session');
    }
  }

  /**
   * Join a telemedicine session
   */
  async joinSession(sessionId: string, role: 'provider' | 'patient'): Promise<JoinToken> {
    try {
      // Get session details
      const { data: session, error } = await supabase
        .from('telemedicine_sessions')
        .select('*, telemedicine_settings(*)')
        .eq('id', sessionId)
        .single();

      if (error || !session) {
        throw new Error('Session not found');
      }

      // Create Daily.co token
      const token = await this.createDailyToken(session.daily_room_name, role, session.telemedicine_settings);

      // Update session status if starting
      if (session.status === 'scheduled') {
        await supabase
          .from('telemedicine_sessions')
          .update({ 
            status: 'in_progress',
            actual_start: new Date().toISOString()
          })
          .eq('id', sessionId);
      }

      return {
        token: token,
        room_url: session.daily_room_url,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        permissions: {
          can_record: session.telemedicine_settings?.enable_recording || false,
          can_screen_share: session.telemedicine_settings?.enable_screen_sharing || true,
          can_chat: session.telemedicine_settings?.enable_chat || true,
        }
      };
    } catch (error) {
      console.error('Error joining session:', error);
      throw new Error('Failed to join telemedicine session');
    }
  }

  /**
   * End a telemedicine session
   */
  async endSession(sessionId: string, summary: SessionSummary): Promise<void> {
    try {
      const { error } = await supabase
        .from('telemedicine_sessions')
        .update({
          status: 'completed',
          actual_end: new Date().toISOString(),
          clinical_notes: summary.clinical_notes,
          diagnosis: summary.diagnosis,
          treatment_plan: summary.treatment_plan,
          follow_up_actions: summary.follow_up_actions,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      // Delete Daily.co room
      await this.deleteDailyRoom(sessionId);
    } catch (error) {
      console.error('Error ending session:', error);
      throw new Error('Failed to end telemedicine session');
    }
  }

  /**
   * Get session recording
   */
  async getRecording(sessionId: string): Promise<any> {
    try {
      const { data: session, error } = await supabase
        .from('telemedicine_sessions')
        .select('recording_url, recording_status')
        .eq('id', sessionId)
        .single();

      if (error || !session) {
        throw new Error('Session not found');
      }

      return {
        url: session.recording_url,
        status: session.recording_status
      };
    } catch (error) {
      console.error('Error getting recording:', error);
      throw new Error('Failed to get session recording');
    }
  }

  /**
   * Check session status
   */
  async getSessionStatus(sessionId: string): Promise<any> {
    try {
      const { data: session, error } = await supabase
        .from('telemedicine_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error || !session) {
        throw new Error('Session not found');
      }

      return {
        status: session.status,
        scheduled_start: session.scheduled_start,
        scheduled_end: session.scheduled_end,
        actual_start: session.actual_start,
        actual_end: session.actual_end,
        duration_seconds: session.duration_seconds,
        connection_quality: session.connection_quality
      };
    } catch (error) {
      console.error('Error getting session status:', error);
      throw new Error('Failed to get session status');
    }
  }

  /**
   * Get telemedicine settings for clinic
   */
  async getClinicSettings(clinicId: string): Promise<TelemedicineSettings | null> {
    try {
      const { data, error } = await supabase
        .from('telemedicine_settings')
        .select('*')
        .eq('clinic_id', clinicId)
        .single();

      if (error) {
        // Return default settings if none exist
        return this.getDefaultSettings();
      }

      return data;
    } catch (error) {
      console.error('Error getting clinic settings:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * Update telemedicine settings
   */
  async updateClinicSettings(clinicId: string, settings: Partial<TelemedicineSettings>): Promise<void> {
    try {
      const { error } = await supabase
        .from('telemedicine_settings')
        .upsert({
          clinic_id,
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating clinic settings:', error);
      throw new Error('Failed to update telemedicine settings');
    }
  }

  /**
   * Get upcoming sessions for provider
   */
  async getUpcomingSessions(providerId: string): Promise<TelemedicineSession[]> {
    try {
      const { data, error } = await supabase
        .from('telemedicine_sessions')
        .select('*, patients(*), appointments(*)')
        .eq('provider_id', providerId)
        .in('status', ['scheduled', 'waiting'])
        .gte('scheduled_start', new Date().toISOString())
        .order('scheduled_start', { ascending: true })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting upcoming sessions:', error);
      return [];
    }
  }

  /**
   * Get session history for patient
   */
  async getPatientSessions(patientId: string): Promise<TelemedicineSession[]> {
    try {
      const { data, error } = await supabase
        .from('telemedicine_sessions')
        .select('*, doctors(*)')
        .eq('patient_id', patientId)
        .in('status', ['completed', 'cancelled'])
        .order('scheduled_start', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting patient sessions:', error);
      return [];
    }
  }

  /**
   * Create Daily.co room
   */
  private async createDailyRoom(settings?: TelemedicineSettings): Promise<{ name: string; url: string }> {
    try {
      const roomName = `gesclic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const response = await fetch(`${this.DAILY_API_URL}/rooms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: roomName,
          privacy: 'private',
          properties: {
            enable_chat: settings?.enable_chat ?? true,
            enable_screen_sharing: settings?.enable_screen_sharing ?? true,
            enable_recording: settings?.enable_recording ?? false,
            max_participants: 4,
            exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
            eject_at_room_exp: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Daily.co API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        name: roomName,
        url: data.url
      };
    } catch (error) {
      console.error('Error creating Daily.co room:', error);
      throw new Error('Failed to create video room');
    }
  }

  /**
   * Create Daily.co token for room access
   */
  private async createDailyToken(roomName: string, role: string, settings?: TelemedicineSettings): Promise<string> {
    try {
      const response = await fetch(`${this.DAILY_API_URL}/meeting-tokens`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            room_name: roomName,
            exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
            is_owner: role === 'provider',
            user_name: role === 'provider' ? 'Provider' : 'Patient',
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Daily.co API error: ${response.status}`);
      }

      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Error creating Daily.co token:', error);
      throw new Error('Failed to create access token');
    }
  }

  /**
   * Delete Daily.co room
   */
  private async deleteDailyRoom(sessionId: string): Promise<void> {
    try {
      const { data: session } = await supabase
        .from('telemedicine_sessions')
        .select('daily_room_name')
        .eq('id', sessionId)
        .single();

      if (!session) return;

      await fetch(`${this.DAILY_API_URL}/rooms/${session.daily_room_name}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.DAILY_API_KEY}`,
        },
      });
    } catch (error) {
      console.error('Error deleting Daily.co room:', error);
      // Don't throw - this is cleanup
    }
  }

  /**
   * Get default telemedicine settings
   */
  private getDefaultSettings(): TelemedicineSettings {
    return {
      id: '',
      clinic_id: '',
      enable_video: true,
      enable_recording: false,
      require_consent_for_recording: true,
      max_session_duration_minutes: 30,
      buffer_time_minutes: 5,
      preferred_video_quality: 'hd',
      enable_screen_sharing: true,
      enable_chat: true,
      enable_waiting_room: true,
      waiting_room_message: 'Merci de patienter. Le professionnel de santé vous rejoindra bientôt.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const telemedicineService = new TelemedicineService();
