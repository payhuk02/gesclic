import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type WorkflowGraph = {
  nodes?: Array<{ id: string; type: string; config?: Record<string, unknown> }>;
  edges?: Array<{ source: string; target: string }>;
};

async function logEvent(
  admin: ReturnType<typeof createClient>,
  executionId: string,
  level: string,
  message: string,
  nodeId?: string,
  data?: Record<string, unknown>,
) {
  const { error } = await admin.rpc("log_workflow_event", {
    p_execution_id: executionId,
    p_level: level,
    p_message: message,
    p_node_id: nodeId ?? null,
    p_data: data ?? {},
  });
  if (error) console.error("log_workflow_event failed", error.message);
}

async function sendNotification(
  admin: ReturnType<typeof createClient>,
  opts: {
    clinicId: string;
    workflowId: string;
    triggeredBy: string;
    title: string;
    message: string;
    link: string;
    target: string;
  },
): Promise<number> {
  const rows: Array<Record<string, unknown>> = [];

  if (opts.target === "clinic_admins") {
    const { data: admins } = await admin
      .from("clinic_members")
      .select("user_id")
      .eq("clinic_id", opts.clinicId)
      .eq("role", "admin")
      .eq("is_active", true);

    for (const row of admins ?? []) {
      if (row.user_id) {
        rows.push({
          user_id: row.user_id,
          clinic_id: opts.clinicId,
          type: "workflow",
          title: opts.title,
          message: opts.message,
          link: opts.link,
          related_id: opts.workflowId,
          related_type: "workflow",
        });
      }
    }
  } else {
    rows.push({
      user_id: opts.triggeredBy,
      clinic_id: opts.clinicId,
      type: "workflow",
      title: opts.title,
      message: opts.message,
      link: opts.link,
      related_id: opts.workflowId,
      related_type: "workflow",
    });
  }

  if (rows.length === 0) return 0;

  const { error } = await admin.from("notifications").insert(rows);
  if (error) throw new Error(`Notification impossible : ${error.message}`);
  return rows.length;
}

async function executeNode(
  admin: ReturnType<typeof createClient>,
  node: { id: string; type: string; config?: Record<string, unknown> },
  ctx: {
    clinicId: string;
    workflowId: string;
    triggeredBy: string;
  },
): Promise<Record<string, unknown>> {
  const actionType = node.config?.type;
  if (actionType === "notification") {
    const count = await sendNotification(admin, {
      clinicId: ctx.clinicId,
      workflowId: ctx.workflowId,
      triggeredBy: ctx.triggeredBy,
      title: String(node.config?.title ?? "Notification workflow"),
      message: String(node.config?.message ?? ""),
      link: String(node.config?.link ?? "/dashboard"),
      target: String(node.config?.target ?? "trigger_user"),
    });
    return { notification_sent: true, recipients: count };
  }
  return {};
}

function nextNodeId(graph: WorkflowGraph, currentId: string): string | undefined {
  const edge = graph.edges?.find((e) => e.source === currentId);
  return edge?.target;
}

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

    const { data: executionId, error: execError } = await admin.rpc("create_workflow_execution", {
      p_workflow_id: workflowId,
      p_trigger_type: "manual",
      p_trigger_data: {},
      p_input_data: body.inputData ?? {},
      p_triggered_by: userId,
    });

    if (execError || !executionId) {
      return json({ error: "execution_create_failed", message: execError?.message }, 500);
    }

    const graph = (workflow.definition ?? { nodes: [], edges: [] }) as WorkflowGraph;
    let current = graph.nodes?.find((n) => n.type === "trigger") ?? graph.nodes?.[0];
    let output: Record<string, unknown> = { ...(body.inputData ?? {}) };

    try {
      while (current) {
        await logEvent(admin, executionId, "info", `Exécution du nœud ${current.id}`, current.id);

        if (current.type !== "trigger") {
          const result = await executeNode(admin, current, {
            clinicId: workflow.clinic_id,
            workflowId: workflow.id,
            triggeredBy: userId,
          });
          output = { ...output, ...result };
        }

        const nextId = nextNodeId(graph, current.id);
        current = nextId ? graph.nodes?.find((n) => n.id === nextId) : undefined;
      }

      await admin.rpc("complete_workflow_execution", {
        p_execution_id: executionId,
        p_status: "completed",
        p_output_data: output,
      });

      return json({
        executionId,
        status: "completed",
        output,
        workflow_name: workflow.name,
      });
    } catch (runError) {
      const message = runError instanceof Error ? runError.message : "Erreur d'exécution";
      await admin.rpc("complete_workflow_execution", {
        p_execution_id: executionId,
        p_status: "failed",
        p_error_message: message,
        p_error_details: { error: String(runError) },
      });
      return json({ error: "execution_failed", message, executionId }, 500);
    }
  } catch (e) {
    console.error("workflow-run error", e);
    return json({ error: e instanceof Error ? e.message : "unknown_error" }, 500);
  }
});
