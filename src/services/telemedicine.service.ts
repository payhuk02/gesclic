// Telemedicine Service
// Service layer for video consultation management

import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';
import type {
  TelemedicineSettings,
  JoinToken,
  SessionSummary,
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
  clinical_notes?: string | null;
  diagnosis?: string | null;
  treatment_plan?: string | null;
  actual_start?: string | null;
  patient_rating?: number | null;
  patient_feedback?: string | null;
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
      const message = appointmentError?.message ?? 'Impossible de créer le rendez-vous';
      throw new Error(message);
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
      const message = sessionError.message?.includes('duplicate')
        ? 'Une session existe déjà pour ce créneau.'
        : sessionError.message;
      throw new Error(message);
    }
  }

  /**
   * Create a telemedicine session from an existing appointment
   */
  async createSessionFromAppointment(
    appointmentId: string,
    clinicId: string,
    options?: { duration?: number; reason?: string },
  ): Promise<string> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      throw new Error('Utilisateur non authentifié');
    }

    const { data: appointment, error: apptError } = await supabase
      .from('appointments')
      .select('id, patient_id, patient_name, doctor_name, date, time, type, clinic_id')
      .eq('id', appointmentId)
      .eq('clinic_id', clinicId)
      .single();

    if (apptError || !appointment) {
      throw new Error('Rendez-vous introuvable');
    }

    const { data: existing } = await supabase
      .from('telemedicine_sessions')
      .select('id')
      .eq('appointment_id', appointmentId)
      .maybeSingle();

    if (existing) {
      throw new Error('Une session vidéo existe déjà pour ce rendez-vous');
    }

    let patientId = appointment.patient_id;
    if (!patientId) {
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('clinic_id', clinicId)
        .eq('name', appointment.patient_name)
        .maybeSingle();
      patientId = patient?.id ?? null;
    }

    if (!patientId) {
      throw new Error('Patient introuvable pour ce rendez-vous');
    }

    const { data: doctor } = await supabase
      .from('doctors')
      .select('id, user_id')
      .eq('clinic_id', clinicId)
      .eq('name', appointment.doctor_name)
      .maybeSingle();

    if (!doctor) {
      throw new Error('Médecin introuvable pour ce rendez-vous');
    }

    const duration = options?.duration ?? 30;
    const scheduledStart = new Date(`${appointment.date}T${appointment.time}`);
    const scheduledEnd = new Date(scheduledStart.getTime() + duration * 60 * 1000);

    const { data: session, error: sessionError } = await supabase
      .from('telemedicine_sessions')
      .insert({
        appointment_id: appointment.id,
        patient_id: patientId,
        provider_id: doctor.user_id ?? userData.user.id,
        doctor_id: doctor.id,
        clinic_id: clinicId,
        daily_room_name: this.generateRoomName(),
        scheduled_start: scheduledStart.toISOString(),
        scheduled_end: scheduledEnd.toISOString(),
        reason: options?.reason ?? null,
        status: 'scheduled',
        consent_recording: false,
      })
      .select('id')
      .single();

    if (sessionError || !session) {
      throw new Error(sessionError?.message ?? 'Impossible de créer la session vidéo');
    }

    const teleType = appointment.type?.toLowerCase();
    if (teleType !== 'telemedicine' && teleType !== 'téléconsultation') {
      await supabase
        .from('appointments')
        .update({ type: 'telemedicine' })
        .eq('id', appointmentId);
    }

    return session.id;
  }

  /**
   * Submit patient feedback after a completed session
   */
  async submitPatientFeedback(
    sessionId: string,
    rating: number,
    feedback?: string,
  ): Promise<void> {
    const { data, error } = await supabase.functions.invoke('telemedicine-room', {
      body: { sessionId, action: 'feedback', rating, feedback },
    });

    if (error) {
      throw new Error(await this.parseFunctionError(error, 'Impossible d\'envoyer votre avis'));
    }

    if (data?.error) {
      throw new Error(data.message ?? data.error);
    }
  }

  /**
   * Check whether an appointment already has a telemedicine session
   */
  async hasSessionForAppointment(appointmentId: string): Promise<boolean> {
    const { data } = await supabase
      .from('telemedicine_sessions')
      .select('id')
      .eq('appointment_id', appointmentId)
      .maybeSingle();
    return !!data;
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
   * Cancel a telemedicine session via the secure edge function
   */
  async cancelSession(sessionId: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke('telemedicine-room', {
      body: { sessionId, action: 'cancel' },
    });

    if (error) {
      throw new Error(await this.parseFunctionError(error, 'Impossible d\'annuler la session'));
    }

    if (data?.error) {
      throw new Error(data.message ?? data.error);
    }
  }

  /**
   * End a telemedicine session via the secure edge function
   */
  async endSession(sessionId: string, summary?: Partial<SessionSummary>): Promise<void> {
    const { data, error } = await supabase.functions.invoke('telemedicine-room', {
      body: { sessionId, action: 'end', summary },
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
        return { ...this.getDefaultSettings(), clinic_id: clinicId };
      }

      return { ...data, clinic_id: clinicId };
    } catch (error) {
      console.error('Error getting clinic settings:', error);
      return { ...this.getDefaultSettings(), clinic_id: clinicId };
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

  async getSessionAppointmentIds(clinicId: string): Promise<Set<string>> {
    const { data } = await supabase
      .from('telemedicine_sessions')
      .select('appointment_id')
      .eq('clinic_id', clinicId);

    return new Set(
      (data ?? [])
        .map((row) => row.appointment_id)
        .filter((id): id is string => typeof id === 'string'),
    );
  }

  private mapSessionRow(
    session: {
      id: string;
      status: string;
      reason?: string | null;
      recording_url?: string | null;
      scheduled_start?: string | null;
      clinical_notes?: string | null;
      diagnosis?: string | null;
      treatment_plan?: string | null;
      actual_start?: string | null;
      actual_end?: string | null;
      patient_rating?: number | null;
      patient_feedback?: string | null;
      appointments?: { patient_name?: string; doctor_name?: string; date?: string; time?: string } | { patient_name?: string; doctor_name?: string; date?: string; time?: string }[] | null;
    },
  ): TelemedicineSessionListItem {
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
      clinical_notes: session.clinical_notes,
      diagnosis: session.diagnosis,
      treatment_plan: session.treatment_plan,
      actual_start: session.actual_start,
      actual_end: session.actual_end,
      patient_rating: session.patient_rating,
      patient_feedback: session.patient_feedback,
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
        clinical_notes,
        diagnosis,
        treatment_plan,
        actual_start,
        actual_end,
        patient_rating,
        patient_feedback,
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

    return (data ?? []).map((session) => this.mapSessionRow(session));
  }

  /** @deprecated Use getClinicSessions */
  async getUpcomingSessions(clinicId: string): Promise<TelemedicineSessionListItem[]> {
    return this.getClinicSessions(clinicId);
  }

  /**
   * Get a single session for join page
   */
  async getSession(sessionId: string): Promise<TelemedicineSessionListItem | null> {
    const { data, error } = await supabase
      .from('telemedicine_sessions')
      .select(`
        id,
        status,
        reason,
        recording_url,
        scheduled_start,
        clinical_notes,
        diagnosis,
        treatment_plan,
        actual_start,
        actual_end,
        patient_rating,
        patient_feedback,
        appointments (
          patient_name,
          doctor_name,
          date,
          time
        )
      `)
      .eq('id', sessionId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return this.mapSessionRow(data);
  }

  /**
   * Open Daily.co room in a new tab
   */
  openVideoRoom(joinData: JoinToken): void {
    const roomUrl = `${joinData.room_url}${joinData.room_url.includes('?') ? '&' : '?'}t=${joinData.token}`;
    window.open(roomUrl, '_blank', 'noopener,noreferrer');
  }

  getPatientJoinUrl(sessionId: string): string {
    return `${window.location.origin}/telemedicine/join/${sessionId}`;
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
