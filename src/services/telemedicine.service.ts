// Telemedicine Service
// Service layer for video consultation management.
// Daily.co is never called from the browser: room + token creation happens in the
// `telemedicine-room` edge function which holds the DAILY_API_KEY secret.

import { supabase } from '@/integrations/supabase/client';
import type { TelemedicineSettings } from '@/types/phase1';

export interface TelemedicineSessionRow {
  id: string;
  appointment_id: string;
  patient_id: string;
  provider_id: string;
  doctor_id: string | null;
  clinic_id: string;
  daily_room_name: string;
  daily_room_url: string | null;
  status: string;
  reason: string | null;
  scheduled_start: string;
  scheduled_end: string;
  actual_start: string | null;
  actual_end: string | null;
  duration_seconds: number | null;
  recording_url: string | null;
  clinical_notes: string | null;
  diagnosis: string | null;
  treatment_plan: string | null;
  patients?: { name: string } | null;
  doctors?: { name: string } | null;
}

export interface CreateSessionInput {
  appointmentId: string;
  clinicId: string;
  patientId: string;
  doctorId: string | null;
  providerId: string;
  scheduledStart: Date;
  durationMinutes: number;
  reason?: string;
}

export interface JoinResult {
  room_url: string;
  token: string;
  is_owner: boolean;
  permissions: { can_record: boolean; can_screen_share: boolean; can_chat: boolean };
}

export interface SessionSummary {
  clinical_notes?: string;
  diagnosis?: string;
  treatment_plan?: string;
}

const SESSION_SELECT =
  'id, appointment_id, patient_id, provider_id, doctor_id, clinic_id, daily_room_name, daily_room_url, status, reason, scheduled_start, scheduled_end, actual_start, actual_end, duration_seconds, recording_url, clinical_notes, diagnosis, treatment_plan, patients(name), doctors(name)';

export class TelemedicineService {
  private generateRoomName() {
    const rand =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
        : Math.random().toString(36).slice(2, 14);
    return `gesclic-${Date.now().toString(36)}-${rand}`;
  }

  /** All sessions of a clinic, newest first. */
  async getClinicSessions(clinicId: string): Promise<TelemedicineSessionRow[]> {
    const { data, error } = await supabase
      .from('telemedicine_sessions')
      .select(SESSION_SELECT)
      .eq('clinic_id', clinicId)
      .order('scheduled_start', { ascending: false })
      .limit(200);

    if (error) throw error;
    return (data || []) as unknown as TelemedicineSessionRow[];
  }

  async createSession(input: CreateSessionInput): Promise<TelemedicineSessionRow> {
    const scheduledEnd = new Date(
      input.scheduledStart.getTime() + input.durationMinutes * 60 * 1000,
    );

    const { data, error } = await supabase
      .from('telemedicine_sessions')
      .insert({
        appointment_id: input.appointmentId,
        clinic_id: input.clinicId,
        patient_id: input.patientId,
        provider_id: input.providerId,
        doctor_id: input.doctorId,
        daily_room_name: this.generateRoomName(),
        scheduled_start: input.scheduledStart.toISOString(),
        scheduled_end: scheduledEnd.toISOString(),
        status: 'scheduled',
        reason: input.reason?.trim() || null,
      })
      .select(SESSION_SELECT)
      .single();

    if (error) throw error;
    return data as unknown as TelemedicineSessionRow;
  }

  /** Creates/opens the Daily.co room via the edge function and returns a join token. */
  async joinSession(sessionId: string): Promise<JoinResult> {
    const { data, error } = await supabase.functions.invoke('telemedicine-room', {
      body: { sessionId, action: 'join' },
    });

    if (error) {
      // Surface the function's JSON error message when available
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === 'function') {
        try {
          const payload = await ctx.json();
          throw new Error(payload?.message || payload?.error || error.message);
        } catch (parsed) {
          if (parsed instanceof Error && parsed.message) throw parsed;
        }
      }
      throw error;
    }
    if (data?.error) throw new Error(data.message || data.error);
    return data as JoinResult;
  }

  async endSession(sessionId: string, summary: SessionSummary = {}): Promise<void> {
    const { data: current } = await supabase
      .from('telemedicine_sessions')
      .select('actual_start')
      .eq('id', sessionId)
      .maybeSingle();

    const endedAt = new Date();
    const duration = current?.actual_start
      ? Math.max(
          0,
          Math.round((endedAt.getTime() - new Date(current.actual_start).getTime()) / 1000),
        )
      : null;

    const { error } = await supabase
      .from('telemedicine_sessions')
      .update({
        status: 'completed',
        actual_end: endedAt.toISOString(),
        duration_seconds: duration,
        clinical_notes: summary.clinical_notes?.trim() || null,
        diagnosis: summary.diagnosis?.trim() || null,
        treatment_plan: summary.treatment_plan?.trim() || null,
        updated_at: endedAt.toISOString(),
      })
      .eq('id', sessionId);

    if (error) throw error;

    // Best-effort cleanup of the Daily.co room
    await supabase.functions
      .invoke('telemedicine-room', { body: { sessionId, action: 'end' } })
      .catch(() => undefined);
  }

  async cancelSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('telemedicine_sessions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', sessionId);
    if (error) throw error;
  }

  async getClinicSettings(clinicId: string): Promise<TelemedicineSettings | null> {
    const { data, error } = await supabase
      .from('telemedicine_settings')
      .select('*')
      .eq('clinic_id', clinicId)
      .maybeSingle();

    if (error) throw error;
    return (data as unknown as TelemedicineSettings) ?? null;
  }

  async updateClinicSettings(
    clinicId: string,
    settings: Partial<TelemedicineSettings>,
  ): Promise<TelemedicineSettings> {
    const { data, error } = await supabase
      .from('telemedicine_settings')
      .upsert(
        { clinic_id: clinicId, ...settings, updated_at: new Date().toISOString() } as never,
        { onConflict: 'clinic_id' },
      )
      .select()
      .single();

    if (error) throw error;
    return data as unknown as TelemedicineSettings;
  }
}

export const telemedicineService = new TelemedicineService();
