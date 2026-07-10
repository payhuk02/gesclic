import { useState } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import {
  Shield,
  Lock,
  Key,
  Fingerprint,
  Monitor,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  Smartphone,
  RefreshCw,
  Ban,
  MoreVertical,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { toast } from "sonner";

const SuperAdminSecurity = () => {
  const [securitySettings, setSecuritySettings] = useState({
    enforce2FA: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireStrongPassword: true,
    ipWhitelist: "",
    ipBlacklist: "",
  });

  const sessions = [
    {
      id: "1",
      user: "super_admin@gesclic.com",
      device: "Chrome on Windows",
      ip: "192.168.1.1",
      location: "Abidjan, Côte d'Ivoire",
      lastActivity: new Date(),
      status: "active",
    },
    {
      id: "2",
      user: "admin@santeplus.com",
      device: "Safari on iPhone",
      ip: "192.168.1.2",
      location: "Dakar, Sénégal",
      lastActivity: new Date(Date.now() - 3600000),
      status: "active",
    },
    {
      id: "3",
      user: "unknown@malicious.com",
      device: "Unknown",
      ip: "45.33.32.156",
      location: "Unknown",
      lastActivity: new Date(Date.now() - 7200000),
      status: "suspicious",
    },
  ];

  const securityEvents = [
    {
      id: "1",
      type: "brute_force",
      severity: "critical",
      user: "unknown@malicious.com",
      ip: "45.33.32.156",
      description: "Multiple failed login attempts",
      timestamp: new Date(Date.now() - 1800000),
    },
    {
      id: "2",
      type: "suspicious_location",
      severity: "warning",
      user: "admin@santeplus.com",
      ip: "45.33.32.156",
      description: "Login from unusual location",
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: "3",
      type: "2fa_disabled",
      severity: "info",
      user: "user@clinic.com",
      ip: "192.168.1.3",
      description: "2FA disabled by user",
      timestamp: new Date(Date.now() - 86400000),
    },
  ];

  const handleSaveSettings = () => {
    toast.success("Paramètres de sécurité sauvegardés");
  };

  const handleRevokeSession = (sessionId: string) => {
    toast.success("Session révoquée");
  };

  const handleBlockIP = (ip: string) => {
    toast.success(`IP ${ip} bloquée`);
  };

  const severityConfig = {
    critical: { label: "Critique", color: "bg-destructive/10 text-destructive border-destructive/20" },
    warning: { label: "Avertissement", color: "bg-warning/10 text-warning border-warning/20" },
    info: { label: "Info", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  };

  const statusConfig = {
    active: { label: "Actif", icon: CheckCircle, color: "bg-success/10 text-success border-success/20" },
    suspicious: { label: "Suspicious", icon: AlertTriangle, color: "bg-destructive/10 text-destructive border-destructive/20" },
    revoked: { label: "Révoqué", icon: XCircle, color: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Security Center</h1>
            <p className="text-muted-foreground">Centre de sécurité et gestion des sessions</p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exporter Rapport
          </Button>
        </div>

        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="settings"><Shield className="w-4 h-4 mr-1" />Paramètres</TabsTrigger>
            <TabsTrigger value="sessions"><Monitor className="w-4 h-4 mr-1" />Sessions</TabsTrigger>
            <TabsTrigger value="events"><AlertTriangle className="w-4 h-4 mr-1" />Événements</TabsTrigger>
            <TabsTrigger value="2fa"><Fingerprint className="w-4 h-4 mr-1" />2FA</TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Politique de Mot de Passe
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Longueur minimale</Label>
                    <Input
                      type="number"
                      value={securitySettings.passwordMinLength}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, passwordMinLength: parseInt(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Exiger mot de passe fort</Label>
                    <Switch
                      checked={securitySettings.requireStrongPassword}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, requireStrongPassword: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Authentification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Exiger 2FA</Label>
                    <Switch
                      checked={securitySettings.enforce2FA}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, enforce2FA: checked })}
                    />
                  </div>
                  <div>
                    <Label>Tentatives max de connexion</Label>
                    <Input
                      type="number"
                      value={securitySettings.maxLoginAttempts}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: parseInt(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Délai d'expiration de session (minutes)</Label>
                    <Input
                      type="number"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Contrôle d'Accès IP
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>IPs autorisées (une par ligne)</Label>
                    <textarea
                      value={securitySettings.ipWhitelist}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, ipWhitelist: e.target.value })}
                      className="mt-1 w-full p-2 border border-border rounded-lg bg-background min-h-24"
                      placeholder="192.168.1.1&#10;192.168.1.2"
                    />
                  </div>
                  <div>
                    <Label>IPs bloquées (une par ligne)</Label>
                    <textarea
                      value={securitySettings.ipBlacklist}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, ipBlacklist: e.target.value })}
                      className="mt-1 w-full p-2 border border-border rounded-lg bg-background min-h-24"
                      placeholder="45.33.32.156&#10;103.21.244.12"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Button onClick={handleSaveSettings} className="gradient-hero border-0 mt-4">
              Sauvegarder les Paramètres
            </Button>
          </TabsContent>

          <TabsContent value="sessions">
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Sessions Actives</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sessions.filter((s) => s.status === "active").length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Sessions Suspicieuses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {sessions.filter((s) => s.status === "suspicious").length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Utilisateurs Uniques</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{new Set(sessions.map((s) => s.user)).size}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Sessions Actives</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sessions.map((session) => {
                    const statusInfo = statusConfig[session.status];
                    const StatusIcon = statusInfo.icon;

                    return (
                      <div
                        key={session.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Monitor className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground">{session.user}</h3>
                              <Badge className={statusInfo.color}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusInfo.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{session.device}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {session.ip}
                              </span>
                              <span className="flex items-center gap-1">
                                <Smartphone className="w-3 h-3" />
                                {session.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(session.lastActivity).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleRevokeSession(session.id)}>
                                <Ban className="w-4 h-4 mr-2" />
                                Révoquer Session
                              </DropdownMenuItem>
                              {session.status === "suspicious" && (
                                <DropdownMenuItem onClick={() => handleBlockIP(session.ip)} className="text-destructive">
                                  <Ban className="w-4 h-4 mr-2" />
                                  Bloquer IP
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Événements Critiques</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {securityEvents.filter((e) => e.severity === "critical").length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avertissements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-warning">
                    {securityEvents.filter((e) => e.severity === "warning").length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Événements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{securityEvents.length}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Événements de Sécurité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {securityEvents.map((event) => {
                    const severityInfo = severityConfig[event.severity];

                    return (
                      <div
                        key={event.id}
                        className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge className={severityInfo.color}>
                              {severityInfo.label}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-foreground mb-1">{event.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {event.ip}
                            </span>
                            <span className="flex items-center gap-1">
                              User: {event.user}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="2fa">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Fingerprint className="w-5 h-5" />
                    Statistiques 2FA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Utilisateurs avec 2FA activé</p>
                    <p className="text-2xl font-bold text-success">78%</p>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Utilisateurs sans 2FA</p>
                    <p className="text-2xl font-bold text-warning">22%</p>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Super Admins avec 2FA</p>
                    <p className="text-2xl font-bold">100%</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Configuration 2FA</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Méthode 2FA par défaut</Label>
                    <Select defaultValue="totp">
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="totp">TOTP (Authenticator App)</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Fournisseur SMS</Label>
                    <Select defaultValue="twilio">
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="twilio">Twilio</SelectItem>
                        <SelectItem value="aws">AWS SNS</SelectItem>
                        <SelectItem value="firebase">Firebase</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSaveSettings} className="gradient-hero border-0 w-full">
                    Sauvegarder
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminSecurity;
