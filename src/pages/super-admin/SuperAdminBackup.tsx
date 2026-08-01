import { useEffect, useState } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  Database,
  RefreshCw,
  Clock,
  HardDrive,
  CheckCircle,
  XCircle,
  Calendar,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";

interface BackupRow {
  id: string;
  name: string;
  backup_type: string;
  status: string;
  size_bytes: number;
  location: string | null;
  retention_days: number;
  error_message: string | null;
  completed_at: string | null;
  created_at: string;
}

const typeConfig: Record<string, { label: string; color: string }> = {
  full: { label: "Complète", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  incremental: { label: "Incrémentale", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  manual: { label: "Manuelle", color: "bg-green-500/10 text-green-600 border-green-500/20" },
};

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
  completed: { label: "Complété", icon: CheckCircle, color: "bg-success/10 text-success border-success/20" },
  in_progress: { label: "En cours", icon: RefreshCw, color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  failed: { label: "Échoué", icon: XCircle, color: "bg-destructive/10 text-destructive border-destructive/20" },
  pending: { label: "En attente", icon: Clock, color: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
};

const formatSize = (bytes: number) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

const SuperAdminBackup = () => {
  const [backups, setBackups] = useState<BackupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      const { data, error } = await supabase
        .from("backups")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setBackups((data ?? []) as BackupRow[]);
    } catch (error) {
      console.error("Error loading backups:", error);
      toast.error("Erreur lors du chargement des sauvegardes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("backups").insert({
        name: `backup_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "_")}`,
        backup_type: "manual",
        status: "pending",
        created_by: userData.user?.id ?? null,
      });
      if (error) throw error;
      toast.success("Sauvegarde enregistrée (en attente d'exécution)");
      await load();
    } catch (error) {
      console.error("Error creating backup:", error);
      toast.error("Erreur lors de la création de la sauvegarde");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBackup = async (id: string) => {
    const { error } = await supabase.from("backups").delete().eq("id", id);
    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }
    toast.success("Sauvegarde supprimée");
    load();
  };

  const completed = backups.filter((b) => b.status === "completed");
  const failed = backups.filter((b) => b.status === "failed");
  const totalSize = backups.reduce((s, b) => s + Number(b.size_bytes ?? 0), 0);
  const last = backups[0];

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Backup &amp; Restore</h1>
            <p className="text-muted-foreground">Registre des sauvegardes de la plateforme</p>
          </div>
          <Button onClick={handleCreateBackup} disabled={creating} className="gradient-hero border-0">
            {creating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Backups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{backups.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Réussis / Échoués</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <span className="text-success">{completed.length}</span>
                <span className="text-muted-foreground"> / </span>
                <span className="text-destructive">{failed.length}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Dernier Backup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {last ? new Date(last.created_at).toLocaleDateString() : "—"}
              </div>
              {last && (
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(last.created_at).toLocaleTimeString()}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                Taille Totale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatSize(totalSize)}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historique des Backups</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Chargement...</div>
            ) : backups.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune sauvegarde enregistrée</p>
              </div>
            ) : (
              <div className="space-y-4">
                {backups.map((backup) => {
                  const typeInfo = typeConfig[backup.backup_type] ?? typeConfig.full;
                  const statusInfo = statusConfig[backup.status] ?? statusConfig.pending;
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
                          {backup.error_message && (
                            <p className="text-sm text-destructive mb-1">{backup.error_message}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <HardDrive className="w-3 h-3" />
                              {formatSize(Number(backup.size_bytes))}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(backup.created_at).toLocaleString()}
                            </span>
                            <span>Rétention : {backup.retention_days} j</span>
                            {backup.location && <span>Emplacement : {backup.location}</span>}
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
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminBackup;
