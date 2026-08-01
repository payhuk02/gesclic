import { useEffect, useState } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Search, Building2, User, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ActivityRow {
  id: string;
  action: string;
  resource_type: string;
  user_id: string | null;
  user_type: string | null;
  clinic_id: string | null;
  success: boolean;
  ip_address: string | null;
  created_at: string;
}

const SuperAdminActivity = () => {
  const [search, setSearch] = useState("");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("7d");
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [clinicNames, setClinicNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter]);

  const load = async () => {
    setLoading(true);
    const days = parseInt(dateFilter.replace("d", ""), 10) || 7;
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const [{ data: logs }, { data: clinics }] = await Promise.all([
      supabase
        .from("audit_logs")
        .select("id, action, resource_type, user_id, user_type, clinic_id, success, ip_address, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.from("clinics").select("id, name"),
    ]);

    setActivities((logs as any) || []);
    setClinicNames(Object.fromEntries((clinics || []).map((c) => [c.id, c.name])));
    setLoading(false);
  };

  const resourceTypes = Array.from(new Set(activities.map((a) => a.resource_type))).sort();

  const filtered = activities.filter((a) => {
    const clinic = a.clinic_id ? clinicNames[a.clinic_id] || "" : "";
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      a.action.toLowerCase().includes(q) ||
      a.resource_type.toLowerCase().includes(q) ||
      clinic.toLowerCase().includes(q);
    const matchesType = resourceFilter === "all" || a.resource_type === resourceFilter;
    return matchesSearch && matchesType;
  });

  const exportCsv = () => {
    const header = "date,action,resource,clinic,success,ip\n";
    const rows = filtered
      .map((a) =>
        [
          new Date(a.created_at).toISOString(),
          a.action,
          a.resource_type,
          a.clinic_id ? clinicNames[a.clinic_id] || a.clinic_id : "",
          a.success,
          a.ip_address || "",
        ].join(",")
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "activity-logs.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Activity Logs</h1>
            <p className="text-muted-foreground">Journal d'activité réel de la plateforme</p>
          </div>
          <div className="flex gap-2">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">24 heures</SelectItem>
                <SelectItem value="7d">7 jours</SelectItem>
                <SelectItem value="30d">30 jours</SelectItem>
                <SelectItem value="90d">90 jours</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher dans les logs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Type de ressource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {resourceTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Événements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activities.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Réussis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {activities.filter((a) => a.success).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Échecs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {activities.filter((a) => !a.success).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Journal d'Activité</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune activité enregistrée sur cette période</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted">
                      <Activity className="w-5 h-5 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline">{activity.resource_type}</Badge>
                        <Badge
                          className={
                            activity.success
                              ? "bg-success/10 text-success border-success/20"
                              : "bg-destructive/10 text-destructive border-destructive/20"
                          }
                        >
                          {activity.success ? "Succès" : "Échec"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(activity.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mb-1">{activity.action}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {activity.user_type || activity.user_id || "système"}
                        </span>
                        {activity.clinic_id && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {clinicNames[activity.clinic_id] || activity.clinic_id}
                          </span>
                        )}
                        {activity.ip_address && <span>IP: {activity.ip_address}</span>}
                      </div>
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
