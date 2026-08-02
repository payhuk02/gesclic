// Workflow Automation Service
// Service layer for Workflow Automation functionality

import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';
import type { 
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowLog,
  WorkflowTemplate,
  WorkflowGraph,
  PaginatedResponse
} from '@/types/phase2';
import { stepsToGraph, type WorkflowEditorStep, normalizeTemplateDefinition, getScheduleCron } from '@/lib/workflow-steps';

/** Categories allowed by workflow_definitions.category CHECK constraint */
export const WORKFLOW_CATEGORIES = [
  'appointment',
  'patient',
  'billing',
  'notification',
  'custom',
] as const;

export type WorkflowCategory = (typeof WORKFLOW_CATEGORIES)[number];

export type WorkflowExecutionListItem = WorkflowExecution & {
  workflow_name: string;
};

export class WorkflowAutomationService {
  private formatServiceError(error: unknown, fallback: string): Error {
    if (error && typeof error === 'object') {
      const err = error as { code?: string; message?: string };
      if (err.code === '42501' || err.message?.toLowerCase().includes('policy')) {
        return new Error('Action réservée aux administrateurs de la clinique.');
      }
      if (err.code === '23514') {
        return new Error('Catégorie ou statut invalide pour ce workflow.');
      }
      if (err.message) {
        return new Error(err.message);
      }
    }
    return new Error(fallback);
  }

  private async parseFunctionError(error: unknown, fallback: string): Promise<string> {
    if (error instanceof FunctionsHttpError) {
      try {
        const body = await error.context.json();
        if (typeof body?.message === 'string') return body.message;
        if (typeof body?.error === 'string') return body.error;
      } catch {
        // ignore
      }
    }
    if (error instanceof Error && error.message) return error.message;
    return fallback;
  }

  /**
   * Save simple editor steps as workflow definition
   */
  async saveWorkflowSteps(workflowId: string, steps: WorkflowEditorStep[]): Promise<void> {
    await this.updateWorkflow(workflowId, { definition: stepsToGraph(steps) });
  }

  /**
   * Create workflow definition
   */
  async createWorkflow(
    clinicId: string,
    userId: string,
    name: string,
    description: string,
    category: string,
    definition: WorkflowGraph
  ): Promise<WorkflowDefinition> {
    try {
      const { data, error } = await supabase
        .from('workflow_definitions')
        .insert({
          clinic_id: clinicId,
          created_by: userId,
          name,
          description,
          category,

          definition,

          status: 'draft',
          version: 1
        })
        .select()
        .single();

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('Error creating workflow:', error);
      throw this.formatServiceError(error, 'Impossible de créer le workflow');
    }
  }

