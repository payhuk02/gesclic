import { useCallback, useEffect, useState } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Server, AlertTriangle, CheckCircle, XCircle, RefreshCw, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fromAdmin } from "@/lib/admin-db";

interface ServiceRow {
  id: string;
  name: string;
  status: string;
  uptime_percent: number;
  latency_ms: number;
}

interface IncidentRow {
  id: string;
  service_name: string;
  severity: string;
  description: string;
  resolved: boolean;
  created_at: string;
}

const SuperAdminSystemHealth = () => {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    const [svc, inc] = await Promise.all([
      fromAdmin("system_services").select("id, name, status, uptime_percent, latency_ms").order("name"),
      fromAdmin("system_incidents").select("id, service_name, severity, description, resolved, created_at").order("created_at", { ascending: false }).limit(20),
    ]);
    setServices((svc.data ?? []) as ServiceRow[]);
    setIncidents((inc.data ?? []) as IncidentRow[]);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const statusConfig: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
    running: { label: "Running", icon: CheckCircle, color: "bg-success/10 text-success" },
    degraded: { label: "Degraded", icon: AlertTriangle, color: "bg-warning/10 text-warning" },
    down: { label: "Down", icon: XCircle, color: "bg-destructive/10 text-destructive" },
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">System Health</h1>
            <p className="text-muted-foreground">État réel des services enregistrés — pas de métriques inventées</p>
          </div>
          <Button variant="outline" onClick={load} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Rafraîchir
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Server className="w-5 h-5" />Services</CardTitle></CardHeader>
            <CardContent>
              {services.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">Aucun service enregistré</p>
              ) : services.map((service) => {
                const info = statusConfig[service.status] ?? statusConfig.running;
                const Icon = info.icon;
                return (
                  <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg mb-3">
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-xs text-muted-foreground">Uptime: {service.uptime_percent}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{service.latency_ms} ms</p>
                      <Badge className={info.color}><Icon className="w-3 h-3 mr-1" />{info.label}</Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5" />Incidents</CardTitle></CardHeader>
            <CardContent>
              {incidents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">Aucun incident enregistré</p>
              ) : incidents.map((incident) => (
                <div key={incident.id} className="p-3 border rounded-lg mb-3">
                  <div className="flex justify-between mb-1">
                    <Badge variant="outline">{incident.severity}</Badge>
                    <Badge variant={incident.resolved ? "outline" : "default"}>{incident.resolved ? "Résolu" : "En cours"}</Badge>
                  </div>
                  <p className="font-medium">{incident.service_name}</p>
                  <p className="text-sm text-muted-foreground">{incident.description}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Clock className="w-3 h-3" />{new Date(incident.created_at).toLocaleString()}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminSystemHealth;
