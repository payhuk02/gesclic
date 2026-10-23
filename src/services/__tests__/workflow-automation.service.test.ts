// Workflow Automation Service Unit Tests
// Tests for critical workflow service methods

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkflowAutomationService } from '../workflow-automation.service';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

const mockedSupabase = vi.mocked(supabase);

describe('WorkflowAutomationService', () => {
  let workflowService: WorkflowAutomationService;

  beforeEach(() => {
    workflowService = new WorkflowAutomationService();
    vi.clearAllMocks();
  });

  describe('Workflow CRUD Operations', () => {
    it('should create workflow definition', async () => {
      const clinicId = 'clinic-123';
      const userId = 'user-123';
      const name = 'Test Workflow';
      const description = 'Test Description';
      const category = 'patient_onboarding';
      const definition = {
        nodes: [{ id: 'node1', type: 'trigger' }],
        edges: [{ source: 'node1', target: 'node2' }],
        triggers: [{ type: 'manual' }],
      };

      const mockData = { id: 'workflow-1', name, status: 'draft' };
      (mockedSupabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        }),
      });

      const result = await workflowService.createWorkflow(
        clinicId,
        userId,
        name,
        description,
        category,
        definition as any,
      );

      expect(result).toEqual(mockData);
    });

    it('should update workflow', async () => {
      const workflowId = 'workflow-123';
      const updates = { name: 'Updated Name', status: 'active' };

      (mockedSupabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      await workflowService.updateWorkflow(workflowId, updates);

      expect(mockedSupabase.from).toHaveBeenCalled();
    });

    it('should delete workflow', async () => {
      const workflowId = 'workflow-123';

      (mockedSupabase.from as any).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      await workflowService.deleteWorkflow(workflowId);

      expect(mockedSupabase.from).toHaveBeenCalled();
    });
  });

  describe('Workflow Status Management', () => {
    it('should activate workflow', async () => {
      const workflowId = 'workflow-123';
      const mockWorkflow = {
        id: workflowId,
        definition: { nodes: [], edges: [], triggers: [] },
      };

      (mockedSupabase.from as any).mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockWorkflow, error: null }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }));

      await workflowService.activateWorkflow(workflowId);

      expect(mockedSupabase.from).toHaveBeenCalled();
    });

    it('should pause workflow', async () => {
      const workflowId = 'workflow-123';

      (mockedSupabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      await workflowService.pauseWorkflow(workflowId);

      expect(mockedSupabase.from).toHaveBeenCalled();
    });

    it('should archive workflow', async () => {
      const workflowId = 'workflow-123';

      (mockedSupabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      await workflowService.archiveWorkflow(workflowId);

      expect(mockedSupabase.from).toHaveBeenCalled();
    });
  });

  describe('Workflow Execution', () => {
    it('should execute workflow and return execution ID', async () => {
      const workflowId = 'workflow-123';
      const userId = 'user-123';
      const inputData = { test: 'data' };
      const executionId = 'execution-123';

      (mockedSupabase.functions.invoke as any).mockResolvedValue({
        data: { executionId },
        error: null,
      });

      const result = await workflowService.executeWorkflow(workflowId, userId, inputData);

      expect(result).toBe(executionId);
    });

    it('should cancel workflow execution', async () => {
      const executionId = 'execution-123';

      (mockedSupabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      await workflowService.cancelExecution(executionId);

      expect(mockedSupabase.from).toHaveBeenCalled();
    });
  });

  describe('Workflow Variables', () => {
    it('should set workflow variable', async () => {
      const workflowId = 'workflow-123';
      const key = 'test_key';
      const value = 'test_value';
      const type = 'string';

      (mockedSupabase.from as any).mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      });

      await workflowService.setVariable(workflowId, key, value, type);

      expect(mockedSupabase.from).toHaveBeenCalled();
    });

    it('should get workflow variable', async () => {
      const workflowId = 'workflow-123';
      const key = 'test_key';
      const value = 'test_value';

      (mockedSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { value },
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await workflowService.getVariable(workflowId, key);

      expect(result).toBe(value);
    });

    it('should delete workflow variable', async () => {
      const workflowId = 'workflow-123';
      const key = 'test_key';

      (mockedSupabase.from as any).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      });

      await workflowService.deleteVariable(workflowId, key);

      expect(mockedSupabase.from).toHaveBeenCalled();
    });
  });

  describe('Workflow Templates', () => {
    it('should get workflow templates', async () => {
      const mockTemplates = [
        { id: 'template-1', name: 'Template 1', category: 'onboarding' },
        { id: 'template-2', name: 'Template 2', category: 'automation' },
      ];

      (mockedSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockTemplates,
              error: null,
            }),
          }),
        }),
      });

      const result = await workflowService.getTemplates();

      expect(result).toEqual(mockTemplates);
    });

    it('should create workflow from template', async () => {
      const templateId = 'template-123';
      const clinicId = 'clinic-123';
      const userId = 'user-123';
      const name = 'New Workflow from Template';

      const mockTemplate = {
        id: templateId,
        name: 'Template Name',
        description: 'Template Description',
        category: 'onboarding',
        definition: {
          nodes: [{ id: 'node1', type: 'trigger' }],
          edges: [],
          triggers: [{ type: 'manual' }],
        },
      };

      const mockWorkflow = { id: 'workflow-1', name };

      (mockedSupabase.from as any).mockImplementation((table: string) => {
        if (table === 'workflow_templates') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockTemplate,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockWorkflow,
                error: null,
              }),
            }),
          }),
        };
      });

      (mockedSupabase.rpc as any).mockResolvedValue({ error: null });

      const result = await workflowService.createFromTemplate(templateId, clinicId, userId, name);

      expect(result).toEqual(mockWorkflow);
    });
  });

  describe('Workflow Analytics', () => {
    it('should get workflow analytics', async () => {
      const workflowId = 'workflow-123';
      const days = 30;

      const mockAnalytics = {
        total_executions: 100,
        successful_executions: 95,
        failed_executions: 5,
        success_rate: 95,
        avg_duration_seconds: 45.5,
      };

      (mockedSupabase.rpc as any).mockResolvedValue({
        data: [mockAnalytics],
        error: null,
      });

      const result = await workflowService.getWorkflowAnalytics(workflowId, days);

      expect(result).toEqual(mockAnalytics);
    });
  });
});
