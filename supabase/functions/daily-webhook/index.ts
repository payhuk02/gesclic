import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const DAILY_API_URL = "https://api.daily.co/v1";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function base64Decode(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function verifyDailySignature(
  req: Request,
  rawBody: string,
): Promise<boolean> {
  const hmacSecret = Deno.env.get("DAILY_WEBHOOK_HMAC")?.trim();
  if (!hmacSecret) {
    console.warn("daily-webhook: DAILY_WEBHOOK_HMAC not configured");
    return false;
  }

  const timestamp = req.headers.get("X-Webhook-Timestamp");
  const signature = req.headers.get("X-Webhook-Signature");
  if (!timestamp || !signature) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    base64Decode(hmacSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const message = new TextEncoder().encode(`${timestamp}.${rawBody}`);
  const digest = await crypto.subtle.sign("HMAC", key, message);
  const computed = btoa(String.fromCharCode(...new Uint8Array(digest)));

  return timingSafeEqual(computed, signature);
}

async function fetchRecordingDownloadLink(
  recordingId: string,
  dailyKey: string,
): Promise<{ downloadLink: string | null; expires: number | null }> {
  const res = await fetch(
    `${DAILY_API_URL}/recordings/${encodeURIComponent(recordingId)}/access-link`,
    { headers: { Authorization: `Bearer ${dailyKey}` } },
  );

  if (!res.ok) {
    console.error("daily access-link failed", recordingId, res.status, await res.text());
    return { downloadLink: null, expires: null };
  }

  const data = await res.json();
  return {
    downloadLink: typeof data.download_link === "string" ? data.download_link : null,
    expires: typeof data.expires === "number" ? data.expires : null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (req.method === "GET") {
    return json({ ok: true, service: "daily-webhook" });
  }

  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  try {
    const rawBody = await req.text();
    let body: Record<string, unknown> = {};
    try {
      body = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      return json({ error: "invalid_json" }, 400);
    }

    // Daily verification probe when creating the webhook
    if (body.test === "test") {
      return json({ ok: true, test: true });
    }

    const signatureOk = await verifyDailySignature(req, rawBody);
    if (!signatureOk) {
      console.warn("daily-webhook: invalid or missing HMAC signature");
      return json({ error: "invalid_signature" }, 401);
    }

    const eventType = String(body.type ?? body.event ?? "");

    if (!eventType.includes("recording")) {
      return json({ ok: true, skipped: true, reason: "not_a_recording_event" });
    }

    const payload = (body.payload ?? body) as Record<string, unknown>;
    const roomName = (payload.room_name ?? payload.roomName) as string | undefined;
    const recordingId = (
      payload.recording_id ?? payload.recordingId ?? body.id
    ) as string | undefined;
    const eventId = body.id as string | undefined;

    if (!roomName) {
      console.warn("daily-webhook: missing room_name", { eventType });
      return json({ ok: true, skipped: true, reason: "missing_room_name" });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: session } = await admin
      .from("telemedicine_sessions")
      .select("id, clinic_id")
      .eq("daily_room_name", roomName)
      .maybeSingle();

    if (!session) {
      console.warn("daily-webhook: no session for room", roomName);
      return json({ ok: true, skipped: true, reason: "session_not_found" });
    }

    const now = new Date().toISOString();

    if (eventType === "recording.error") {
      await admin
        .from("telemedicine_sessions")
        .update({
          recording_status: "none",
          updated_at: now,
        })
        .eq("id", session.id);

      await admin.from("telemedicine_room_events").insert({
        session_id: session.id,
        clinic_id: session.clinic_id,
        room_name: roomName,
        event_type: "recording_error",
        reason: eventType,
        actor_role: "system",
        details: { recording_id: recordingId ?? null, event_id: eventId ?? null, payload },
      });

      return json({ ok: true, session_id: session.id, status: "error_logged" });
    }

    const dailyKey = Deno.env.get("DAILY_API_KEY")?.trim();
    if (!dailyKey) {
      console.error("daily-webhook: DAILY_API_KEY missing");
      return json({ error: "DAILY_API_KEY_MISSING" }, 503);
    }

    if (!recordingId) {
      console.warn("daily-webhook: missing recording_id", { eventType, roomName });
      return json({ ok: true, skipped: true, reason: "missing_recording_id" });
    }

    const { downloadLink, expires } = await fetchRecordingDownloadLink(recordingId, dailyKey);

    if (!downloadLink) {
      console.error("daily-webhook: no download_link for recording", recordingId);
      return json({ error: "download_link_unavailable" }, 502);
    }

    await admin
      .from("telemedicine_sessions")
      .update({
        recording_url: downloadLink,
        recording_status: "available",
        updated_at: now,
      })
      .eq("id", session.id);

    await admin.from("telemedicine_room_events").insert({
      session_id: session.id,
      clinic_id: session.clinic_id,
      room_name: roomName,
      event_type: "recording_available",
      reason: eventType,
      actor_role: "system",
      details: {
        recording_id: recordingId,
        event_id: eventId ?? null,
        download_link_expires: expires,
        duration: payload.duration ?? null,
        status: payload.status ?? null,
      },
    });

    console.log("daily-webhook: recording saved", { sessionId: session.id, recordingId });
    return json({ ok: true, session_id: session.id, recording_id: recordingId });
  } catch (e) {
    console.error("daily-webhook error", e);
    return json({ error: e instanceof Error ? e.message : "unknown_error" }, 500);
  }
});
