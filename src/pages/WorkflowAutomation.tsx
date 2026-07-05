import AppLayout from "@/components/layout/AppLayout";
import { useState, useEffect } from "react";
import { Workflow, Play, Pause, Archive, Plus, Trash2, Edit, Clock, CheckCircle, AlertCircle, Loader2, Settings, Zap, FileText, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { workflowAutomationService } from "@/services/workflow-automation.service";
import { useClinic } from "@/contexts/ClinicContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";

interface WorkflowForm {
  name: string;
  description: string;
  category: string;
}

const emptyForm: WorkflowForm = {
  name: "",
  description: "",
  category: "automation",
};

const WorkflowAutomation = () => {
  const { activeClinicId } = useClinic();
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [executions, setExecutions] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [form, setForm] = useState<WorkflowForm>(emptyForm);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);

  useEffect(() => {
    if (activeClinicId) {
      loadData();
    }
  }, [activeClinicId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [wfs, temps] = await Promise.all([
        workflowAutomationService.getWorkflows(activeClinicId),
        workflowAutomationService.getTemplates(),
      ]);

      setWorkflows(wfs);
      setTemplates(temps);

      // Get executions for first workflow if available
      if (wfs.length > 0) {
        const execs = await workflowAutomationService.getExecutions(wfs[0].id, 1, 50);
        setExecutions(execs.data || []);
      }
    } catch (error) {
      console.error("Error loading workflow data:", error);
      toast.error("Erreur lors du chargement des workflows");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!user) return;

      await workflowAutomationService.createWorkflow(
        activeClinicId,
        user.id,
        form.name,
        form.description,
        form.category,
        { nodes: [], edges: [], triggers: [] }
      );

      setCreateDialogOpen(false);
      setForm(emptyForm);
      loadData();
      toast.success("Workflow créé avec succès");
    } catch (error) {
      console.error("Error creating workflow:", error);
      toast.error("Erreur lors de la création du workflow");
    }
  };

  const handleExecuteWorkflow = async (workflowId: string) => {
    try {
      if (!user) return;
      const executionId = await workflowAutomationService.executeWorkflow(workflowId, user.id);
      toast.success("Workflow exécuté avec succès");
      loadData();
    } catch (error) {
      console.error("Error executing workflow:", error);
      toast.error("Erreur lors de l'exécution du workflow");
    }
  };

  const handleActivateWorkflow = async (workflowId: string) => {
    try {
      await workflowAutomationService.activateWorkflow(workflowId);
      loadData();
      toast.success("Workflow activé");
    } catch (error) {
      console.error("Error activating workflow:", error);
      toast.error("Erreur lors de l'activation du workflow");
    }
  };

  const handlePauseWorkflow = async (workflowId: string) => {
    try {
      await workflowAutomationService.pauseWorkflow(workflowId);
      loadData();
      toast.success("Workflow mis en pause");
    } catch (error) {
      console.error("Error pausing workflow:", error);
      toast.error("Erreur lors de la pause du workflow");
    }
  };

  const handleArchiveWorkflow = async (workflowId: string) => {
    try {
      await workflowAutomationService.archiveWorkflow(workflowId);
      loadData();
      toast.success("Workflow archivé");
    } catch (error) {
      console.error("Error archiving workflow:", error);
      toast.error("Erreur lors de l'archivage du workflow");
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    try {
      await workflowAutomationService.deleteWorkflow(workflowId);
      loadData();
      toast.success("Workflow supprimé");
    } catch (error) {
      console.error("Error deleting workflow:", error);
      toast.error("Erreur lors de la suppression du workflow");
    }
  };

  const handleCreateFromTemplate = async (templateId: string) => {
    try {
      if (!user) return;
      await workflowAutomationService.createFromTemplate(templateId, activeClinicId, user.id, "Workflow from Template");
      loadData();
      toast.success("Workflow créé depuis le template");
    } catch (error) {
      console.error("Error creating from template:", error);
      toast.error("Erreur lors de la création depuis le template");
    }
  };

  const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
    active: { label: "Actif", icon: Play, className: "bg-success/10 text-success border-success/20" },
    paused: { label: "En pause", icon: Pause, className: "bg-warning/10 text-warning border-warning/20" },
    archived: { label: "Archivé", icon: Archive, className: "bg-muted text-muted-foreground" },
  };

  const executionStatusConfig: Record<string, { label: string; icon: any; className: string }> = {
    pending: { label: "En attente", icon: Clock, className: "bg-muted text-muted-foreground" },
    running: { label: "En cours", icon: Loader2, className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    completed: { label: "Terminé", icon: CheckCircle, className: "bg-success/10 text-success border-success/20" },
    failed: { label: "Échoué", icon: AlertCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
  };

  return (
    <AppLayout title="Workflow Automation">
      <Tabs defaultValue="workflows" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="executions">Exécutions</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">{workflows.length} workflow{workflows.length > 1 ? "s" : ""}</p>
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
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="automation">Automatisation</SelectItem>
                        <SelectItem value="notification">Notification</SelectItem>
                        <SelectItem value="integration">Intégration</SelectItem>
                        <SelectItem value="reporting">Reporting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">Créer le Workflow</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
                const config = statusConfig[workflow.status] || statusConfig.paused;
                const StatusIcon = config.icon;
                return (
                  <Card key={workflow.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
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
                            <Badge variant="outline">{workflow.category}</Badge>
                            <span>Créé le {new Date(workflow.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {workflow.status === "active" && (
                            <Button size="sm" onClick={() => handleExecuteWorkflow(workflow.id)}>
                              <Play className="w-4 h-4 mr-2" />
                              Exécuter
                            </Button>
                          )}
                          {workflow.status === "active" && (
                            <Button size="sm" variant="outline" onClick={() => handlePauseWorkflow(workflow.id)}>
                              <Pause className="w-4 h-4 mr-2" />
                              Pause
                            </Button>
                          )}
                          {workflow.status === "paused" && (
                            <Button size="sm" onClick={() => handleActivateWorkflow(workflow.id)}>
                              <Play className="w-4 h-4 mr-2" />
                              Activer
                            </Button>
                          )}
                          {workflow.status !== "archived" && (
                            <Button size="sm" variant="outline" onClick={() => handleArchiveWorkflow(workflow.id)}>
                              <Archive className="w-4 h-4 mr-2" />
                              Archiver
                            </Button>
                          )}
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteWorkflow(workflow.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </Button>
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
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Exécutions de Workflows
              </CardTitle>
              <CardDescription>
                Historique des exécutions de workflows
              </CardDescription>
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
                    const config = executionStatusConfig[execution.status] || executionStatusConfig.pending;
                    const StatusIcon = config.icon;
                    return (
                      <div key={execution.id} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <Badge className={config.className}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                        <div className="flex-1">
                          <p className="font-medium">{execution.workflow_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(execution.started_at).toLocaleString()}
                          </p>
                        </div>
                        {execution.completed_at && (
                          <Badge variant="outline">
                            {Math.round((new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()) / 1000)}s
                          </Badge>
                        )}
                      </div>
                    );
                  })}
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
                    <Card key={template.id} className="cursor-pointer hover:border-primary transition-colors">
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Settings className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold">{template.name}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                          <Badge variant="outline">{template.category}</Badge>
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => handleCreateFromTemplate(template.id)}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Utiliser ce Template
                          </Button>
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
    </AppLayout>
  );
};

export default WorkflowAutomation;
