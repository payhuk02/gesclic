import AppLayout from "@/components/layout/AppLayout";
import { useState, useEffect, useCallback } from "react";

import { Workflow, Play, Pause, Archive, Plus, Trash2, Clock, CheckCircle, AlertCircle, Loader2, Settings, Zap, FileText, Copy, ShieldAlert, Pencil, BarChart3, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  workflowAutomationService,
  WORKFLOW_CATEGORIES,
  type WorkflowCategory,
} from "@/services/workflow-automation.service";
import type { WorkflowExecutionListItem } from "@/services/workflow-automation.service";
import { useClinic } from "@/contexts/ClinicContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import { useFeatureFlags } from "@/contexts/FeatureFlagsContext";
import {
  graphToSteps,
  emptyWorkflowStep,
  stepsToGraph,
  getEventType,
  getScheduleCron,
  type WorkflowEditorStep,
} from "@/lib/workflow-steps";
import type { WorkflowGraph, WorkflowLog } from "@/types/phase2";

interface WorkflowForm {
  name: string;
  description: string;
  category: WorkflowCategory;
}

const emptyForm: WorkflowForm = {
  name: "",
  description: "",
  category: "custom",
};

const categoryLabels: Record<WorkflowCategory, string> = {
  appointment: "Rendez-vous",
  patient: "Patient",
  billing: "Facturation",
  notification: "Notification",
  custom: "Personnalisé",
};

const triggerTypeLabels: Record<string, string> = {
  manual: "Manuel",
  event: "Événement",
  schedule: "Planifié",
  webhook: "Webhook",
};

const eventTypeLabels: Record<string, string> = {
  patient_created: "Création patient",
  payment_completed: "Paiement reçu",
  appointment_created: "Création RDV",
};

interface WorkflowAnalyticsSummary {
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  success_rate: number;
  avg_duration_seconds: number;
}

