import { useEffect, useState } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Activity, Search, Building2, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fromAdmin } from "@/lib/admin-db";

interface ActivityRow {
  id: string;
  action: string;
  resource_type: string;
  success: boolean;
  user_id: string | null;
  clinic_id: string | null;
  ip_address: string | null;
  created_at: string;
  error_message: string | null;
}

const SuperAdminActivity = () => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [clinics, setClinics] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      const [{ data }, clinicsRes] = await Promise.all([
        fromAdmin("audit_logs").select("id, action, resource_type, success, user_id, clinic_id, ip_address, created_at, error_message").order("created_at", { ascending: false }).limit(200),
        fromAdmin("clinics").select("id, name"),
      ]);
      setRows((data ?? []) as ActivityRow[]);
      setClinics(Object.fromEntries(((clinicsRes.data ?? []) as { id: string; name: string }[]).map((c) => [c.id, c.name])));
    };
    load();
  }, []);

  const types = [...new Set(rows.map((r) => r.resource_type))].sort();
  const filtered = rows.filter((row) => {
    const hay = `${row.action} ${row.resource_type} ${row.user_id ?? ""} ${row.error_message ?? ""}`.toLowerCase();
    return hay.includes(search.toLowerCase()) && (typeFilter === "all" || row.resource_type === typeFilter);
  });

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Activity Logs</h1>
          <p className="text-muted-foreground">Journal d'activité réel de la plateforme</p>
        </div>
        <Card>
          <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Rechercher dans les logs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{rows.length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Succès</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-success">{rows.filter((r) => r.success).length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Échecs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{rows.filter((r) => !r.success).length}</div></CardContent></Card>
        </div>
        <Card>
          <CardHeader><CardTitle>Journal d'Activité</CardTitle></CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune activité enregistrée</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((row) => (
                  <div key={row.id} className="p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline">{row.resource_type}</Badge>
                      <Badge className={row.success ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}>
                        {row.success ? "Succès" : "Échec"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm font-medium">{row.action}</p>
                    {row.error_message && <p className="text-sm text-muted-foreground">{row.error_message}</p>}
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      {row.user_id && <span className="flex items-center gap-1"><User className="w-3 h-3" />{row.user_id.slice(0, 8)}…</span>}
                      {row.clinic_id && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{clinics[row.clinic_id] ?? row.clinic_id.slice(0, 8)}</span>}
                      {row.ip_address && <span>IP: {row.ip_address}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminActivity;
