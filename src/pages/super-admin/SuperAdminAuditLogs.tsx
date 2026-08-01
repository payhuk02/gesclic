<<<<<<< HEAD
import { useEffect, useState } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Search, Download, ShieldCheck, ShieldAlert } from "lucide-react";
=======
import { useState } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import {
  FileText,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Building2,
  Shield,
  Database,
  Globe,
  MoreVertical,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
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
import {
<<<<<<< HEAD
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  user_id: string | null;
  user_type: string | null;
  clinic_id: string | null;
  success: boolean;
  error_message: string | null;
  ip_address: string | null;
  created_at: string;
}

const SuperAdminAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [clinicNames, setClinicNames] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data }, { data: clinics }] = await Promise.all([
        supabase
          .from("audit_logs")
          .select(
            "id, action, resource_type, resource_id, user_id, user_type, clinic_id, success, error_message, ip_address, created_at"
          )
          .order("created_at", { ascending: false })
          .limit(500),
        supabase.from("clinics").select("id, name"),
      ]);
      setLogs((data as any) || []);
      setClinicNames(Object.fromEntries((clinics || []).map((c) => [c.id, c.name])));
      setLoading(false);
    };
    load();
  }, []);

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q || l.action.toLowerCase().includes(q) || l.resource_type.toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "success" && l.success) ||
      (statusFilter === "failure" && !l.success);
    return matchesSearch && matchesStatus;
  });

  const exportCsv = () => {
    const header = "date,action,resource_type,resource_id,clinic,success,error,ip\n";
    const rows = filtered
      .map((l) =>
        [
          new Date(l.created_at).toISOString(),
          l.action,
          l.resource_type,
          l.resource_id || "",
          l.clinic_id ? clinicNames[l.clinic_id] || l.clinic_id : "",
          l.success,
          (l.error_message || "").replace(/,/g, ";"),
          l.ip_address || "",
        ].join(",")
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "audit-logs.csv";
    link.click();
    URL.revokeObjectURL(url);
  };
=======
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SuperAdminAuditLogs = () => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("7d");

  const auditLogs = [
    {
      id: "1",
      timestamp: new Date(),
      category: "authentication",
      severity: "info",
      user: "super_admin@gesclic.com",
      action: "LOGIN_SUCCESS",
      details: "Successful login from 192.168.1.1",
      ip: "192.168.1.1",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      clinicId: null,
    },
    {
      id: "2",
      timestamp: new Date(Date.now() - 3600000),
      category: "authorization",
      severity: "warning",
      user: "admin@santeplus.com",
      action: "PERMISSION_DENIED",
      details: "Attempted to access super admin panel",
      ip: "192.168.1.2",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X)",
      clinicId: "clinic-123",
    },
    {
      id: "3",
      timestamp: new Date(Date.now() - 7200000),
      category: "data",
      severity: "critical",
      user: "system",
      action: "DATA_BREACH_ATTEMPT",
      details: "SQL injection attempt blocked",
      ip: "45.33.32.156",
      userAgent: "Python/3.9",
      clinicId: null,
    },
    {
      id: "4",
      timestamp: new Date(Date.now() - 10800000),
      category: "configuration",
      severity: "info",
      user: "super_admin@gesclic.com",
      action: "SETTINGS_UPDATED",
      details: "Updated platform security settings",
      ip: "192.168.1.1",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      clinicId: null,
    },
    {
      id: "5",
      timestamp: new Date(Date.now() - 86400000),
      category: "user_management",
      severity: "info",
      user: "admin@central.com",
      action: "USER_CREATED",
      details: "Created new user: doctor@central.com",
      ip: "192.168.1.3",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)",
      clinicId: "clinic-456",
    },
    {
      id: "6",
      timestamp: new Date(Date.now() - 172800000),
      category: "billing",
      severity: "warning",
      user: "system",
      action: "PAYMENT_FAILED",
      details: "Payment processing failed for clinic-789",
      ip: "system",
      userAgent: "system",
      clinicId: "clinic-789",
    },
  ];

  const categoryConfig = {
    authentication: { label: "Authentification", icon: Shield, color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    authorization: { label: "Autorisation", icon: Shield, color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
    data: { label: "Données", icon: Database, color: "bg-destructive/10 text-destructive border-destructive/20" },
    configuration: { label: "Configuration", icon: FileText, color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
    user_management: { label: "Gestion Utilisateurs", icon: User, color: "bg-green-500/10 text-green-600 border-green-500/20" },
    billing: { label: "Facturation", icon: FileText, color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20" },
  };

  const severityConfig = {
    critical: { label: "Critique", color: "bg-destructive/10 text-destructive border-destructive/20" },
    warning: { label: "Avertissement", color: "bg-warning/10 text-warning border-warning/20" },
    info: { label: "Info", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  };

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || log.category === categoryFilter;
    const matchesSeverity = severityFilter === "all" || log.severity === severityFilter;
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  const [expandedLog, setExpandedLog] = useState<string | null>(null);
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
<<<<<<< HEAD
            <p className="text-muted-foreground">Traçabilité complète des actions sensibles</p>
          </div>
          <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Exporter CSV
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Entrées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{logs.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Succès</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                {logs.filter((l) => l.success).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Échecs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                {logs.filter((l) => !l.success).length}
              </div>
            </CardContent>
          </Card>
=======
            <p className="text-muted-foreground">Journal d'audit détaillé de la plateforme</p>
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
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
<<<<<<< HEAD
                  placeholder="Rechercher une action..."
=======
                  placeholder="Rechercher dans les logs..."
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
<<<<<<< HEAD
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="success">Succès</SelectItem>
                  <SelectItem value="failure">Échecs</SelectItem>
=======
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  <SelectItem value="authentication">Authentification</SelectItem>
                  <SelectItem value="authorization">Autorisation</SelectItem>
                  <SelectItem value="data">Données</SelectItem>
                  <SelectItem value="configuration">Configuration</SelectItem>
                  <SelectItem value="user_management">Gestion Utilisateurs</SelectItem>
                  <SelectItem value="billing">Facturation</SelectItem>
                </SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Sévérité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les sévérités</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                  <SelectItem value="warning">Avertissement</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

<<<<<<< HEAD
        <Card>
          <CardHeader>
            <CardTitle>Entrées d'Audit</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune entrée d'audit</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Ressource</TableHead>
                      <TableHead>Clinique</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium">{log.action}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.resource_type}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.clinic_id ? clinicNames[log.clinic_id] || "—" : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              log.success
                                ? "bg-success/10 text-success border-success/20"
                                : "bg-destructive/10 text-destructive border-destructive/20"
                            }
                          >
                            {log.success ? "Succès" : "Échec"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.ip_address || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
=======
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{auditLogs.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Critiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {auditLogs.filter((l) => l.severity === "critical").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avertissements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {auditLogs.filter((l) => l.severity === "warning").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {auditLogs.filter((l) => l.severity === "info").length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Journal d'Audit</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun log trouvé</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map((log) => {
                  const categoryInfo = categoryConfig[log.category as keyof typeof categoryConfig];
                  const CategoryIcon = categoryInfo.icon;
                  const severityInfo = severityConfig[log.severity];
                  const isExpanded = expandedLog === log.id;

                  return (
                    <div
                      key={log.id}
                      className="border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 cursor-pointer"
                        onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <CategoryIcon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge className={categoryInfo.color}>
                                {categoryInfo.label}
                              </Badge>
                              <Badge className={severityInfo.color}>
                                {severityInfo.label}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {new Date(log.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-foreground">{log.action}</p>
                            <p className="text-sm text-muted-foreground truncate">{log.details}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-0 border-t border-border">
                          <div className="grid gap-2 text-sm mt-4">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Utilisateur:</span>
                              <span className="font-medium">{log.user}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">IP:</span>
                              <span className="font-medium">{log.ip}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">User Agent:</span>
                              <span className="font-medium truncate">{log.userAgent}</span>
                            </div>
                            {log.clinicId && (
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Clinic ID:</span>
                                <span className="font-medium">{log.clinicId}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminAuditLogs;
