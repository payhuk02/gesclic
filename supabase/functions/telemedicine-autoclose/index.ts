import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const DAILY_API_URL = "https://api.daily.co/v1";
const GRACE_AFTER_MIN = 15;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const cutoff = new Date(Date.now() - GRACE_AFTER_MIN * 60_000).toISOString();

    const { data: sessions, error } = await admin
      .from("telemedicine_sessions")
      .select("id, clinic_id, daily_room_name, scheduled_start, scheduled_end, actual_start, status")
      .in("status", ["scheduled", "waiting", "in_progress"])
      .lt("scheduled_end", cutoff)
      .limit(200);

    if (error) return json({ error: error.message }, 500);
    if (!sessions?.length) return json({ closed: 0 });

    const dailyKey = Deno.env.get("DAILY_API_KEY");
    const nowIso = new Date().toISOString();
    let closed = 0;

    for (const s of sessions) {
      let roomDeleted = false;
      if (dailyKey && s.daily_room_name) {
        const del = await fetch(`${DAILY_API_URL}/rooms/${s.daily_room_name}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${dailyKey}` },
        }).catch(() => undefined);
        roomDeleted = !!del?.ok;
      }
      const newStatus = s.actual_start ? "completed" : "no_show";
      await admin
        .from("telemedicine_sessions")
        .update({
          status: newStatus,
          actual_end: nowIso,
          updated_at: nowIso,
        })
        .eq("id", s.id);

      const { error: logError } = await admin.from("telemedicine_room_events").insert({
        session_id: s.id,
        clinic_id: s.clinic_id,
        room_name: s.daily_room_name,
        event_type: "room_auto_closed",
        reason: s.actual_start ? "slot_over_after_grace" : "no_show_after_grace",
        actor_role: "system",
        scheduled_start: s.scheduled_start,
        scheduled_end: s.scheduled_end,
        actual_end: nowIso,
        details: {
          previous_status: s.status,
          new_status: newStatus,
          grace_minutes: GRACE_AFTER_MIN,
          daily_room_deleted: roomDeleted,
        },
      });
      if (logError) console.error("room event log failed", logError.message);

      closed++;
    }


    console.log("telemedicine-autoclose closed sessions", closed);
    return json({ closed });
  } catch (e) {
    console.error("telemedicine-autoclose error", e);
    return json({ error: e instanceof Error ? e.message : "unknown_error" }, 500);
  }
});
