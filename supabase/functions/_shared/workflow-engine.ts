import { createClient } from "npm:@supabase/supabase-js@2";

export type WorkflowGraph = {
  nodes?: Array<{ id: string; type: string; config?: Record<string, unknown> }>;
  edges?: Array<{ source: string; target: string }>;
};

export const NOTIFICATION_TEMPLATES: Record<
  string,
  { title: string; message: string; link: string; target: string }
> = {
  appointment_reminder: {
    title: "Rappel rendez-vous",
    message: "Un rappel de rendez-vous a été envoyé. Consultez le planning pour les détails.",
    link: "/appointments",
    target: "clinic_admins",
  },
  patient_welcome: {
    title: "Nouveau patient",
    message: "Un nouveau patient a été enregistré dans votre clinique.",
    link: "/patients",
    target: "clinic_admins",
  },
  payment_confirmation: {
    title: "Paiement reçu",
    message: "Un paiement a été enregistré avec succès.",
    link: "/payments",
    target: "clinic_admins",
  },
};

type AdminClient = ReturnType<typeof createClient>;

export function resolveNotification(config: Record<string, unknown> | undefined): {
  title: string;
  message: string;
  link: string;
  target: string;
} {
  const templateKey = typeof config?.template === "string" ? config.template : "";
  const preset = templateKey ? NOTIFICATION_TEMPLATES[templateKey] : undefined;

  return {
    title: String(config?.title ?? preset?.title ?? "Notification workflow"),
    message: String(config?.message ?? preset?.message ?? ""),
    link: String(config?.link ?? preset?.link ?? "/dashboard"),
    target: String(config?.target ?? preset?.target ?? "clinic_admins"),
  };
}

function interpolate(text: string, vars: Record<string, unknown>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const val = vars[key];
    return val != null ? String(val) : "";
  });
}

async function logEvent(
  admin: AdminClient,
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
  admin: AdminClient,
  opts: {
    clinicId: string;
    workflowId: string;
    triggeredBy: string | null;
    title: string;
    message: string;
    link: string;
    target: string;
  },
): Promise<number> {
  const rows: Array<Record<string, unknown>> = [];
  const useAdmins = opts.target === "clinic_admins" || !opts.triggeredBy;

  if (useAdmins) {
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
  } else if (opts.triggeredBy) {
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
  admin: AdminClient,
  node: { id: string; type: string; config?: Record<string, unknown> },
  ctx: {
    clinicId: string;
    workflowId: string;
    triggeredBy: string | null;
    inputData: Record<string, unknown>;
  },
): Promise<Record<string, unknown>> {
  const actionType = node.config?.type;
  if (actionType === "notification") {
    const resolved = resolveNotification(node.config);
    const count = await sendNotification(admin, {
      clinicId: ctx.clinicId,
      workflowId: ctx.workflowId,
      triggeredBy: ctx.triggeredBy,
      title: interpolate(resolved.title, ctx.inputData),
      message: interpolate(resolved.message, ctx.inputData),
      link: resolved.link,
      target: resolved.target,
    });
    return { notification_sent: true, recipients: count };
  }
  return {};
}

function nextNodeId(graph: WorkflowGraph, currentId: string): string | undefined {
  const edge = graph.edges?.find((e) => e.source === currentId);
  return edge?.target;
}

export interface RunWorkflowOptions {
  admin: AdminClient;
  workflow: {
    id: string;
    clinic_id: string;
    name: string;
    definition: WorkflowGraph | null;
  };
  triggerType: "manual" | "event" | "schedule" | "webhook";
  triggerData?: Record<string, unknown>;
  inputData?: Record<string, unknown>;
  triggeredBy?: string | null;
}

export interface RunWorkflowResult {
  executionId: string;
  status: "completed" | "failed";
  output: Record<string, unknown>;
  error?: string;
}

export async function runWorkflow(opts: RunWorkflowOptions): Promise<RunWorkflowResult> {
  const { admin, workflow } = opts;
  const inputData = opts.inputData ?? {};
  const triggeredBy = opts.triggeredBy ?? null;

  const { data: executionId, error: execError } = await admin.rpc("create_workflow_execution", {
    p_workflow_id: workflow.id,
    p_trigger_type: opts.triggerType,
    p_trigger_data: opts.triggerData ?? {},
    p_input_data: inputData,
    p_triggered_by: triggeredBy,
  });

  if (execError || !executionId) {
    throw new Error(execError?.message ?? "Impossible de créer l'exécution");
  }

  const graph = (workflow.definition ?? { nodes: [], edges: [] }) as WorkflowGraph;
  let current = graph.nodes?.find((n) => n.type === "trigger") ?? graph.nodes?.[0];
  let output: Record<string, unknown> = { ...inputData };

  try {
    while (current) {
      await logEvent(admin, executionId, "info", `Exécution du nœud ${current.id}`, current.id);

      if (current.type !== "trigger") {
        const result = await executeNode(admin, current, {
          clinicId: workflow.clinic_id,
          workflowId: workflow.id,
          triggeredBy,
          inputData: output,
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

    return { executionId, status: "completed", output };
  } catch (runError) {
    const message = runError instanceof Error ? runError.message : "Erreur d'exécution";
    await admin.rpc("complete_workflow_execution", {
      p_execution_id: executionId,
      p_status: "failed",
      p_error_message: message,
      p_error_details: { error: String(runError) },
    });
    return { executionId, status: "failed", output, error: message };
  }
}
