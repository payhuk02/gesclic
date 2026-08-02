// Telemedicine Service
// Service layer for video consultation management

import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';
import type {
  TelemedicineSettings,
  JoinToken,
} from '@/types/phase1';

export interface CreateSessionInput {
  patient_id: string;
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  scheduled_date: string;
  scheduled_time: string;
  duration: number;
  reason: string;
}

export interface TelemedicineSessionListItem {
  id: string;
  patient_name: string;
  doctor_name: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  reason?: string | null;
  recording_url?: string | null;
}

export class TelemedicineService {
  private async parseFunctionError(error: unknown, fallback: string): Promise<string> {
    if (error instanceof FunctionsHttpError) {
      try {
        const body = await error.context.json();
        if (typeof body?.message === 'string') return body.message;
        if (typeof body?.info === 'string') return body.info;
        if (typeof body?.error === 'string' && body.error !== 'room_creation_failed') return body.error;
      } catch {
        // ignore JSON parse errors
      }
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallback;
  }

  private generateRoomName(): string {
    return `gesclic-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  private buildScheduledTimes(input: CreateSessionInput) {
    const scheduledStart = new Date(`${input.scheduled_date}T${input.scheduled_time}`);
    const scheduledEnd = new Date(scheduledStart.getTime() + input.duration * 60 * 1000);
    return { scheduledStart, scheduledEnd };
  }

  /**
   * Create a telemedicine session from the clinic UI form
   */
  async createSession(input: CreateSessionInput, clinicId: string): Promise<void> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      throw new Error('Utilisateur non authentifié');
    }

    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .select('user_id')
      .eq('id', input.doctor_id)
      .eq('clinic_id', clinicId)
      .single();

    if (doctorError || !doctor) {
      throw new Error('Médecin introuvable');
    }

    const { scheduledStart, scheduledEnd } = this.buildScheduledTimes(input);

    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        clinic_id: clinicId,
        user_id: userData.user.id,
        patient_id: input.patient_id,
        patient_name: input.patient_name,
        doctor_name: input.doctor_name,
        date: input.scheduled_date,
        time: input.scheduled_time,
        type: 'telemedicine',
        status: 'scheduled',
      })
      .select('id')
      .single();

    if (appointmentError || !appointment) {
      throw appointmentError ?? new Error('Impossible de créer le rendez-vous');
    }

    const { error: sessionError } = await supabase
      .from('telemedicine_sessions')
      .insert({
        appointment_id: appointment.id,
        patient_id: input.patient_id,
        provider_id: doctor.user_id ?? userData.user.id,
        doctor_id: input.doctor_id,
        clinic_id: clinicId,
        daily_room_name: this.generateRoomName(),
        scheduled_start: scheduledStart.toISOString(),
        scheduled_end: scheduledEnd.toISOString(),
        reason: input.reason || null,
        status: 'scheduled',
        consent_recording: false,
      });

    if (sessionError) {
      throw sessionError;
    }
  }

  /**
   * Join a telemedicine session via the secure edge function
   */
  async joinSession(sessionId: string): Promise<JoinToken> {
    const { data, error } = await supabase.functions.invoke('telemedicine-room', {
      body: { sessionId, action: 'join' },
    });

    if (error) {
      throw new Error(await this.parseFunctionError(error, 'Impossible de rejoindre la session'));
    }

    if (data?.error) {
      throw new Error(data.message ?? data.error);
    }

    return {
      token: data.token,
      room_url: data.room_url,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      permissions: data.permissions ?? {
        can_record: false,
        can_screen_share: true,
        can_chat: true,
      },
    };
  }

  /**
   * End a telemedicine session via the secure edge function
   */
  async endSession(sessionId: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke('telemedicine-room', {
      body: { sessionId, action: 'end' },
    });

    if (error) {
      throw new Error(await this.parseFunctionError(error, 'Impossible de terminer la session'));
    }

    if (data?.error) {
      throw new Error(data.message ?? data.error);
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
    const { error } = await supabase
      .from('telemedicine_settings')
      .upsert({
        clinic_id: clinicId,
        ...settings,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw error;
    }
  }

  /**
   * List telemedicine sessions for a clinic
   */
  async getClinicSessions(clinicId: string): Promise<TelemedicineSessionListItem[]> {
    const { data, error } = await supabase
      .from('telemedicine_sessions')
      .select(`
        id,
        status,
        reason,
        recording_url,
        scheduled_start,
        appointments (
          patient_name,
          doctor_name,
          date,
          time
        )
      `)
      .eq('clinic_id', clinicId)
      .order('scheduled_start', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((session) => {
      const appointment = Array.isArray(session.appointments)
        ? session.appointments[0]
        : session.appointments;

      const scheduledStart = session.scheduled_start
        ? new Date(session.scheduled_start)
        : null;

      return {
        id: session.id,
        status: session.status,
        reason: session.reason,
        recording_url: session.recording_url,
        patient_name: appointment?.patient_name ?? '',
        doctor_name: appointment?.doctor_name ?? '',
        scheduled_date:
          appointment?.date ??
          (scheduledStart ? scheduledStart.toISOString().split('T')[0] : ''),
        scheduled_time:
          appointment?.time ??
          (scheduledStart
            ? scheduledStart.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            : ''),
      };
    });
  }

  /** @deprecated Use getClinicSessions */
  async getUpcomingSessions(clinicId: string): Promise<TelemedicineSessionListItem[]> {
    return this.getClinicSessions(clinicId);
  }

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

export const telemedicineService = new TelemedicineService();
