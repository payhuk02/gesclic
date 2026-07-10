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

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
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
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminAuditLogs;
