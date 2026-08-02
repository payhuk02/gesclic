import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { runWorkflow } from "../_shared/workflow-engine.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

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

    let body: { workflowId?: string; inputData?: Record<string, unknown> };
    try {
      body = await req.json();
    } catch {
      return json({ error: "invalid_json" }, 400);
    }

    const workflowId = typeof body.workflowId === "string" ? body.workflowId : "";
    if (!/^[0-9a-f-]{36}$/i.test(workflowId)) {
      return json({ error: "invalid_workflow_id" }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: workflow, error: wfError } = await admin
      .from("workflow_definitions")
      .select("id, clinic_id, status, definition, name")
      .eq("id", workflowId)
      .maybeSingle();

    if (wfError || !workflow) {
      return json({ error: "not_found", message: "Workflow introuvable." }, 404);
    }

    if (workflow.status !== "active") {
      return json({ error: "inactive", message: "Le workflow doit être actif pour être exécuté." }, 409);
    }

    const { data: member } = await admin
      .from("clinic_members")
      .select("id")
      .eq("clinic_id", workflow.clinic_id)
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (!member) {
      return json({ error: "forbidden", message: "Accès refusé à ce workflow." }, 403);
    }

    const result = await runWorkflow({
      admin,
      workflow,
      triggerType: "manual",
      triggerData: {},
      inputData: body.inputData ?? {},
      triggeredBy: userId,
    });

    if (result.status === "failed") {
      return json({ error: "execution_failed", message: result.error, executionId: result.executionId }, 500);
    }

    return json({
      executionId: result.executionId,
      status: result.status,
      output: result.output,
      workflow_name: workflow.name,
    });
  } catch (e) {
    console.error("workflow-run error", e);
    return json({ error: e instanceof Error ? e.message : "unknown_error" }, 500);
  }
});
