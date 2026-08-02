import type { WorkflowGraph, WorkflowNode } from '@/types/phase2';

export type WorkflowNotificationTarget = 'trigger_user' | 'clinic_admins';

export interface WorkflowEditorStep {
  id: string;
  title: string;
  message: string;
  link?: string;
  target: WorkflowNotificationTarget;
}

export const NOTIFICATION_TEMPLATES: Record<
  string,
  { title: string; message: string; link: string; target: WorkflowNotificationTarget }
> = {
  appointment_reminder: {
    title: 'Rappel rendez-vous',
    message: 'Un rappel de rendez-vous a été envoyé. Consultez le planning pour les détails.',
    link: '/appointments',
    target: 'clinic_admins',
  },
  patient_welcome: {
    title: 'Nouveau patient',
    message: 'Un nouveau patient a été enregistré dans votre clinique.',
    link: '/patients',
    target: 'clinic_admins',
  },
  payment_confirmation: {
    title: 'Paiement reçu',
    message: 'Un paiement a été enregistré avec succès.',
    link: '/payments',
    target: 'clinic_admins',
  },
};

function resolveNotificationConfig(config: Record<string, unknown> | undefined) {
  const templateKey = typeof config?.template === 'string' ? config.template : '';
  const preset = templateKey ? NOTIFICATION_TEMPLATES[templateKey] : undefined;
  return {
    title: String(config?.title ?? preset?.title ?? ''),
    message: String(config?.message ?? preset?.message ?? ''),
    link: String(config?.link ?? preset?.link ?? '/dashboard'),
    target: (config?.target === 'clinic_admins' ? 'clinic_admins' : preset?.target ?? 'trigger_user') as WorkflowNotificationTarget,
  };
}

export function emptyWorkflowStep(): WorkflowEditorStep {
  return {
    id: crypto.randomUUID(),
    title: '',
    message: '',
    link: '/dashboard',
    target: 'trigger_user',
  };
}

/** Normalize seeded template graphs into editable notification steps */
export function normalizeTemplateDefinition(definition: WorkflowGraph): WorkflowGraph {
  const triggerNode = definition.nodes?.find((n) => n.type === 'trigger');
  const triggerConfig = triggerNode?.config ?? {};
  const triggerType = String(triggerConfig.type ?? triggerNode?.config?.type ?? 'manual');

  const triggers = definition.triggers?.length
    ? definition.triggers
    : triggerNode
      ? [{ id: triggerNode.id, type: triggerType as WorkflowGraph['triggers'][0]['type'], config: triggerConfig }]
      : [{ id: 'trigger', type: 'manual' as const, config: { type: 'manual' } }];

  const steps = graphToSteps(definition);
  const graph = stepsToGraph(steps);
  graph.triggers = triggers;

  if (triggerNode && graph.nodes[0]) {
    graph.nodes[0] = { ...graph.nodes[0], config: triggerConfig };
  }

  return graph;
}

/** Extract notification steps from a workflow graph for the simple editor */
export function graphToSteps(definition: WorkflowGraph | null | undefined): WorkflowEditorStep[] {
  if (!definition?.nodes?.length) return [emptyWorkflowStep()];

  const steps = definition.nodes
    .filter((n) => n.type === 'action' && n.config?.type === 'notification')
    .map((n) => {
      const resolved = resolveNotificationConfig(n.config as Record<string, unknown>);
      return {
        id: n.id,
        ...resolved,
      };
    });

  return steps.length > 0 ? steps : [emptyWorkflowStep()];
}

/** Build a linear workflow graph from simple notification steps */
export function stepsToGraph(steps: WorkflowEditorStep[], triggerConfig?: Record<string, unknown>): WorkflowGraph {
  const triggerType = String(triggerConfig?.type ?? 'manual');
  const nodes: WorkflowNode[] = [
    {
      id: 'trigger',
      type: 'trigger',
      position: { x: 0, y: 0 },
      config: triggerConfig ?? { type: 'manual' },
    },
  ];
  const edges: WorkflowGraph['edges'] = [];
  let prevId = 'trigger';

  steps.forEach((step, index) => {
    const id = step.id || `action-${index}`;
    nodes.push({
      id,
      type: 'action',
      position: { x: 0, y: (index + 1) * 80 },
      config: {
        type: 'notification',
        title: step.title,
        message: step.message,
        link: step.link || '/dashboard',
        target: step.target,
      },
    });
    edges.push({
      id: `edge-${prevId}-${id}`,
      source: prevId,
      target: id,
    });
    prevId = id;
  });

  return {
    nodes,
    edges,
    triggers: [{ id: 'trigger', type: triggerType as WorkflowGraph['triggers'][0]['type'], config: triggerConfig ?? { type: 'manual' } }],
  };
}

export function getScheduleCron(definition: WorkflowGraph | null | undefined): string | null {
  const scheduleTrigger = definition?.triggers?.find((t) => t.type === 'schedule')
    ?? definition?.nodes?.find((n) => n.type === 'trigger' && n.config?.type === 'schedule');
  const cron = scheduleTrigger?.config?.cron;
  return typeof cron === 'string' ? cron : null;
}

export function getEventType(definition: WorkflowGraph | null | undefined): string | null {
  const eventTrigger = definition?.triggers?.find((t) => t.type === 'event')
    ?? definition?.nodes?.find((n) => n.type === 'trigger' && (n.config?.type === 'event' || n.config?.event));
  const event = eventTrigger?.config?.event;
  return typeof event === 'string' ? event : null;
}
