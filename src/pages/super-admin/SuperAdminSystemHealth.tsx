import { useEffect, useState } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  Server,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  Activity,
  Gauge,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface ServiceRow {
  id: string;
  name: string;
  description: string | null;
  status: string;
  uptime_percent: number;
  latency_ms: number;
  last_checked_at: string;
}

interface IncidentRow {
  id: string;
  service_name: string;
  severity: string;
  description: string;
  resolved: boolean;
  created_at: string;
}

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
  running: { label: "Running", icon: CheckCircle, color: "bg-success/10 text-success border-success/20" },
  degraded: { label: "Degraded", icon: AlertTriangle, color: "bg-warning/10 text-warning border-warning/20" },
  down: { label: "Down", icon: XCircle, color: "bg-destructive/10 text-destructive border-destructive/20" },
};

const severityConfig: Record<string, { label: string; color: string }> = {
  critical: { label: "Critique", color: "bg-destructive/10 text-destructive border-destructive/20" },
  warning: { label: "Avertissement", color: "bg-warning/10 text-warning border-warning/20" },
  info: { label: "Info", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
};

const SuperAdminSystemHealth = () => {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [servicesRes, incidentsRes] = await Promise.all([
        supabase.from("system_services").select("*").order("name"),
        supabase
          .from("system_incidents")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      if (servicesRes.error) throw servicesRes.error;
      if (incidentsRes.error) throw incidentsRes.error;
      setServices((servicesRes.data ?? []) as ServiceRow[]);
      setIncidents((incidentsRes.data ?? []) as IncidentRow[]);
    } catch (error) {
      console.error("Error loading system health:", error);
      toast.error("Erreur lors du chargement de la santé système");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  const runningCount = services.filter((s) => s.status === "running").length;
  const openIncidents = incidents.filter((i) => !i.resolved).length;
  const avgUptime = services.length
    ? services.reduce((s, x) => s + Number(x.uptime_percent ?? 0), 0) / services.length
    : 0;
  const avgLatency = services.length
    ? Math.round(services.reduce((s, x) => s + (x.latency_ms ?? 0), 0) / services.length)
    : 0;

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">System Health</h1>
            <p className="text-muted-foreground">
              Services et incidents enregistrés pour la plateforme
            </p>
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Rafraîchir
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Server className="w-4 h-4" />
                Services opérationnels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {runningCount}/{services.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Disponibilité moyenne
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgUptime.toFixed(1)}%</div>
              <Progress value={avgUptime} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Gauge className="w-4 h-4" />
                Latence moyenne
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgLatency} ms</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Incidents ouverts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{openIncidents}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Chargement...</p>
              ) : services.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  Aucun service enregistré pour le moment.
                </p>
              ) : (
                <div className="space-y-4">
                  {services.map((service) => {
                    const statusInfo = statusConfig[service.status] ?? statusConfig.running;
                    const StatusIcon = statusInfo.icon;
                    return (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Server className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{service.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Uptime: {Number(service.uptime_percent).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-medium">{service.latency_ms} ms</p>
                            <p className="text-xs text-muted-foreground">Latence</p>
                          </div>
                          <Badge className={statusInfo.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Incidents Récents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Chargement...</p>
              ) : incidents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  Aucun incident enregistré.
                </p>
              ) : (
                <div className="space-y-4">
                  {incidents.map((incident) => {
                    const severityInfo = severityConfig[incident.severity] ?? severityConfig.info;
                    return (
                      <div key={incident.id} className="p-3 border border-border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={severityInfo.color}>{severityInfo.label}</Badge>
                          <Badge variant={incident.resolved ? "outline" : "default"}>
                            {incident.resolved ? "Résolu" : "En cours"}
                          </Badge>
                        </div>
                        <p className="font-medium text-foreground mb-1">{incident.service_name}</p>
                        <p className="text-sm text-muted-foreground mb-2">{incident.description}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(incident.created_at).toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminSystemHealth;
