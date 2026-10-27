import { useEffect, useState } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Database, HardDrive, Calendar, Trash2, MoreVertical, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { fromAdmin } from "@/lib/admin-db";
import { useAuth } from "@/contexts/AuthContext";

interface Backup {
  id: string;
  name: string;
  backup_type: string;
  size_bytes: number;
  status: string;
  created_by: string | null;
  created_at: string;
  error_message: string | null;
}

const SuperAdminBackup = () => {
  const { user } = useAuth();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    const { data } = await fromAdmin("backups").select("*").order("created_at", { ascending: false });
    setBackups((data ?? []) as Backup[]);
  };
  useEffect(() => { load(); }, []);

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const createRecord = async () => {
    setCreating(true);
    const name = `backup_${new Date().toISOString().replace(/[:.]/g, "-")}`;
    const { error } = await fromAdmin("backups").insert({
      name,
      backup_type: "manual",
      status: "pending",
      size_bytes: 0,
      created_by: user?.id ?? null,
    });
    setCreating(false);
    if (error) toast.error("Enregistrement impossible");
    else {
      toast.success("Demande de sauvegarde enregistrée. L'exécution réelle se fait côté infrastructure.");
      load();
    }
  };

  const remove = async (id: string) => {
    const { error } = await fromAdmin("backups").delete().eq("id", id);
    if (error) toast.error("Suppression impossible");
    else { toast.success("Enregistrement supprimé"); load(); }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Backup & Restore</h1>
            <p className="text-muted-foreground">Historique réel des sauvegardes (sans simulation)</p>
          </div>
          <Button onClick={createRecord} disabled={creating} className="gradient-hero border-0">
            {creating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
            Enregistrer une sauvegarde
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{backups.length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Dernier</CardTitle></CardHeader><CardContent><div className="text-lg font-bold">{backups[0] ? new Date(backups[0].created_at).toLocaleString() : "—"}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Taille cumulée</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatSize(backups.reduce((s, b) => s + (b.size_bytes || 0), 0))}</div></CardContent></Card>
        </div>
        <Card>
          <CardHeader><CardTitle>Historique</CardTitle></CardHeader>
          <CardContent>
            {backups.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground"><Database className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Aucune sauvegarde enregistrée</p></div>
            ) : backups.map((b) => (
              <div key={b.id} className="flex gap-4 p-4 border rounded-lg mb-3">
                <div className="flex-1">
                  <div className="flex gap-2 mb-1">
                    <h3 className="font-semibold">{b.name}</h3>
                    <Badge variant="outline">{b.backup_type}</Badge>
                    <Badge>{b.status}</Badge>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" />{formatSize(b.size_bytes)}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(b.created_at).toLocaleString()}</span>
                  </div>
                  {b.error_message && <p className="text-sm text-destructive mt-1">{b.error_message}</p>}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DeleteConfirmDialog onConfirm={() => remove(b.id)} trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}><Trash2 className="w-4 h-4 mr-2" />Supprimer</DropdownMenuItem>} />
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminBackup;
