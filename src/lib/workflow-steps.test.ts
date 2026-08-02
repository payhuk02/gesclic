import { describe, it, expect } from 'vitest';
import {
  graphToSteps,
  normalizeTemplateDefinition,
  getScheduleCron,
  getEventType,
  stepsToGraph,
  NOTIFICATION_TEMPLATES,
} from './workflow-steps';
import type { WorkflowGraph } from '@/types/phase2';

describe('workflow-steps', () => {
  it('resolves notification templates in graphToSteps', () => {
    const definition: WorkflowGraph = {
      nodes: [
        { id: 'trigger', type: 'trigger', position: { x: 0, y: 0 }, config: { type: 'event', event: 'patient_created' } },
        { id: 'action', type: 'action', position: { x: 0, y: 80 }, config: { type: 'notification', template: 'patient_welcome' } },
      ],
      edges: [{ id: 'e1', source: 'trigger', target: 'action' }],
      triggers: [{ id: 'trigger', type: 'event', config: { event: 'patient_created' } }],
    };

    const steps = graphToSteps(definition);
    expect(steps).toHaveLength(1);
    expect(steps[0].title).toBe(NOTIFICATION_TEMPLATES.patient_welcome.title);
    expect(steps[0].message).toBe(NOTIFICATION_TEMPLATES.patient_welcome.message);
    expect(steps[0].target).toBe('clinic_admins');
  });

  it('normalizes template definition into editable steps', () => {
    const template: WorkflowGraph = {
      nodes: [
        { id: 'trigger', type: 'trigger', position: { x: 0, y: 0 }, config: { type: 'event', event: 'payment_completed' } },
        { id: 'action', type: 'action', position: { x: 0, y: 80 }, config: { type: 'notification', template: 'payment_confirmation' } },
      ],
      edges: [{ id: 'e1', source: 'trigger', target: 'action' }],
      triggers: [{ id: 'trigger', type: 'event', config: { event: 'payment_completed' } }],
    };

    const normalized = normalizeTemplateDefinition(template);
    const steps = graphToSteps(normalized);
    expect(steps[0].title).toBe(NOTIFICATION_TEMPLATES.payment_confirmation.title);
    expect(getEventType(normalized)).toBe('payment_completed');
  });

  it('detects schedule cron from definition', () => {
    const definition: WorkflowGraph = {
      nodes: [
        { id: 'trigger', type: 'trigger', position: { x: 0, y: 0 }, config: { type: 'schedule', cron: '0 9 * * *' } },
        { id: 'action', type: 'action', position: { x: 0, y: 80 }, config: { type: 'notification', title: 'Rappel', message: 'RDV demain' } },
      ],
      edges: [{ id: 'e1', source: 'trigger', target: 'action' }],
      triggers: [{ id: 'trigger', type: 'schedule', config: { cron: '0 9 * * *' } }],
    };

    expect(getScheduleCron(definition)).toBe('0 9 * * *');
    const roundtrip = stepsToGraph(graphToSteps(definition), { type: 'schedule', cron: '0 9 * * *' });
    expect(roundtrip.triggers[0].type).toBe('schedule');
  });
});
