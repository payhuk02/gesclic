import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { runWorkflow } from "../_shared/workflow-engine.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type PendingRun = {
  id: string;
  workflow_id: string;
  clinic_id: string;
  trigger_type: string;
  trigger_data: Record<string, unknown>;
  input_data: Record<string, unknown>;
  triggered_by: string | null;
};

type DueSchedule = {
  id: string;
  workflow_id: string;
  cron_expression: string;
  workflow_definitions: {
    id: string;
    clinic_id: string;
    status: string;
    definition: Record<string, unknown> | null;
    name: string;
  };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let eventsProcessed = 0;
    let schedulesProcessed = 0;
    const errors: string[] = [];

    const { data: pendingRuns, error: claimError } = await admin.rpc("claim_workflow_pending_runs", {
      p_limit: 20,
    });

    if (claimError) {
      return json({ error: claimError.message }, 500);
    }

    for (const run of (pendingRuns ?? []) as PendingRun[]) {
      try {
        const { data: workflow, error: wfError } = await admin
          .from("workflow_definitions")
          .select("id, clinic_id, status, definition, name")
          .eq("id", run.workflow_id)
          .maybeSingle();

        if (wfError || !workflow || workflow.status !== "active") {
          await admin.rpc("complete_workflow_pending_run", {
            p_run_id: run.id,
            p_status: "failed",
            p_error_message: "Workflow inactif ou introuvable",
          });
          continue;
        }

        const result = await runWorkflow({
          admin,
          workflow,
          triggerType: run.trigger_type as "event",
          triggerData: run.trigger_data ?? {},
          inputData: run.input_data ?? {},
          triggeredBy: run.triggered_by,
        });

        await admin.rpc("complete_workflow_pending_run", {
          p_run_id: run.id,
          p_status: result.status === "completed" ? "completed" : "failed",
          p_error_message: result.error ?? null,
        });

        if (result.status === "completed") eventsProcessed++;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        errors.push(message);
        await admin.rpc("complete_workflow_pending_run", {
          p_run_id: run.id,
          p_status: "failed",
          p_error_message: message,
        });
      }
    }

    const nowIso = new Date().toISOString();
    const { data: dueSchedules, error: schedError } = await admin
      .from("workflow_schedules")
      .select("id, workflow_id, cron_expression, workflow_definitions!inner(id, clinic_id, status, definition, name)")
      .eq("is_active", true)
      .lte("next_run_at", nowIso)
      .limit(20);

    if (schedError) {
      errors.push(schedError.message);
    } else {
      for (const sched of (dueSchedules ?? []) as DueSchedule[]) {
        const wf = sched.workflow_definitions;
        if (!wf || wf.status !== "active") {
          await admin.from("workflow_schedules").update({ is_active: false }).eq("id", sched.id);
          continue;
        }

        try {
          const result = await runWorkflow({
            admin,
            workflow: wf,
            triggerType: "schedule",
            triggerData: { cron: sched.cron_expression },
            inputData: {},
            triggeredBy: null,
          });

          await admin.rpc("update_workflow_schedule", { schedule_id_param: sched.id });

          if (result.status === "completed") schedulesProcessed++;
          else if (result.error) errors.push(result.error);
        } catch (e) {
          errors.push(e instanceof Error ? e.message : String(e));
          await admin.rpc("update_workflow_schedule", { schedule_id_param: sched.id });
        }
      }
    }

    try {
      await admin.rpc("refresh_workflow_analytics");
    } catch (e) {
      console.warn("refresh_workflow_analytics skipped", e);
    }

    console.log("workflow-scheduler", { eventsProcessed, schedulesProcessed, errors: errors.length });
    return json({ eventsProcessed, schedulesProcessed, errors });
  } catch (e) {
    console.error("workflow-scheduler error", e);
    return json({ error: e instanceof Error ? e.message : "unknown_error" }, 500);
  }
});
