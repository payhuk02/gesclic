import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const DAILY_API_URL = "https://api.daily.co/v1";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) return json({ error: "unauthorized" }, 401);
    const userId = userData.user.id;

    let body: { sessionId?: string; action?: string };
    try {
      body = await req.json();
    } catch {
      return json({ error: "invalid_json" }, 400);
    }

    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    const action = body.action === "end" ? "end" : "join";
    if (!/^[0-9a-f-]{36}$/i.test(sessionId)) return json({ error: "sessionId invalide" }, 400);

    const admin = createClient(supabaseUrl, serviceKey);

    // Journal des évènements de salle (best-effort, ne bloque jamais la réponse)
    const logRoomEvent = async (row: Record<string, unknown>) => {
      const { error } = await admin.from("telemedicine_room_events").insert(row);
      if (error) console.error("room event log failed", error.message);
    };


    const { data: session, error: sessionError } = await admin
      .from("telemedicine_sessions")
      .select(
        "id, clinic_id, provider_id, doctor_id, patient_id, status, daily_room_name, daily_room_url, actual_start, scheduled_start, scheduled_end",
      )
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionError) return json({ error: sessionError.message }, 500);
    if (!session) return json({ error: "Session introuvable" }, 404);

    // Resolve assigned doctor auth user (doctor_id references doctors.id, not auth.users)
    let doctorUserId: string | null = null;
    if (session.doctor_id) {
      const { data: doctor } = await admin
        .from("doctors")
        .select("user_id")
        .eq("id", session.doctor_id)
        .maybeSingle();
      doctorUserId = doctor?.user_id ?? null;
    }

    const isAssignedProvider =
      session.provider_id === userId || doctorUserId === userId;

    let isPatient = false;
    if (!isAssignedProvider && session.patient_id) {
      const { data: patient } = await admin
        .from("patients")
        .select("id")
        .eq("id", session.patient_id)
        .eq("user_id", userId)
        .maybeSingle();
      isPatient = !!patient;
    }

    let isClinicProvider = false;
    if (!isAssignedProvider && !isPatient) {
      const { data: membership } = await admin
        .from("clinic_members")
        .select("role")
        .eq("clinic_id", session.clinic_id)
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();
      isClinicProvider = !!membership && ["admin", "medecin"].includes(membership.role);
    }

    let isSuperAdmin = false;
    if (!isAssignedProvider && !isPatient && !isClinicProvider) {
      const { data: superRole } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "super_admin")
        .maybeSingle();
      isSuperAdmin = !!superRole;
    }

    const isProvider = isAssignedProvider || isClinicProvider || isSuperAdmin;

    const baseEvent = {
      session_id: session.id,
      clinic_id: session.clinic_id,
      room_name: session.daily_room_name,
      actor_user_id: userId,
      scheduled_start: session.scheduled_start,
      scheduled_end: session.scheduled_end,
    };

    if (!isProvider && !isPatient) {
      console.warn("telemedicine access denied", { sessionId, userId });
      await logRoomEvent({
        ...baseEvent,
        event_type: "access_denied",
        reason: "not_participant",
        actor_role: "other",
      });
      return json({ error: "forbidden", message: "Accès réservé au médecin et au patient de cette consultation." }, 403);
    }

    const actorRole = isProvider ? "provider" : "patient";

    // Closed sessions can never be joined again
    if (["cancelled", "completed", "no_show"].includes(String(session.status))) {
      await logRoomEvent({
        ...baseEvent,
        event_type: "access_denied",
        reason: `session_${session.status}`,
        actor_role: actorRole,
      });
      return json({ error: "session_closed", status: session.status }, 409);
    }

    const dailyKey = Deno.env.get("DAILY_API_KEY");
    if (!dailyKey) {
      return json(
        { error: "DAILY_API_KEY_MISSING", message: "La clé API Daily.co n'est pas configurée." },
        503,
      );
    }
    const dailyHeaders = {
      Authorization: `Bearer ${dailyKey}`,
      "Content-Type": "application/json",
    };

    if (action === "end") {
      if (!isProvider) {
        await logRoomEvent({
          ...baseEvent,
          event_type: "access_denied",
          reason: "end_requires_provider",
          actor_role: actorRole,
        });
        return json({ error: "forbidden" }, 403);
      }
      await fetch(`${DAILY_API_URL}/rooms/${session.daily_room_name}`, {
        method: "DELETE",
        headers: dailyHeaders,
      }).catch(() => undefined);
      const endedAt = new Date().toISOString();
      await admin
        .from("telemedicine_sessions")
        .update({ status: "completed", actual_end: endedAt, updated_at: endedAt })
        .eq("id", sessionId);
      await logRoomEvent({
        ...baseEvent,
        event_type: "room_closed",
        reason: "ended_by_provider",
        actor_role: actorRole,
        actual_end: endedAt,
      });
      return json({ ok: true });
    }


    const { data: settings } = await admin
      .from("telemedicine_settings")
      .select("*")
      .eq("clinic_id", session.clinic_id)
      .maybeSingle();

    // ---- Token / room lifetime: bounded by the scheduled slot ----
    const GRACE_BEFORE_MIN = 10; // early join window
    const GRACE_AFTER_MIN = 15; // overtime buffer
    const maxMinutes = Math.min(Math.max(settings?.max_session_duration_minutes ?? 30, 15), 240);
    const nowSec = Math.floor(Date.now() / 1000);

    const startSec = session.scheduled_start
      ? Math.floor(new Date(session.scheduled_start).getTime() / 1000)
      : nowSec;
    const scheduledEndSec = session.scheduled_end
      ? Math.floor(new Date(session.scheduled_end).getTime() / 1000)
      : startSec + maxMinutes * 60;
    const endSec = Math.min(scheduledEndSec, startSec + maxMinutes * 60);

    const nbf = startSec - GRACE_BEFORE_MIN * 60;
    const exp = endSec + GRACE_AFTER_MIN * 60;

    const roomExpIso = new Date(exp * 1000).toISOString();

    if (nowSec < nbf) {
      await logRoomEvent({
        ...baseEvent,
        event_type: "access_denied",
        reason: "too_early",
        actor_role: actorRole,
        room_exp: roomExpIso,
        details: { opens_at: new Date(nbf * 1000).toISOString() },
      });
      return json(
        { error: "too_early", message: "La salle ouvre 10 minutes avant l'heure du rendez-vous.", opens_at: new Date(nbf * 1000).toISOString() },
        403,
      );
    }
    if (nowSec >= exp) {
      await logRoomEvent({
        ...baseEvent,
        event_type: "room_expired",
        reason: "slot_over",
        actor_role: actorRole,
        room_exp: roomExpIso,
      });
      return json({ error: "expired", message: "Le créneau de cette téléconsultation est terminé." }, 403);
    }


    // Ensure the Daily room exists
    let roomUrl = session.daily_room_url as string | null;
    const roomRes = await fetch(`${DAILY_API_URL}/rooms/${session.daily_room_name}`, {
      headers: dailyHeaders,
    });

    if (roomRes.ok) {
      const room = await roomRes.json();
      roomUrl = room.url;
      // Re-assert the lifetime on an existing room so it always closes with the slot
      if (room?.config?.exp !== exp || room?.config?.eject_at_room_exp !== true) {
        const patchRes = await fetch(`${DAILY_API_URL}/rooms/${session.daily_room_name}`, {
          method: "POST",
          headers: dailyHeaders,
          body: JSON.stringify({
            properties: { nbf, exp, eject_at_room_exp: true, max_participants: 2 },
          }),
        });
        if (!patchRes.ok) {
          console.error("Daily room exp update failed", await patchRes.text());
        } else {
          await logRoomEvent({
            ...baseEvent,
            event_type: "room_expiry_updated",
            reason: "lifetime_realigned_on_slot",
            actor_role: actorRole,
            room_exp: roomExpIso,
            details: { previous_exp: room?.config?.exp ?? null },
          });
        }
      }
    } else {

      await roomRes.text();
      const createRes = await fetch(`${DAILY_API_URL}/rooms`, {
        method: "POST",
        headers: dailyHeaders,
        body: JSON.stringify({
          name: session.daily_room_name,
          privacy: "private",
          properties: {
            enable_chat: settings?.enable_chat ?? true,
            enable_screenshare: settings?.enable_screen_sharing ?? true,
            enable_recording: settings?.enable_recording ? "cloud" : false,
            enable_knocking: settings?.enable_waiting_room ?? true,
            max_participants: 2,
            nbf,
            exp,
            eject_at_room_exp: true,
          },
        }),
      });
      if (!createRes.ok) {
        const detail = await createRes.text();
        console.error("Daily room creation failed", createRes.status, detail);
        await logRoomEvent({
          ...baseEvent,
          event_type: "room_creation_failed",
          reason: "daily_api_error",
          actor_role: actorRole,
          details: { status: createRes.status },
        });
        return json({ error: "Création de la salle vidéo impossible", detail }, 502);
      }
      const room = await createRes.json();
      roomUrl = room.url;
      await logRoomEvent({
        ...baseEvent,
        event_type: "room_created",
        reason: "first_join",
        actor_role: actorRole,
        room_exp: roomExpIso,
        details: { nbf: new Date(nbf * 1000).toISOString(), max_participants: 2 },
      });
    }


    const tokenRes = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
      method: "POST",
      headers: dailyHeaders,
      body: JSON.stringify({
        properties: {
          room_name: session.daily_room_name,
          nbf,
          exp,
          eject_at_token_exp: true,
          is_owner: isProvider,
          user_id: userId,
          enable_recording: isProvider && settings?.enable_recording ? "cloud" : false,
        },
      }),
    });

    if (!tokenRes.ok) {
      const detail = await tokenRes.text();
      console.error("Daily token creation failed", tokenRes.status, detail);
      return json({ error: "Jeton d'accès vidéo indisponible", detail }, 502);
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
    await admin.from("telemedicine_sessions").update(updates).eq("id", sessionId);

    await logRoomEvent({
      ...baseEvent,
      event_type: "join_granted",
      reason: "token_issued",
      actor_role: actorRole,
      room_exp: roomExpIso,
      details: { is_owner: isProvider, token_exp: roomExpIso },
    });


    return json({
      room_url: roomUrl,
      token: tokenData.token,
      is_owner: isProvider,
      permissions: {
        can_record: settings?.enable_recording ?? false,
        can_screen_share: settings?.enable_screen_sharing ?? true,
        can_chat: settings?.enable_chat ?? true,
      },
    });
  } catch (e) {
    console.error("telemedicine-room error", e);
    return json({ error: e instanceof Error ? e.message : "unknown_error" }, 500);
  }
});
