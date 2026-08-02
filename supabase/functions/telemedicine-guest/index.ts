import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const DAILY_API_URL = "https://api.daily.co/v1";
const GRACE_BEFORE_MIN = 10;
const GRACE_AFTER_MIN = 15;
const JOIN_CODE_RE = /^[a-z0-9][a-z0-9_-]{3,31}$/;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function encodeRoomName(name: string): string {
  return encodeURIComponent(name);
}

function parseDailyErrorBody(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as { info?: string; error?: string };
    return parsed.info ?? parsed.error ?? raw;
  } catch {
    return raw;
  }
}

function buildRoomProperties(
  settings: Record<string, unknown> | null,
  nbf: number,
  exp: number,
  nowSec: number,
) {
  const safeExp = Math.max(exp, nowSec + 1800);
  const properties: Record<string, unknown> = {
    max_participants: 2,
    exp: safeExp,
    eject_at_room_exp: true,
    enable_chat: settings?.enable_chat ?? true,
    enable_screenshare: settings?.enable_screen_sharing ?? true,
    enable_knocking: settings?.enable_waiting_room ?? true,
  };
  if (nbf > nowSec) properties.nbf = nbf;
  return { properties, safeExp };
}

const SESSION_SELECT = `
  id,
  clinic_id,
  patient_id,
  status,
  reason,
  daily_room_name,
  daily_room_url,
  actual_start,
  scheduled_start,
  scheduled_end,
  patient_rating,
  patient_join_token,
  patient_join_code,
  appointments ( patient_name, doctor_name, date, time )
`;

async function loadSessionByToken(
  admin: ReturnType<typeof createClient>,
  sessionId: string,
  token: string,
) {
  const { data, error } = await admin
    .from("telemedicine_sessions")
    .select(SESSION_SELECT)
    .eq("id", sessionId)
    .eq("patient_join_token", token)
    .maybeSingle();

  if (error) return { error: error.message, session: null };
  if (!data) return { error: "invalid_token", session: null };
  return { error: null, session: data };
}

async function loadSessionByCode(admin: ReturnType<typeof createClient>, code: string) {
  const normalized = code.trim().toLowerCase();
  if (!JOIN_CODE_RE.test(normalized)) {
    return { error: "invalid_code", session: null };
  }

  const { data, error } = await admin
    .from("telemedicine_sessions")
    .select(SESSION_SELECT)
    .eq("patient_join_code", normalized)
    .maybeSingle();

  if (error) return { error: error.message, session: null };
  if (!data) return { error: "invalid_code", session: null };
  return { error: null, session: data };
}

