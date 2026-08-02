import type { WorkflowGraph, WorkflowNode } from '@/types/phase2';

export type WorkflowNotificationTarget = 'trigger_user' | 'clinic_admins';

export interface WorkflowEditorStep {
  id: string;
  title: string;
  message: string;
  link?: string;
  target: WorkflowNotificationTarget;
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

/** Extract notification steps from a workflow graph for the simple editor */
export function graphToSteps(definition: WorkflowGraph | null | undefined): WorkflowEditorStep[] {
  if (!definition?.nodes?.length) return [emptyWorkflowStep()];

  const steps = definition.nodes
    .filter((n) => n.type === 'action' && n.config?.type === 'notification')
    .map((n) => ({
      id: n.id,
      title: String(n.config.title ?? ''),
      message: String(n.config.message ?? ''),
      link: n.config.link ? String(n.config.link) : '/dashboard',
      target: (n.config.target === 'clinic_admins' ? 'clinic_admins' : 'trigger_user') as WorkflowNotificationTarget,
    }));

  return steps.length > 0 ? steps : [emptyWorkflowStep()];
}

/** Build a linear workflow graph from simple notification steps */
export function stepsToGraph(steps: WorkflowEditorStep[]): WorkflowGraph {
  const nodes: WorkflowNode[] = [
    {
      id: 'trigger',
      type: 'trigger',
      position: { x: 0, y: 0 },
      config: { type: 'manual' },
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
    triggers: [{ id: 'trigger', type: 'manual', config: { type: 'manual' } }],
  };
}
