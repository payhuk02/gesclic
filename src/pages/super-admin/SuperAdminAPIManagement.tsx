import { useEffect, useState } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Key, Search, Trash2, MoreVertical, Shield, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { fromAdmin } from "@/lib/admin-db";

interface ApiKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[] | null;
  requests_per_minute: number | null;
  is_active: boolean | null;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string | null;
  clinic_id: string | null;
}

const SuperAdminAPIManagement = () => {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = async () => {
    const { data, error } = await fromAdmin("api_keys").select("id, name, key_prefix, scopes, requests_per_minute, is_active, last_used_at, expires_at, created_at, clinic_id").order("created_at", { ascending: false });
    if (error) toast.error("Chargement des clés impossible");
    setKeys((data ?? []) as ApiKeyRow[]);
  };
  useEffect(() => { load(); }, []);

  const revoke = async (id: string) => {
    const { error } = await fromAdmin("api_keys").update({ is_active: false }).eq("id", id);
    if (error) toast.error("Révocation impossible");
    else { toast.success("Clé révoquée"); load(); }
  };

  const remove = async (id: string) => {
    const { error } = await fromAdmin("api_keys").delete().eq("id", id);
    if (error) toast.error("Suppression impossible");
    else { toast.success("Clé supprimée"); load(); }
  };

  const statusOf = (k: ApiKeyRow) => {
    if (k.expires_at && new Date(k.expires_at) < new Date()) return "expired";
    return k.is_active ? "active" : "revoked";
  };

  const filtered = keys.filter((k) => {
    const hay = `${k.name} ${k.key_prefix}`.toLowerCase();
    const status = statusOf(k);
    return hay.includes(search.toLowerCase()) && (statusFilter === "all" || status === statusFilter);
  });

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">API Management</h1>
          <p className="text-muted-foreground">Clés API réelles (préfixe uniquement, jamais la clé secrète)</p>
        </div>
        <Card>
          <CardContent className="p-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une clé API..." className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="revoked">Révoqué</SelectItem>
                <SelectItem value="expired">Expiré</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{keys.length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Actives</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{keys.filter((k) => statusOf(k) === "active").length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Révoquées</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{keys.filter((k) => statusOf(k) === "revoked").length}</div></CardContent></Card>
        </div>
        <Card>
          <CardHeader><CardTitle>Clés API</CardTitle></CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground"><Key className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Aucune clé API</p></div>
            ) : filtered.map((k) => (
              <div key={k.id} className="flex gap-4 p-4 border rounded-lg mb-3">
                <div className="flex-1">
                  <div className="flex gap-2 mb-1">
                    <h3 className="font-semibold">{k.name}</h3>
                    <Badge variant="outline">{statusOf(k)}</Badge>
                  </div>
                  <code className="text-sm bg-muted px-2 py-1 rounded">{k.key_prefix}••••</code>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{k.requests_per_minute ?? 0} req/min</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{k.created_at ? new Date(k.created_at).toLocaleDateString() : "—"}</span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {statusOf(k) === "active" && <DropdownMenuItem onClick={() => revoke(k.id)}><Shield className="w-4 h-4 mr-2" />Révoquer</DropdownMenuItem>}
                    <DeleteConfirmDialog onConfirm={() => remove(k.id)} trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}><Trash2 className="w-4 h-4 mr-2" />Supprimer</DropdownMenuItem>} />
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

export default SuperAdminAPIManagement;