function mapSessionInfo(session: Record<string, unknown>) {
  const appointment = Array.isArray(session.appointments)
    ? session.appointments[0]
    : session.appointments;
  const scheduledStart = session.scheduled_start
    ? new Date(String(session.scheduled_start))
    : null;

  return {
    id: session.id,
    status: session.status,
    reason: session.reason,
    patient_rating: session.patient_rating,
    patient_name: (appointment as { patient_name?: string })?.patient_name ?? "",
    doctor_name: (appointment as { doctor_name?: string })?.doctor_name ?? "",
    scheduled_date:
      (appointment as { date?: string })?.date ??
      (scheduledStart ? scheduledStart.toISOString().split("T")[0] : ""),
    scheduled_time:
      (appointment as { time?: string })?.time ??
      (scheduledStart
        ? scheduledStart.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        : ""),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    let body: {
      sessionId?: string;
      token?: string;
      code?: string;
      action?: string;
      rating?: number;
      feedback?: string;
    };
    try {
      body = await req.json();
    } catch {
      return json({ error: "invalid_json" }, 400);
    }

    const code = typeof body.code === "string" ? body.code.trim().toLowerCase() : "";
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    const token = typeof body.token === "string" ? body.token : "";
    const action = body.action === "join" ? "join" : body.action === "feedback" ? "feedback" : "info";

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let loadError: string | null = null;
    let session: Record<string, unknown> | null = null;

    if (code) {
      const result = await loadSessionByCode(admin, code);
      loadError = result.error;
      session = result.session as Record<string, unknown> | null;
    } else if (/^[0-9a-f-]{36}$/i.test(sessionId) && /^[0-9a-f-]{36}$/i.test(token)) {
      const result = await loadSessionByToken(admin, sessionId, token);
      loadError = result.error;
      session = result.session as Record<string, unknown> | null;
    } else {
      return json({ error: "missing_auth", message: "Code ou lien invalide." }, 400);
    }

    if (loadError || !session) {
      return json({ error: "forbidden", message: "Lien invalide ou expiré." }, 403);
    }

    const resolvedSessionId = String(session.id);

    const logRoomEvent = async (row: Record<string, unknown>) => {
      const { error } = await admin.from("telemedicine_room_events").insert(row);
      if (error) console.error("guest room event log failed", error.message);
    };

    const baseEvent = {
      session_id: session.id,
      clinic_id: session.clinic_id,
      room_name: session.daily_room_name,
      actor_role: "patient",
      scheduled_start: session.scheduled_start,
      scheduled_end: session.scheduled_end,
    };

    if (action === "info") {
      return json({ session: mapSessionInfo(session) });
    }

    if (action === "feedback") {
      if (!["completed", "no_show"].includes(String(session.status))) {
        return json({ error: "session_open", message: "L'avis est disponible après la consultation." }, 409);
      }
      const rating = typeof body.rating === "number" ? Math.round(body.rating) : 0;
      if (rating < 1 || rating > 5) {
        return json({ error: "invalid_rating", message: "Note entre 1 et 5 requise." }, 400);
      }
      const feedbackText =
        typeof body.feedback === "string" ? body.feedback.trim().slice(0, 2000) : null;
      await admin
        .from("telemedicine_sessions")
        .update({
          patient_rating: rating,
          patient_feedback: feedbackText || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", resolvedSessionId);
      await logRoomEvent({
        ...baseEvent,
        event_type: "patient_feedback",
        reason: "guest_feedback_submitted",
        details: { rating },
      });
      return json({ ok: true });
    }

    // join
    if (["cancelled", "completed", "no_show"].includes(String(session.status))) {
      return json({ error: "session_closed", message: "Cette session n'est plus disponible." }, 409);
    }

    const { data: settings } = await admin
      .from("telemedicine_settings")
      .select("*")
      .eq("clinic_id", session.clinic_id)
      .maybeSingle();

    const maxMinutes = Math.min(Math.max(settings?.max_session_duration_minutes ?? 30, 15), 240);
    const nowSec = Math.floor(Date.now() / 1000);
    const startSec = session.scheduled_start
      ? Math.floor(new Date(String(session.scheduled_start)).getTime() / 1000)
      : nowSec;
    const scheduledEndSec = session.scheduled_end
      ? Math.floor(new Date(String(session.scheduled_end)).getTime() / 1000)
      : startSec + maxMinutes * 60;
    const endSec = Math.min(scheduledEndSec, startSec + maxMinutes * 60);
    const nbf = startSec - GRACE_BEFORE_MIN * 60;
    const exp = endSec + GRACE_AFTER_MIN * 60;
    const roomExpIso = new Date(exp * 1000).toISOString();

    if (nowSec < nbf) {
      return json(
        {
          error: "too_early",
          message: "La salle ouvre 10 minutes avant l'heure du rendez-vous.",
          opens_at: new Date(nbf * 1000).toISOString(),
        },
        403,
      );
    }
    if (nowSec >= exp) {
      return json({ error: "expired", message: "Le créneau de cette téléconsultation est terminé." }, 403);
    }

    const dailyKey = Deno.env.get("DAILY_API_KEY")?.trim();
    if (!dailyKey) return json({ error: "DAILY_API_KEY_MISSING" }, 503);

    const dailyHeaders = {
      Authorization: `Bearer ${dailyKey}`,
      "Content-Type": "application/json",
    };
    const encodedRoomName = encodeRoomName(String(session.daily_room_name));
    const { properties: roomProperties, safeExp } = buildRoomProperties(settings, nbf, exp, nowSec);

    let roomUrl = session.daily_room_url as string | null;
    const roomRes = await fetch(`${DAILY_API_URL}/rooms/${encodedRoomName}`, { headers: dailyHeaders });

    if (roomRes.ok) {
      const room = await roomRes.json();
      roomUrl = room.url;
    } else {
      await roomRes.text();
      const createRes = await fetch(`${DAILY_API_URL}/rooms`, {
        method: "POST",
        headers: dailyHeaders,
        body: JSON.stringify({
          name: session.daily_room_name,
          privacy: "private",
          properties: roomProperties,
        }),
      });
      if (!createRes.ok) {
        const detail = await createRes.text();
        return json({
          error: "room_creation_failed",
          message: `Création de la salle vidéo impossible : ${parseDailyErrorBody(detail)}`,
        }, 502);
      }
      const room = await createRes.json();
      roomUrl = room.url;
    }

    const tokenProperties: Record<string, unknown> = {
      room_name: session.daily_room_name,
      exp: safeExp,
      eject_at_token_exp: true,
      is_owner: false,
      user_id: `guest-patient-${session.id}`,
      user_name: mapSessionInfo(session).patient_name || "Patient",
    };
    if (nbf > nowSec) tokenProperties.nbf = nbf;

    const tokenRes = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
      method: "POST",
      headers: dailyHeaders,
      body: JSON.stringify({ properties: tokenProperties }),
    });

    if (!tokenRes.ok) {
      const detail = await tokenRes.text();
      return json({
        error: "token_creation_failed",
        message: `Jeton d'accès vidéo indisponible : ${parseDailyErrorBody(detail)}`,
      }, 502);
    }
    const tokenData = await tokenRes.json();

    const updates: Record<string, unknown> = {
      daily_room_url: roomUrl,
      updated_at: new Date().toISOString(),
    };
    if (session.status === "scheduled" || session.status === "waiting") {
      updates.status = "in_progress";
      updates.actual_start = session.actual_start ?? new Date().toISOString();
    }
    await admin.from("telemedicine_sessions").update(updates).eq("id", resolvedSessionId);

    await logRoomEvent({
      ...baseEvent,
      event_type: "join_granted",
      reason: "guest_token_issued",
      room_exp: roomExpIso,
    });

    return json({
      room_url: roomUrl,
      token: tokenData.token,
      permissions: {
        can_record: false,
        can_screen_share: settings?.enable_screen_sharing ?? true,
        can_chat: settings?.enable_chat ?? true,
      },
    });
  } catch (e) {
    console.error("telemedicine-guest error", e);
    return json({ error: e instanceof Error ? e.message : "unknown_error" }, 500);
  }
});
