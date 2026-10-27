import { useEffect, useMemo, useState } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { FileText, Search, User, Building2, Globe, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fromAdmin } from "@/lib/admin-db";

interface AuditRow {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  success: boolean;
  user_id: string | null;
  clinic_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  error_message: string | null;
  changes: unknown;
  created_at: string;
}

const SuperAdminAuditLogs = () => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all");
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await fromAdmin("audit_logs")
        .select("id, action, resource_type, resource_id, success, user_id, clinic_id, ip_address, user_agent, error_message, changes, created_at")
        .order("created_at", { ascending: false })
        .limit(300);
      setRows((data ?? []) as AuditRow[]);
    };
    load();
  }, []);

  const types = useMemo(() => [...new Set(rows.map((r) => r.resource_type))].sort(), [rows]);
  const filtered = rows.filter((log) => {
    const hay = `${log.action} ${log.resource_type} ${log.user_id ?? ""} ${log.error_message ?? ""}`.toLowerCase();
    const matchesSearch = hay.includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || log.resource_type === typeFilter;
    const matchesResult = resultFilter === "all" || (resultFilter === "success" ? log.success : !log.success);
    return matchesSearch && matchesType && matchesResult;
  });

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">Journal d'audit réel de la plateforme</p>
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
                <SelectItem value="all">Toutes les ressources</SelectItem>
                {types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={resultFilter} onValueChange={setResultFilter}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="success">Succès</SelectItem>
                <SelectItem value="failure">Échecs</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{rows.length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Succès</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-success">{rows.filter((l) => l.success).length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Échecs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{rows.filter((l) => !l.success).length}</div></CardContent></Card>
        </div>
        <Card>
          <CardHeader><CardTitle>Journal d'Audit</CardTitle></CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun log trouvé</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((log) => {
                  const open = expanded === log.id;
                  return (
                    <div key={log.id} className="border border-border rounded-lg">
                      <button className="w-full text-left p-4" onClick={() => setExpanded(open ? null : log.id)}>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="outline">{log.resource_type}</Badge>
                          <Badge className={log.success ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}>
                            {log.success ? "Succès" : "Échec"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                          {open ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                        </div>
                        <p className="text-sm font-medium">{log.action}</p>
                        {log.error_message && <p className="text-sm text-muted-foreground truncate">{log.error_message}</p>}
                      </button>
                      {open && (
                        <div className="px-4 pb-4 text-sm space-y-2 border-t border-border pt-3">
                          <p className="flex items-center gap-2"><User className="w-4 h-4" />{log.user_id ?? "système"}</p>
                          <p className="flex items-center gap-2"><Globe className="w-4 h-4" />{log.ip_address ?? "—"}</p>
                          <p className="flex items-center gap-2"><FileText className="w-4 h-4" />{log.user_agent ?? "—"}</p>
                          {log.clinic_id && <p className="flex items-center gap-2"><Building2 className="w-4 h-4" />{log.clinic_id}</p>}
                          {log.changes != null && (
                            <pre className="text-xs bg-muted p-3 rounded overflow-auto">{JSON.stringify(log.changes, null, 2)}</pre>
                          )}
                        </div>
                      )}
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

export default SuperAdminAuditLogs;
