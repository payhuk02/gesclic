import { useState } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import {
  Activity,
  Server,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Zap,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const SuperAdminSystemHealth = () => {
  const [refreshing, setRefreshing] = useState(false);

  const systemMetrics = {
    cpu: { usage: 45, status: "healthy" },
    memory: { usage: 62, status: "healthy" },
    disk: { usage: 78, status: "warning" },
    network: { usage: 23, status: "healthy" },
  };

  const services = [
    { name: "API Server", status: "running", uptime: "99.9%", latency: "45ms" },
    { name: "Database", status: "running", uptime: "99.8%", latency: "12ms" },
    { name: "Redis Cache", status: "running", uptime: "100%", latency: "2ms" },
    { name: "Email Service", status: "degraded", uptime: "98.5%", latency: "234ms" },
    { name: "File Storage", status: "running", uptime: "99.7%", latency: "89ms" },
    { name: "CDN", status: "running", uptime: "99.9%", latency: "34ms" },
  ];

  const recentIncidents = [
    {
      id: "1",
      severity: "warning",
      service: "Email Service",
      description: "High latency detected",
      timestamp: new Date(Date.now() - 1800000),
      resolved: false,
    },
    {
      id: "2",
      severity: "critical",
      service: "Database",
      description: "Connection timeout",
      timestamp: new Date(Date.now() - 86400000),
      resolved: true,
    },
    {
      id: "3",
      severity: "info",
      service: "API Server",
      description: "Scheduled maintenance completed",
      timestamp: new Date(Date.now() - 172800000),
      resolved: true,
    },
  ];

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  };

  const statusConfig = {
    running: { label: "Running", icon: CheckCircle, color: "bg-success/10 text-success border-success/20" },
    degraded: { label: "Degraded", icon: AlertTriangle, color: "bg-warning/10 text-warning border-warning/20" },
    down: { label: "Down", icon: XCircle, color: "bg-destructive/10 text-destructive border-destructive/20" },
  };

  const severityConfig = {
    critical: { label: "Critique", color: "bg-destructive/10 text-destructive border-destructive/20" },
    warning: { label: "Avertissement", color: "bg-warning/10 text-warning border-warning/20" },
    info: { label: "Info", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">System Health</h1>
            <p className="text-muted-foreground">Monitoring et santé du système</p>
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
                <Cpu className="w-4 h-4" />
                CPU
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemMetrics.cpu.usage}%</div>
              <Progress value={systemMetrics.cpu.usage} className="mt-2" />
              <Badge className="mt-2 bg-success/10 text-success border-success/20">Healthy</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Mémoire
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemMetrics.memory.usage}%</div>
              <Progress value={systemMetrics.memory.usage} className="mt-2" />
              <Badge className="mt-2 bg-success/10 text-success border-success/20">Healthy</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                Disque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemMetrics.disk.usage}%</div>
              <Progress value={systemMetrics.disk.usage} className="mt-2" />
              <Badge className="mt-2 bg-warning/10 text-warning border-warning/20">Warning</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wifi className="w-4 h-4" />
                Réseau
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemMetrics.network.usage}%</div>
              <Progress value={systemMetrics.network.usage} className="mt-2" />
              <Badge className="mt-2 bg-success/10 text-success border-success/20">Healthy</Badge>
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
              <div className="space-y-4">
                {services.map((service) => {
                  const statusInfo = statusConfig[service.status as keyof typeof statusConfig];
                  const StatusIcon = statusInfo.icon;

                  return (
                    <div key={service.name} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Server className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{service.name}</p>
                          <p className="text-xs text-muted-foreground">Uptime: {service.uptime}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium">{service.latency}</p>
                          <p className="text-xs text-muted-foreground">Latency</p>
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
              <div className="space-y-4">
                {recentIncidents.map((incident) => {
                  const severityInfo = severityConfig[incident.severity];

                  return (
                    <div key={incident.id} className="p-3 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={severityInfo.color}>
                          {severityInfo.label}
                        </Badge>
                        <Badge variant={incident.resolved ? "outline" : "default"}>
                          {incident.resolved ? "Résolu" : "En cours"}
                        </Badge>
                      </div>
                      <p className="font-medium text-foreground mb-1">{incident.service}</p>
                      <p className="text-sm text-muted-foreground mb-2">{incident.description}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(incident.timestamp).toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Requests/sec</span>
                  <TrendingUp className="w-4 h-4 text-success" />
                </div>
                <p className="text-2xl font-bold">1,234</p>
                <p className="text-xs text-success">+12% vs hier</p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Response Time</span>
                  <TrendingDown className="w-4 h-4 text-success" />
                </div>
                <p className="text-2xl font-bold">45ms</p>
                <p className="text-xs text-success">-8% vs hier</p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Error Rate</span>
                  <TrendingDown className="w-4 h-4 text-success" />
                </div>
                <p className="text-2xl font-bold">0.12%</p>
                <p className="text-xs text-success">-23% vs hier</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 border border-border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Connections</p>
                <p className="text-xl font-bold">45/100</p>
                <Progress value={45} className="mt-2" />
              </div>
              <div className="p-4 border border-border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Query Latency</p>
                <p className="text-xl font-bold">12ms</p>
                <p className="text-xs text-success">Normal</p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Cache Hit Rate</p>
                <p className="text-xl font-bold">94%</p>
                <p className="text-xs text-success">Excellent</p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Replication Lag</p>
                <p className="text-xl font-bold">2ms</p>
                <p className="text-xs text-success">Minimal</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminSystemHealth;
