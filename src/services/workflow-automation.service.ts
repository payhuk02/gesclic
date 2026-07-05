// Workflow Automation Service
// Service layer for Workflow Automation functionality

import { supabase } from '@/integrations/supabase/client';
import type { 
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowLog,
  WorkflowTemplate,
  WorkflowGraph,
  PaginatedResponse
} from '@/types/phase2';

export class WorkflowAutomationService {
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
      throw new Error('Failed to create workflow');
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
      throw new Error('Failed to update workflow');
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
      throw new Error('Failed to delete workflow');
    }
  }

  /**
   * Activate workflow
   */
  async activateWorkflow(workflowId: string): Promise<void> {
    await this.updateWorkflow(workflowId, { status: 'active' });
  }

  /**
   * Pause workflow
   */
  async pauseWorkflow(workflowId: string): Promise<void> {
    await this.updateWorkflow(workflowId, { status: 'paused' });
  }

  /**
   * Archive workflow
   */
  async archiveWorkflow(workflowId: string): Promise<void> {
    await this.updateWorkflow(workflowId, { status: 'archived' });
  }

  /**
   * Execute workflow manually
   */
  async executeWorkflow(
    workflowId: string,
    userId: string,
    inputData: Record<string, any> = {}
  ): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('create_workflow_execution', {
        p_workflow_id: workflowId,
        p_trigger_type: 'manual',
        p_trigger_data: {},
        p_input_data: inputData,
        p_triggered_by: userId
      });

      if (error) throw error;

      // Execute the workflow (this would be a background job in production)
      this.executeWorkflowLogic(data, workflowId, inputData).catch(console.error);

      return data;
    } catch (error) {
      console.error('Error executing workflow:', error);
      throw new Error('Failed to execute workflow');
    }
  }

  /**
   * Execute workflow logic (simplified implementation)
   */
  private async executeWorkflowLogic(
    executionId: string,
    workflowId: string,
    inputData: Record<string, any>
  ): Promise<void> {
    try {
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) throw new Error('Workflow not found');

      const definition = workflow.definition as WorkflowGraph;
      let currentNode = definition.nodes.find(n => n.type === 'trigger');
      let outputData = { ...inputData };

      // Execute nodes in sequence
      while (currentNode) {
        await this.logWorkflowEvent(executionId, 'info', currentNode.id, `Executing node: ${currentNode.id}`);

        // Execute node based on type
        const result = await this.executeNode(currentNode, outputData);
        outputData = { ...outputData, ...result };

        // Find next node
        const edge = definition.edges.find(e => e.source === currentNode.id);
        currentNode = edge ? definition.nodes.find(n => n.id === edge.target) : undefined;
      }

      // Complete execution
      await supabase.rpc('complete_workflow_execution', {
        p_execution_id: executionId,
        p_status: 'completed',
        p_output_data: outputData
      });
    } catch (error) {
      console.error('Error executing workflow logic:', error);
      
      // Fail execution
      await supabase.rpc('complete_workflow_execution', {
        p_execution_id: executionId,
        p_status: 'failed',
        p_error_message: error instanceof Error ? error.message : 'Unknown error',
        p_error_details: { error: String(error) }
      });
    }
  }

  /**
   * Execute a single workflow node
   */
  private async executeNode(node: any, inputData: Record<string, any>): Promise<Record<string, any>> {
    // Simplified node execution
    // In a real implementation, this would handle different node types (action, condition, loop, etc.)
    
    switch (node.config.type) {
      case 'notification':
        return { notification_sent: true };
      case 'api_call':
        return { api_response: {} };
      case 'transform':
        return { transformed: true };
      default:
        return {};
    }
  }

  /**
   * Get workflow executions
   */
  async getExecutions(
    workflowId: string,
    page: number = 1,
    perPage: number = 50
  ): Promise<PaginatedResponse<WorkflowExecution>> {
    try {
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      const { data, error, count } = await supabase
        .from('workflow_executions')
        .select('*', { count: 'exact' })
        .eq('workflow_id', workflowId)
        .order('started_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        page,
        per_page: perPage,
        total_pages: Math.ceil((count || 0) / perPage)
      };
    } catch (error) {
      console.error('Error getting executions:', error);
      throw new Error('Failed to get workflow executions');
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

      const result = data[0];
      return {
        total_executions: Number(result.total_executions) || 0,
        successful_executions: Number(result.successful_executions) || 0,
        failed_executions: Number(result.failed_executions) || 0,
        success_rate: Number(result.success_rate) || 0,
        avg_duration_seconds: Number(result.avg_duration_seconds) || 0
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

      // Create workflow from template
      return await this.createWorkflow(
        clinicId,
        userId,
        name,
        template.description || '',
        template.category || 'custom',
        template.definition as WorkflowGraph
      );
    } catch (error) {
      console.error('Error creating workflow from template:', error);
      throw new Error('Failed to create workflow from template');
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
