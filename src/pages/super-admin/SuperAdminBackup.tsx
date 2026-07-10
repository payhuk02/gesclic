import { useState } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  Clock,
  HardDrive,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  FileText,
  Trash2,
  MoreVertical,
  Play,
  Pause,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";

interface Backup {
  id: string;
  name: string;
  type: "manual" | "scheduled" | "automatic";
  status: "completed" | "in_progress" | "failed" | "pending";
  size: number;
  createdAt: string;
  createdBy: string;
  description?: string;
}

const SuperAdminBackup = () => {
  const [backups, setBackups] = useState<Backup[]>([
    {
      id: "1",
      name: "backup_2024_07_10_0000",
      type: "scheduled",
      status: "completed",
      size: 2450000000,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      createdBy: "system",
      description: "Backup quotidien automatique",
    },
    {
      id: "2",
      name: "backup_2024_07_09_0000",
      type: "scheduled",
      status: "completed",
      size: 2448000000,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      createdBy: "system",
      description: "Backup quotidien automatique",
    },
    {
      id: "3",
      name: "pre_deployment_backup",
      type: "manual",
      status: "completed",
      size: 2455000000,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      createdBy: "super_admin@gesclic.com",
      description: "Backup avant déploiement v2.1",
    },
    {
      id: "4",
      name: "backup_2024_07_08_0000",
      type: "scheduled",
      status: "failed",
      size: 0,
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      createdBy: "system",
      description: "Backup quotidien automatique",
    },
  ]);

  const [backupInProgress, setBackupInProgress] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [restoreProgress, setRestoreProgress] = useState(0);

  const typeConfig = {
    manual: { label: "Manuel", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    scheduled: { label: "Programmé", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
    automatic: { label: "Automatique", color: "bg-green-500/10 text-green-600 border-green-500/20" },
  };

  const statusConfig = {
    completed: { label: "Complété", icon: CheckCircle, color: "bg-success/10 text-success border-success/20" },
    in_progress: { label: "En cours", icon: RefreshCw, color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    failed: { label: "Échoué", icon: XCircle, color: "bg-destructive/10 text-destructive border-destructive/20" },
    pending: { label: "En attente", icon: Clock, color: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const handleCreateBackup = () => {
    setBackupInProgress(true);
    toast.info("Création du backup en cours...");
    setTimeout(() => {
      const newBackup: Backup = {
        id: Date.now().toString(),
        name: `manual_backup_${new Date().toISOString().split("T")[0].replace(/-/g, "_")}`,
        type: "manual",
        status: "completed",
        size: 2452000000,
        createdAt: new Date().toISOString(),
        createdBy: "super_admin@gesclic.com",
        description: "Backup manuel",
      };
      setBackups([newBackup, ...backups]);
      setBackupInProgress(false);
      toast.success("Backup créé avec succès");
    }, 3000);
  };

  const handleRestore = () => {
    if (!selectedBackup) return;
    setRestoreDialogOpen(false);
    toast.info("Restauration en cours...");
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setRestoreProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        toast.success("Restauration terminée avec succès");
        setRestoreProgress(0);
      }
    }, 500);
  };

  const handleDeleteBackup = (backupId: string) => {
    setBackups(backups.filter((backup) => backup.id !== backupId));
    toast.success("Backup supprimé");
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Backup & Restore</h1>
            <p className="text-muted-foreground">Gestion des sauvegardes et restaurations</p>
          </div>
          <Button onClick={handleCreateBackup} disabled={backupInProgress} className="gradient-hero border-0">
            {backupInProgress ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2" />
                Créer Backup
              </>
            )}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                Espace Disque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">78%</div>
              <Progress value={78} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">245 GB / 315 GB</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Backups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{backups.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Dernier Backup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {new Date(backups[0]?.createdAt || Date.now()).toLocaleDateString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {backups[0]?.createdAt ? new Date(backups[0].createdAt).toLocaleTimeString() : ""}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Taille Totale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatSize(backups.reduce((sum, b) => sum + b.size, 0))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Configuration de Backup Automatique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Fréquence de backup</Label>
                <select className="mt-1 w-full p-2 border border-border rounded-lg bg-background">
                  <option>Quotidien (00:00 UTC)</option>
                  <option>Hebdomadaire (Dimanche 00:00 UTC)</option>
                  <option>Mensuel (1er du mois 00:00 UTC)</option>
                </select>
              </div>
              <div>
                <Label>Rétention (jours)</Label>
                <Input type="number" defaultValue="30" className="mt-1" />
              </div>
              <div>
                <Label>Compression</Label>
                <select className="mt-1 w-full p-2 border border-border rounded-lg bg-background">
                  <option>Gzip</option>
                  <option>Aucune</option>
                </select>
              </div>
              <div>
                <Label>Destination</Label>
                <select className="mt-1 w-full p-2 border border-border rounded-lg bg-background">
                  <option>Local</option>
                  <option>S3</option>
                  <option>Google Cloud Storage</option>
                </select>
              </div>
            </div>
            <Button className="gradient-hero border-0 mt-4">
              Sauvegarder la configuration
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historique des Backups</CardTitle>
          </CardHeader>
          <CardContent>
            {backups.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun backup trouvé</p>
              </div>
            ) : (
              <div className="space-y-4">
                {backups.map((backup) => {
                  const typeInfo = typeConfig[backup.type];
                  const statusInfo = statusConfig[backup.status];
                  const StatusIcon = statusInfo.icon;

                  return (
                    <div
                      key={backup.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Database className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-foreground">{backup.name}</h3>
                            <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                            <Badge className={statusInfo.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                          </div>
                          {backup.description && (
                            <p className="text-sm text-muted-foreground mb-1">{backup.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <HardDrive className="w-3 h-3" />
                              {formatSize(backup.size)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(backup.createdAt).toLocaleString()}
                            </span>
                            <span>Par: {backup.createdBy}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => { setSelectedBackup(backup); setRestoreDialogOpen(true); }}
                              disabled={backup.status !== "completed"}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Restaurer
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled={backup.status !== "completed"}>
                              <Download className="w-4 h-4 mr-2" />
                              Télécharger
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DeleteConfirmDialog
                              onConfirm={() => handleDeleteBackup(backup.id)}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              }
                            />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Restaurer Backup</DialogTitle>
            </DialogHeader>
            {selectedBackup && (
              <div className="space-y-4 mt-4">
                <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-warning">Attention</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        La restauration remplacera toutes les données actuelles. Cette action est irréversible.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Backup sélectionné:</p>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-medium">{selectedBackup.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(selectedBackup.createdAt).toLocaleString()} • {formatSize(selectedBackup.size)}
                    </p>
                  </div>
                </div>
                {restoreProgress > 0 && (
                  <div>
                    <Label>Progression</Label>
                    <Progress value={restoreProgress} className="mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">{restoreProgress}%</p>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setRestoreDialogOpen(false)} disabled={restoreProgress > 0}>
                    Annuler
                  </Button>
                  <Button onClick={handleRestore} disabled={restoreProgress > 0} className="gradient-hero border-0">
                    <Play className="w-4 h-4 mr-2" />
                    Restaurer
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminBackup;