  /**
   * Get workflows for clinic
   */
  async getWorkflows(clinicId: string): Promise<WorkflowDefinition[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_definitions')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('Error getting workflows:', error);
      return [];
    }
  }

  /**
   * Get single workflow by ID
   */
  async getWorkflow(workflowId: string): Promise<WorkflowDefinition | null> {
    try {
      const { data, error } = await supabase
        .from('workflow_definitions')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('Error getting workflow:', error);
      return null;
    }
  }

  /**
   * Update workflow
   */
  async updateWorkflow(
    workflowId: string,
    updates: Partial<Pick<WorkflowDefinition, 'name' | 'description' | 'definition' | 'status'>>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflow_definitions')
        .update({

          ...updates,

          updated_at: new Date().toISOString()
        })
        .eq('id', workflowId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating workflow:', error);
      throw this.formatServiceError(error, 'Impossible de modifier le workflow');
    }
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflow_definitions')
        .delete()
        .eq('id', workflowId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting workflow:', error);
      throw this.formatServiceError(error, 'Impossible de supprimer le workflow');
    }
  }

  /**
   * Sync workflow_schedules row when workflow has a schedule trigger
   */
  async syncWorkflowSchedule(workflowId: string, definition: WorkflowGraph): Promise<void> {
    const cron = getScheduleCron(definition);
    if (!cron) {
      await supabase
        .from('workflow_schedules')
        .update({ is_active: false })
        .eq('workflow_id', workflowId);
      return;
    }

    const { data: nextRun, error: cronError } = await supabase.rpc('calculate_next_run_time', {
      cron_expression: cron,
      timezone: 'UTC',
    });
    if (cronError) throw cronError;

    const { error } = await supabase
      .from('workflow_schedules')
      .upsert(
        {
          workflow_id: workflowId,
          cron_expression: cron,
          timezone: 'UTC',
          is_active: true,
          next_run_at: nextRun as string,
        },
        { onConflict: 'workflow_id' },
      );
    if (error) throw error;
  }

  /**
   * Activate workflow and sync schedule if applicable
   */
  async activateWorkflow(workflowId: string): Promise<void> {
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) throw new Error('Workflow introuvable');
    await this.updateWorkflow(workflowId, { status: 'active' });
    await this.syncWorkflowSchedule(workflowId, workflow.definition as WorkflowGraph);
  }

  /**
   * Pause workflow and disable schedules
   */
  async pauseWorkflow(workflowId: string): Promise<void> {
    await this.updateWorkflow(workflowId, { status: 'paused' });
    await supabase
      .from('workflow_schedules')
      .update({ is_active: false })
      .eq('workflow_id', workflowId);
  }

  /**
   * Archive workflow
   */
  async archiveWorkflow(workflowId: string): Promise<void> {
    await this.updateWorkflow(workflowId, { status: 'archived' });
  }

  /**
   * Execute workflow via server-side edge function
   */
  async executeWorkflow(
    workflowId: string,
    _userId: string,
    inputData: Record<string, unknown> = {},
  ): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('workflow-run', {
        body: { workflowId, inputData },
      });

      if (error) {
        throw new Error(await this.parseFunctionError(error, 'Impossible d\'exécuter le workflow'));
      }

      if (data?.error) {
        throw new Error(data.message ?? data.error);
      }

      return data.executionId as string;
    } catch (error) {
      console.error('Error executing workflow:', error);
      if (error instanceof Error) throw error;
      throw this.formatServiceError(error, 'Impossible d\'exécuter le workflow');
    }
  }

  /**
   * Get executions for all workflows in a clinic (with workflow name)
   */
  async getClinicExecutions(
    clinicId: string,
    page: number = 1,
    perPage: number = 50,
    workflowId?: string,
  ): Promise<PaginatedResponse<WorkflowExecutionListItem>> {
    try {
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      let query = supabase
        .from('workflow_executions')
        .select(
          `
          *,
          workflow_definitions!inner(name, clinic_id)
        `,
          { count: 'exact' },
        )
        .eq('workflow_definitions.clinic_id', clinicId)
        .order('started_at', { ascending: false })
        .range(from, to);

      if (workflowId) {
        query = query.eq('workflow_id', workflowId);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      const rows: WorkflowExecutionListItem[] = (data || []).map((row) => {
        const def = row.workflow_definitions as { name?: string } | { name?: string }[] | null;
        const name = Array.isArray(def) ? def[0]?.name : def?.name;
        const { workflow_definitions: _omit, ...execution } = row as WorkflowExecution & {
          workflow_definitions?: unknown;
        };
        return { ...execution, workflow_name: name ?? 'Workflow' };
      });

      return {
        data: rows,
        total: count || 0,
        page,
        per_page: perPage,
        total_pages: Math.ceil((count || 0) / perPage),
      };
    } catch (error) {
      console.error('Error getting clinic executions:', error);
      throw this.formatServiceError(error, 'Impossible de charger les exécutions');
    }
  }

  /**
   * Get workflow executions
   */
  async getExecutions(
    workflowId: string,
    page: number = 1,
    perPage: number = 50
  ): Promise<PaginatedResponse<WorkflowExecutionListItem>> {
    try {
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      const { data, error, count } = await supabase
        .from('workflow_executions')
        .select(
          `
          *,
          workflow_definitions(name)
        `,
          { count: 'exact' },
        )
        .eq('workflow_id', workflowId)
        .order('started_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const rows: WorkflowExecutionListItem[] = (data || []).map((row) => {
        const def = row.workflow_definitions as { name?: string } | { name?: string }[] | null;
        const name = Array.isArray(def) ? def[0]?.name : def?.name;
        const { workflow_definitions: _omit, ...execution } = row as WorkflowExecution & {
          workflow_definitions?: unknown;
        };
        return { ...execution, workflow_name: name ?? 'Workflow' };
      });

      return {
        data: rows,
        total: count || 0,
        page,
        per_page: perPage,
        total_pages: Math.ceil((count || 0) / perPage),
      };
    } catch (error) {
      console.error('Error getting executions:', error);
      throw this.formatServiceError(error, 'Impossible de charger les exécutions');
    }
  }

  /**
   * Get single execution
   */
  async getExecution(executionId: string): Promise<WorkflowExecution | null> {
    try {
      const { data, error } = await supabase
        .from('workflow_executions')
        .select('*')
        .eq('id', executionId)
        .single();

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('Error getting execution:', error);
      return null;
    }
  }

  /**
   * Cancel execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflow_executions')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString()
        })
        .eq('id', executionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error cancelling execution:', error);
      throw new Error('Failed to cancel execution');
    }
  }

  /**
   * Get execution logs
   */
  async getExecutionLogs(executionId: string): Promise<WorkflowLog[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_logs')
        .select('*')
        .eq('execution_id', executionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('Error getting execution logs:', error);
      return [];
    }
  }

  /**
   * Log workflow event
   */
  async logWorkflowEvent(
    executionId: string,
    level: 'info' | 'warning' | 'error' | 'debug',

    nodeId?: string,
    message: string,

    data?: Record<string, any>
  ): Promise<void> {
    try {
      await supabase.rpc('log_workflow_event', {
        p_execution_id: executionId,
        p_level: level,
        p_node_id: nodeId,
        p_message: message,
        p_data: data || {}
      });
    } catch (error) {
      console.error('Error logging workflow event:', error);
    }
  }

  /**
   * Get workflow analytics
   */
  async getWorkflowAnalytics(workflowId: string, days: number = 30): Promise<{
    total_executions: number;
    successful_executions: number;
    failed_executions: number;
    success_rate: number;
    avg_duration_seconds: number;
  }> {
    try {
      const { data, error } = await supabase.rpc('get_workflow_analytics', {
        workflow_id_param: workflowId,
        days
      });

      if (error) throw error;

      const result = Array.isArray(data) ? data[0] : null;
      if (!result) {
        return {
          total_executions: 0,
          successful_executions: 0,
          failed_executions: 0,
          success_rate: 0,
          avg_duration_seconds: 0,
        };
      }

      return {
        total_executions: Number(result.total_executions) || 0,
        successful_executions: Number(result.successful_executions) || 0,
        failed_executions: Number(result.failed_executions) || 0,
        success_rate: Number(result.success_rate) || 0,
        avg_duration_seconds: Number(result.avg_duration_seconds) || 0,
      };
    } catch (error) {
      console.error('Error getting workflow analytics:', error);
      return {
        total_executions: 0,
        successful_executions: 0,
        failed_executions: 0,
        success_rate: 0,
        avg_duration_seconds: 0
      };
    }
  }

  /**
   * Refresh workflow analytics
   */
  async refreshWorkflowAnalytics(): Promise<void> {
    try {
      const { error } = await supabase.rpc('refresh_workflow_analytics');
      if (error) throw error;
    } catch (error) {
      console.error('Error refreshing workflow analytics:', error);
      throw new Error('Failed to refresh workflow analytics');
    }
  }

  // ============================================================================
  // WORKFLOW TEMPLATES
  // ============================================================================

  /**
   * Get workflow templates
   */
  async getTemplates(category?: string): Promise<WorkflowTemplate[]> {
    try {
      let query = supabase
        .from('workflow_templates')
        .select('*')
        .eq('is_public', true)
        .order('usage_count', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('Error getting templates:', error);
      return [];
    }
  }

  /**
   * Get single template
   */
  async getTemplate(templateId: string): Promise<WorkflowTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('workflow_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('Error getting template:', error);
      return null;
    }
  }

  /**
   * Create workflow from template
   */
  async createFromTemplate(
    templateId: string,
    clinicId: string,
    userId: string,
    name: string
  ): Promise<WorkflowDefinition> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) throw new Error('Template not found');

      // Increment template usage
      await supabase.rpc('increment_template_usage', { template_id_param: templateId });

      // Create workflow from template (normalize template keys → editable steps)
      return await this.createWorkflow(
        clinicId,
        userId,
        name,
        template.description || '',
        template.category || 'custom',
        normalizeTemplateDefinition(template.definition as WorkflowGraph),
      );
    } catch (error) {
      console.error('Error creating workflow from template:', error);
      throw this.formatServiceError(error, 'Impossible de créer le workflow depuis le template');
    }
  }

  /**
   * Create custom template
   */
  async createTemplate(
    name: string,
    description: string,
    category: string,
    definition: WorkflowGraph,
    isPublic: boolean = false
  ): Promise<WorkflowTemplate> {
    try {
      const { data, error } = await supabase
        .from('workflow_templates')
        .insert({
          name,
          description,
          category,

          definition,
          is_public,

          usage_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('Error creating template:', error);
      throw new Error('Failed to create template');
    }
  }

  // ============================================================================
  // WORKFLOW VARIABLES
  // ============================================================================

  /**
   * Set workflow variable
   */
  async setVariable(
    workflowId: string,
    key: string,
    value: any,
    type: 'string' | 'number' | 'boolean' | 'object' | 'array' = 'string'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflow_variables')
        .upsert({
          workflow_id: workflowId,
          key,
          value,
          variable_type: type,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error setting variable:', error);
      throw new Error('Failed to set workflow variable');
    }
  }

  /**
   * Get workflow variable
   */
  async getVariable(workflowId: string, key: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('workflow_variables')
        .select('value')
        .eq('workflow_id', workflowId)
        .eq('key', key)
        .single();

      if (error) throw error;
      return data?.value;
    } catch (error) {
      console.error('Error getting variable:', error);
      return null;
    }
  }

  /**
   * Get all workflow variables
   */
  async getVariables(workflowId: string): Promise<Record<string, any>> {
    try {
      const { data, error } = await supabase
        .from('workflow_variables')
        .select('*')
        .eq('workflow_id', workflowId);

      if (error) throw error;

      const variables: Record<string, any> = {};
      data?.forEach(v => {
        variables[v.key] = v.value;
      });

      return variables;
    } catch (error) {
      console.error('Error getting variables:', error);
      return {};
    }
  }

  /**
   * Delete workflow variable
   */
  async deleteVariable(workflowId: string, key: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflow_variables')
        .delete()
        .eq('workflow_id', workflowId)
        .eq('key', key);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting variable:', error);
      throw new Error('Failed to delete workflow variable');
    }
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Get current user ID
   */

  private async getCurrentUserId(): Promise<string> {

    const { data } = await supabase.auth.getUser();
    return data.user?.id || '';
  }

  /**
   * Get current clinic ID
   */

  private async getCurrentClinicId(): Promise<string> {

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return '';

      const { data } = await supabase
        .from('clinic_members')
        .select('clinic_id')
        .eq('user_id', userData.user.id)
        .eq('is_active', true)
        .single();

      return data?.clinic_id || '';
    } catch (error) {
      return '';
    }
  }
}

// Export singleton instance
export const workflowAutomationService = new WorkflowAutomationService();