const WorkflowAutomation = () => {
  const { activeClinicId, hasClinicRole } = useClinic();
  const { user, hasRole } = useAuth();
  const { isEnabled, loading: flagsLoading } = useFeatureFlags();
  const workflowEnabled = isEnabled("workflow_automation_enabled");
  const canManage = hasRole("admin") || hasClinicRole("admin");

  const [workflows, setWorkflows] = useState<any[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecutionListItem[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editWorkflowId, setEditWorkflowId] = useState<string | null>(null);
  const [editWorkflowName, setEditWorkflowName] = useState("");
  const [editSteps, setEditSteps] = useState<WorkflowEditorStep[]>([]);
  const [savingSteps, setSavingSteps] = useState(false);
  const [form, setForm] = useState<WorkflowForm>(emptyForm);
  const [executionFilter, setExecutionFilter] = useState<string>("all");
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecutionListItem | null>(null);
  const [executionLogs, setExecutionLogs] = useState<WorkflowLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [analyticsByWorkflow, setAnalyticsByWorkflow] = useState<Record<string, WorkflowAnalyticsSummary>>({});
  const [clinicAnalytics, setClinicAnalytics] = useState<WorkflowAnalyticsSummary | null>(null);

  const loadExecutions = useCallback(async (clinicId: string, workflowId?: string) => {
    try {
      const result = await workflowAutomationService.getClinicExecutions(
        clinicId,
        1,
        50,
        workflowId,
      );
      setExecutions(result.data);
    } catch (error) {
      console.error("Error loading executions:", error);
      setExecutions([]);
    }
  }, []);

  const loadAnalytics = useCallback(async (workflowList: { id: string }[]) => {
    try {
      await workflowAutomationService.refreshWorkflowAnalytics();
      const entries = await Promise.all(
        workflowList.map(async (w) => {
          const stats = await workflowAutomationService.getWorkflowAnalytics(w.id, 30);
          return [w.id, stats] as const;
        }),
      );
      const map = Object.fromEntries(entries);
      setAnalyticsByWorkflow(map);

      const totals = entries.reduce(
        (acc, [, s]) => ({
          total_executions: acc.total_executions + s.total_executions,
          successful_executions: acc.successful_executions + s.successful_executions,
          failed_executions: acc.failed_executions + s.failed_executions,
          success_rate: 0,
          avg_duration_seconds: acc.avg_duration_seconds + s.avg_duration_seconds,
        }),
        { total_executions: 0, successful_executions: 0, failed_executions: 0, success_rate: 0, avg_duration_seconds: 0 },
      );
      totals.success_rate = totals.total_executions > 0
        ? (totals.successful_executions / totals.total_executions) * 100
        : 0;
      totals.avg_duration_seconds = workflowList.length > 0
        ? totals.avg_duration_seconds / workflowList.length
        : 0;
      setClinicAnalytics(totals);
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  }, []);

  const loadData = useCallback(async () => {
    if (!activeClinicId) return;
    try {
      setLoading(true);
      const [wfs, temps] = await Promise.all([
        workflowAutomationService.getWorkflows(activeClinicId),
        workflowAutomationService.getTemplates(),
      ]);

      setWorkflows(wfs);
      setTemplates(temps);

      const filterId = executionFilter === "all" ? undefined : executionFilter;
      await loadExecutions(activeClinicId, filterId);
      await loadAnalytics(wfs);
    } catch (error) {
      console.error("Error loading workflow data:", error);
      toast.error("Erreur lors du chargement des workflows");
    } finally {
      setLoading(false);
    }
  }, [activeClinicId, executionFilter, loadExecutions, loadAnalytics]);

  useEffect(() => {
    if (activeClinicId && workflowEnabled) {
      loadData();
    }
  }, [activeClinicId, workflowEnabled, loadData]);

  const handleActionError = (error: unknown, fallback: string) => {
    toast.error(error instanceof Error ? error.message : fallback);
  };

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      toast.error("Action réservée aux administrateurs de la clinique.");
      return;
    }
    try {
      if (!user || !activeClinicId) return;

      const defaultStep: WorkflowEditorStep = {
        ...emptyWorkflowStep(),
        title: form.name.trim(),
        message: form.description.trim() || "Notification envoyée par votre workflow Gesclic.",
      };

      await workflowAutomationService.createWorkflow(
        activeClinicId,
        user.id,
        form.name,
        form.description,
        form.category,
        stepsToGraph([defaultStep]),
      );

      setCreateDialogOpen(false);
      setForm(emptyForm);
      loadData();
      toast.success("Workflow créé (brouillon) — activez-le pour l'exécuter");
    } catch (error) {
      console.error("Error creating workflow:", error);
      handleActionError(error, "Erreur lors de la création du workflow");
    }
  };

  const handleExecuteWorkflow = async (workflowId: string) => {
    try {
      if (!user) return;
      await workflowAutomationService.executeWorkflow(workflowId, user.id);
      toast.success("Workflow exécuté — vérifiez vos notifications");
      loadData();
    } catch (error) {
      console.error("Error executing workflow:", error);
      handleActionError(error, "Erreur lors de l'exécution du workflow");
    }
  };

  const handleActivateWorkflow = async (workflowId: string) => {
    if (!canManage) {
      toast.error("Action réservée aux administrateurs de la clinique.");
      return;
    }
    try {
      await workflowAutomationService.activateWorkflow(workflowId);
      loadData();
      toast.success("Workflow activé");
    } catch (error) {
      handleActionError(error, "Erreur lors de l'activation du workflow");
    }
  };

  const handlePauseWorkflow = async (workflowId: string) => {
    if (!canManage) {
      toast.error("Action réservée aux administrateurs de la clinique.");
      return;
    }
    try {
      await workflowAutomationService.pauseWorkflow(workflowId);
      loadData();
      toast.success("Workflow mis en pause");
    } catch (error) {
      handleActionError(error, "Erreur lors de la pause du workflow");
    }
  };

  const handleArchiveWorkflow = async (workflowId: string) => {
    if (!canManage) {
      toast.error("Action réservée aux administrateurs de la clinique.");
      return;
    }
    try {
      await workflowAutomationService.archiveWorkflow(workflowId);
      loadData();
      toast.success("Workflow archivé");
    } catch (error) {
      handleActionError(error, "Erreur lors de l'archivage du workflow");
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!canManage) {
      toast.error("Action réservée aux administrateurs de la clinique.");
      return;
    }
    try {
      await workflowAutomationService.deleteWorkflow(workflowId);
      loadData();
      toast.success("Workflow supprimé");
    } catch (error) {
      handleActionError(error, "Erreur lors de la suppression du workflow");
    }
  };

  const handleCreateFromTemplate = async (templateId: string) => {
    if (!canManage) {
      toast.error("Action réservée aux administrateurs de la clinique.");
      return;
    }
    try {
      if (!user || !activeClinicId) return;

      await workflowAutomationService.createFromTemplate(
        templateId,
        activeClinicId,
        user.id,
        "Workflow depuis template",
      );

      loadData();
      toast.success("Workflow créé depuis le template (brouillon)");
    } catch (error) {
      handleActionError(error, "Erreur lors de la création depuis le template");
    }
  };

  const openEditDialog = (workflow: { id: string; name: string; definition: WorkflowGraph }) => {
    setEditWorkflowId(workflow.id);
    setEditWorkflowName(workflow.name);
    setEditSteps(graphToSteps(workflow.definition));
    setEditDialogOpen(true);
  };

  const handleSaveSteps = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editWorkflowId || !canManage) return;

    const invalid = editSteps.some((s) => !s.title.trim() || !s.message.trim());
    if (invalid) {
      toast.error("Chaque étape doit avoir un titre et un message");
      return;
    }

    setSavingSteps(true);
    try {
      await workflowAutomationService.saveWorkflowSteps(editWorkflowId, editSteps);
      toast.success("Étapes enregistrées");
      setEditDialogOpen(false);
      loadData();
    } catch (error) {
      handleActionError(error, "Impossible d'enregistrer les étapes");
    } finally {
      setSavingSteps(false);
    }
  };

  const updateEditStep = (index: number, patch: Partial<WorkflowEditorStep>) => {
    setEditSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const openExecutionDetail = async (execution: WorkflowExecutionListItem) => {
    setSelectedExecution(execution);
    setLoadingLogs(true);
    try {
      const logs = await workflowAutomationService.getExecutionLogs(execution.id);
      setExecutionLogs(logs);
    } catch {
      setExecutionLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const getWorkflowTriggerLabel = (definition: WorkflowGraph) => {
    const event = getEventType(definition);
    if (event) return eventTypeLabels[event] ?? event;
    const cron = getScheduleCron(definition);
    if (cron) return `Planifié (${cron})`;
    return "Manuel";
  };

  const statusConfig: Record<string, { label: string; icon: typeof Play; className: string }> = {
    draft: { label: "Brouillon", icon: FileText, className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    active: { label: "Actif", icon: Play, className: "bg-success/10 text-success border-success/20" },
    paused: { label: "En pause", icon: Pause, className: "bg-warning/10 text-warning border-warning/20" },
    archived: { label: "Archivé", icon: Archive, className: "bg-muted text-muted-foreground" },
  };

  const executionStatusConfig: Record<string, { label: string; icon: typeof Clock; className: string }> = {
    running: { label: "En cours", icon: Loader2, className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    completed: { label: "Terminé", icon: CheckCircle, className: "bg-success/10 text-success border-success/20" },
    failed: { label: "Échoué", icon: AlertCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
    cancelled: { label: "Annulé", icon: Archive, className: "bg-muted text-muted-foreground" },
    paused: { label: "En pause", icon: Pause, className: "bg-warning/10 text-warning border-warning/20" },
  };

  const getExecutionDuration = (execution: WorkflowExecutionListItem) => {
    if (execution.duration_seconds != null) return `${execution.duration_seconds}s`;
    if (execution.completed_at) {
      return `${Math.round(
        (new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()) / 1000,
      )}s`;
    }
    return null;
  };

  return (
    <AppLayout title="Workflow Automation">
      {!flagsLoading && !workflowEnabled ? (
        <EmptyState
          icon={Workflow}
          title="Workflows désactivés"
          description="Cette fonctionnalité est désactivée au niveau de la plateforme. Contactez l'administrateur Gesclic."
        />
      ) : (
      <>
      {!canManage && (
        <Card className="mb-6 border-warning/30 bg-warning/5">
          <CardContent className="py-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Consultation seule</p>
              <p className="text-muted-foreground">
                Seuls les administrateurs de la clinique peuvent créer, modifier ou supprimer des workflows.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="workflows" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="executions">Exécutions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-6">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <p className="text-muted-foreground">{workflows.length} workflow{workflows.length > 1 ? "s" : ""}</p>
            {canManage && (
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau Workflow
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Créer un Workflow</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateWorkflow} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nom</Label>
                      <Input
                        placeholder="Mon Workflow"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Description du workflow..."
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Catégorie</Label>
                      <Select
                        value={form.category}
                        onValueChange={(v) => setForm({ ...form, category: v as WorkflowCategory })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {WORKFLOW_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {categoryLabels[cat]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full">Créer le Workflow</Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 sm:py-20">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-primary" />
            </div>
          ) : workflows.length === 0 ? (
            <EmptyState
              icon={Workflow}
              title="Aucun workflow"
              description="Créez votre premier workflow ou utilisez un template"
            />
          ) : (
            <div className="grid gap-4">
              {workflows.map((workflow) => {
                const config = statusConfig[workflow.status] || statusConfig.draft;
                const StatusIcon = config.icon;
                const canActivate = ["draft", "paused"].includes(workflow.status);
                return (
                  <Card key={workflow.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{workflow.name}</h3>
                            <Badge className={config.className}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {config.label}
                            </Badge>
                          </div>
                          {workflow.description && (
                            <p className="text-sm text-muted-foreground">{workflow.description}</p>
                          )}
                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline">
                              {categoryLabels[workflow.category as WorkflowCategory] ?? workflow.category}
                            </Badge>
                            <Badge variant="secondary">
                              {getWorkflowTriggerLabel(workflow.definition as WorkflowGraph)}
                            </Badge>
                            <span>Créé le {new Date(workflow.created_at).toLocaleDateString()}</span>
                            {analyticsByWorkflow[workflow.id]?.total_executions > 0 && (
                              <span>
                                · {Math.round(analyticsByWorkflow[workflow.id].success_rate)}% succès (30j)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {workflow.status === "active" && (
                            <Button size="sm" onClick={() => handleExecuteWorkflow(workflow.id)}>
                              <Play className="w-4 h-4 mr-2" />
                              Exécuter
                            </Button>
                          )}
                          {canManage && canActivate && (
                            <Button size="sm" onClick={() => handleActivateWorkflow(workflow.id)}>
                              <Play className="w-4 h-4 mr-2" />
                              Activer
                            </Button>
                          )}
                          {canManage && workflow.status === "active" && (
                            <Button size="sm" variant="outline" onClick={() => handlePauseWorkflow(workflow.id)}>
                              <Pause className="w-4 h-4 mr-2" />
                              Pause
                            </Button>
                          )}
                          {canManage && workflow.status !== "archived" && (
                            <Button size="sm" variant="outline" onClick={() => handleArchiveWorkflow(workflow.id)}>
                              <Archive className="w-4 h-4 mr-2" />
                              Archiver
                            </Button>
                          )}
                          {canManage && workflow.status !== "archived" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(workflow)}
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Étapes
                            </Button>
                          )}
                          {canManage && (
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteWorkflow(workflow.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="executions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Exécutions de Workflows
                  </CardTitle>
                  <CardDescription>
                    Historique des exécutions de la clinique
                  </CardDescription>
                </div>
                {workflows.length > 0 && (
                  <Select
                    value={executionFilter}
                    onValueChange={(v) => {
                      setExecutionFilter(v);
                      if (activeClinicId) {
                        loadExecutions(activeClinicId, v === "all" ? undefined : v);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-56">
                      <SelectValue placeholder="Filtrer par workflow" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les workflows</SelectItem>
                      {workflows.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : executions.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="Aucune exécution"
                  description="Les exécutions de workflows apparaîtront ici"
                />
              ) : (
                <div className="space-y-3">
                  {executions.map((execution) => {
                    const config = executionStatusConfig[execution.status] || executionStatusConfig.running;
                    const StatusIcon = config.icon;
                    const duration = getExecutionDuration(execution);
                    return (
                      <div key={execution.id} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <Badge className={config.className}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{execution.workflow_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(execution.started_at).toLocaleString()}
                            {execution.trigger_type && ` · ${triggerTypeLabels[execution.trigger_type] ?? execution.trigger_type}`}
                          </p>
                          {execution.error_message && (
                            <p className="text-xs text-destructive mt-1 truncate">{execution.error_message}</p>
                          )}
                        </div>
                        {duration && (
                          <Badge variant="outline">{duration}</Badge>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => openExecutionDetail(execution)}>
                          <Eye className="w-4 h-4 mr-1" />
                          Logs
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Analytics — 30 derniers jours
              </CardTitle>
              <CardDescription>
                Statistiques agrégées des exécutions de workflows de la clinique
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : !clinicAnalytics || clinicAnalytics.total_executions === 0 ? (
                <EmptyState
                  icon={BarChart3}
                  title="Aucune donnée analytics"
                  description="Les statistiques apparaîtront après les premières exécutions"
                />
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-2xl font-bold">{clinicAnalytics.total_executions}</p>
                        <p className="text-sm text-muted-foreground">Exécutions totales</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-2xl font-bold text-success">{clinicAnalytics.successful_executions}</p>
                        <p className="text-sm text-muted-foreground">Réussies</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-2xl font-bold text-destructive">{clinicAnalytics.failed_executions}</p>
                        <p className="text-sm text-muted-foreground">Échouées</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-2xl font-bold">{Math.round(clinicAnalytics.success_rate)}%</p>
                        <p className="text-sm text-muted-foreground">Taux de succès</p>
                      </CardContent>
                    </Card>
                  </div>
                  {workflows.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-medium">Par workflow</h3>
                      {workflows.map((w) => {
                        const stats = analyticsByWorkflow[w.id];
                        if (!stats?.total_executions) return null;
                        return (
                          <div key={w.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <span className="font-medium truncate">{w.name}</span>
                            <div className="flex gap-3 text-sm text-muted-foreground shrink-0">
                              <span>{stats.total_executions} exec.</span>
                              <span>{Math.round(stats.success_rate)}% OK</span>
                              <span>{Math.round(stats.avg_duration_seconds)}s moy.</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Templates de Workflows
              </CardTitle>
              <CardDescription>
                Utilisez des templates prédéfinis pour créer rapidement des workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : templates.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="Aucun template"
                  description="Aucun template de workflow disponible"
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {templates.map((template) => (
                    <Card key={template.id} className="hover:border-primary transition-colors">
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Settings className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold">{template.name}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                          <Badge variant="outline">
                            {categoryLabels[template.category as WorkflowCategory] ?? template.category}
                          </Badge>
                          {canManage ? (
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => handleCreateFromTemplate(template.id)}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Utiliser ce Template
                            </Button>
                          ) : (
                            <p className="text-xs text-muted-foreground text-center">
                              Réservé aux administrateurs
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Étapes — {editWorkflowName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveSteps} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Chaque étape envoie une notification in-app réelle lors de l&apos;exécution du workflow.
            </p>
            {editSteps.map((step, index) => (
              <Card key={step.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Étape {index + 1} — Notification</span>
                    {editSteps.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditSteps((prev) => prev.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Titre</Label>
                    <Input
                      value={step.title}
                      onChange={(e) => updateEditStep(index, { title: e.target.value })}
                      placeholder="Rappel rendez-vous"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      value={step.message}
                      onChange={(e) => updateEditStep(index, { message: e.target.value })}
                      placeholder="Votre rendez-vous est demain à 10h."
                      rows={2}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lien (optionnel)</Label>
                    <Input
                      value={step.link ?? ""}
                      onChange={(e) => updateEditStep(index, { link: e.target.value })}
                      placeholder="/appointments"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Destinataires</Label>
                    <Select
                      value={step.target}
                      onValueChange={(v) =>
                        updateEditStep(index, { target: v as WorkflowEditorStep["target"] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trigger_user">Utilisateur qui exécute</SelectItem>
                        <SelectItem value="clinic_admins">Administrateurs de la clinique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setEditSteps((prev) => [...prev, emptyWorkflowStep()])}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une étape
            </Button>
            <Button type="submit" className="w-full" disabled={savingSteps}>
              {savingSteps ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enregistrer les étapes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedExecution} onOpenChange={(open) => !open && setSelectedExecution(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détail exécution</DialogTitle>
          </DialogHeader>
          {selectedExecution && (
            <div className="space-y-4">
              <div className="text-sm space-y-1">
                <p><span className="font-medium">Workflow :</span> {selectedExecution.workflow_name}</p>
                <p><span className="font-medium">Statut :</span> {executionStatusConfig[selectedExecution.status]?.label ?? selectedExecution.status}</p>
                <p><span className="font-medium">Déclencheur :</span> {triggerTypeLabels[selectedExecution.trigger_type ?? "manual"] ?? selectedExecution.trigger_type}</p>
                <p><span className="font-medium">Démarré :</span> {new Date(selectedExecution.started_at).toLocaleString()}</p>
                {selectedExecution.error_message && (
                  <p className="text-destructive"><span className="font-medium">Erreur :</span> {selectedExecution.error_message}</p>
                )}
              </div>
              <div>
                <h4 className="font-medium mb-2">Logs</h4>
                {loadingLogs ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : executionLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun log enregistré</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {executionLogs.map((log) => (
                      <div key={log.id} className="text-sm p-2 bg-muted/50 rounded">
                        <div className="flex justify-between gap-2">
                          <Badge variant="outline" className="text-xs">{log.level}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="mt-1">{log.message}</p>
                        {log.node_id && (
                          <p className="text-xs text-muted-foreground mt-1">Nœud : {log.node_id}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </>
      )}
    </AppLayout>
  );
};

export default WorkflowAutomation;
