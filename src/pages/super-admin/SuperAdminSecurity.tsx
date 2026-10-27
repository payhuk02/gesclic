import { useEffect, useState } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Shield, Lock, Key, Fingerprint, Monitor, AlertTriangle, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { fromAdmin } from "@/lib/admin-db";

const defaults = {
  enforce2FA: false,
  sessionTimeout: 30,
  maxLoginAttempts: 5,
  passwordMinLength: 8,
  requireStrongPassword: true,
  ipWhitelist: "",
  ipBlacklist: "",
};

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: string;
  details: unknown;
  resolved: boolean;
  created_at: string;
  user_id: string | null;
}

const SuperAdminSecurity = () => {
  const { settings, setSettings, loading, save } = usePlatformSettings("security", defaults);
  const [events, setEvents] = useState<SecurityEvent[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await fromAdmin("security_events")
        .select("id, event_type, severity, details, resolved, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(100);
      setEvents((data ?? []) as SecurityEvent[]);
    };
    load();
  }, []);

  const severityColor: Record<string, string> = {
    critical: "bg-destructive/10 text-destructive",
    high: "bg-destructive/10 text-destructive",
    warning: "bg-warning/10 text-warning",
    medium: "bg-warning/10 text-warning",
    info: "bg-blue-500/10 text-blue-600",
    low: "bg-blue-500/10 text-blue-600",
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Security Center</h1>
          <p className="text-muted-foreground">Paramètres enregistrés et événements réels</p>
        </div>
        <Tabs defaultValue="settings">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="settings"><Shield className="w-4 h-4 mr-1" />Paramètres</TabsTrigger>
            <TabsTrigger value="sessions"><Monitor className="w-4 h-4 mr-1" />Sessions</TabsTrigger>
            <TabsTrigger value="events"><AlertTriangle className="w-4 h-4 mr-1" />Événements</TabsTrigger>
            <TabsTrigger value="2fa"><Fingerprint className="w-4 h-4 mr-1" />2FA</TabsTrigger>
          </TabsList>
          <TabsContent value="settings" className="space-y-4 mt-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="w-5 h-5" />Mot de passe</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Longueur minimale</Label>
                    <Input type="number" value={settings.passwordMinLength} onChange={(e) => setSettings({ ...settings, passwordMinLength: Number(e.target.value) })} className="mt-1" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Exiger mot de passe fort</Label>
                    <Switch checked={settings.requireStrongPassword} onCheckedChange={(checked) => setSettings({ ...settings, requireStrongPassword: checked })} />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Key className="w-5 h-5" />Authentification</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Exiger 2FA</Label>
                    <Switch checked={settings.enforce2FA} onCheckedChange={(checked) => setSettings({ ...settings, enforce2FA: checked })} />
                  </div>
                  <div>
                    <Label>Tentatives max</Label>
                    <Input type="number" value={settings.maxLoginAttempts} onChange={(e) => setSettings({ ...settings, maxLoginAttempts: Number(e.target.value) })} className="mt-1" />
                  </div>
                  <div>
                    <Label>Expiration session (min)</Label>
                    <Input type="number" value={settings.sessionTimeout} onChange={(e) => setSettings({ ...settings, sessionTimeout: Number(e.target.value) })} className="mt-1" />
                  </div>
                </CardContent>
              </Card>
              <Card className="md:col-span-2">
                <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5" />Contrôle IP</CardTitle></CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>IPs autorisées</Label>
                    <textarea value={settings.ipWhitelist} onChange={(e) => setSettings({ ...settings, ipWhitelist: e.target.value })} className="mt-1 w-full p-2 border rounded-lg bg-background min-h-24" />
                  </div>
                  <div>
                    <Label>IPs bloquées</Label>
                    <textarea value={settings.ipBlacklist} onChange={(e) => setSettings({ ...settings, ipBlacklist: e.target.value })} className="mt-1 w-full p-2 border rounded-lg bg-background min-h-24" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <Button onClick={() => save()} disabled={loading} className="gradient-hero border-0">Sauvegarder</Button>
          </TabsContent>
          <TabsContent value="sessions" className="mt-4">
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Les sessions Auth ne sont pas exposées en base publique. Aucune donnée fictive n'est affichée.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="events" className="mt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Critiques</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{events.filter((e) => e.severity === "critical" || e.severity === "high").length}</div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Non résolus</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{events.filter((e) => !e.resolved).length}</div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{events.length}</div></CardContent></Card>
            </div>
            <Card>
              <CardHeader><CardTitle>Événements de sécurité</CardTitle></CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-12">Aucun événement enregistré</p>
                ) : (
                  <div className="space-y-3">
                    {events.map((event) => (
                      <div key={event.id} className="p-4 border rounded-lg">
                        <div className="flex gap-2 mb-2">
                          <Badge className={severityColor[event.severity] ?? severityColor.info}>{event.severity}</Badge>
                          <Badge variant="outline">{event.event_type}</Badge>
                          <span className="text-xs text-muted-foreground ml-auto">{new Date(event.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-sm">{typeof event.details === "string" ? event.details : JSON.stringify(event.details ?? {})}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="2fa" className="mt-4">
            <Card>
              <CardHeader><CardTitle>2FA plateforme</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Forcer l'authentification à deux facteurs pour tous les comptes.</p>
                <Switch checked={settings.enforce2FA} onCheckedChange={(checked) => setSettings({ ...settings, enforce2FA: checked })} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminSecurity;
