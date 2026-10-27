import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Globe, Shield, Bell, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";

const generalDefaults = {
  platformName: "Gesclic",
  platformUrl: "https://gesclic.com",
  supportEmail: "support@gesclic.com",
  maintenanceMode: false,
  registrationEnabled: true,
  requireEmailVerification: true,
  defaultPlan: "essentiel",
};

const notificationDefaults = {
  emailAlerts: true,
  securityAlerts: true,
  billingAlerts: true,
  systemAlerts: true,
};

const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
  <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
    <span className="text-sm">{label}</span>
    <button type="button" onClick={onChange} className="text-sm font-medium text-primary">
      {checked ? "Oui" : "Non"}
    </button>
  </div>
);

const SuperAdminSettings = () => {
  const general = usePlatformSettings("general", generalDefaults);
  const notifications = usePlatformSettings("notifications", notificationDefaults);

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Platform Settings</h1>
          <p className="text-muted-foreground">Paramètres enregistrés en base</p>
        </div>
        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general"><Globe className="w-4 h-4 mr-1" />Général</TabsTrigger>
            <TabsTrigger value="security"><Shield className="w-4 h-4 mr-1" />Sécurité</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-1" />Notifications</TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Nom</Label><Input className="mt-1" value={general.settings.platformName} onChange={(e) => general.setSettings({ ...general.settings, platformName: e.target.value })} /></div>
                <div><Label>URL</Label><Input className="mt-1" value={general.settings.platformUrl} onChange={(e) => general.setSettings({ ...general.settings, platformUrl: e.target.value })} /></div>
                <div><Label>Email support</Label><Input className="mt-1" value={general.settings.supportEmail} onChange={(e) => general.setSettings({ ...general.settings, supportEmail: e.target.value })} /></div>
                <Button onClick={() => general.save()} disabled={general.saving} className="gradient-hero border-0"><Save className="w-4 h-4 mr-2" />Sauvegarder</Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="security" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Accès</CardTitle></CardHeader>
              <CardContent>
                <Toggle checked={general.settings.maintenanceMode} onChange={() => general.setSettings({ ...general.settings, maintenanceMode: !general.settings.maintenanceMode })} label="Mode maintenance" />
                <Toggle checked={general.settings.registrationEnabled} onChange={() => general.setSettings({ ...general.settings, registrationEnabled: !general.settings.registrationEnabled })} label="Nouvelles inscriptions" />
                <Toggle checked={general.settings.requireEmailVerification} onChange={() => general.setSettings({ ...general.settings, requireEmailVerification: !general.settings.requireEmailVerification })} label="Vérification email" />
                <div className="pt-4">
                  <Label>Plan par défaut</Label>
                  <select className="mt-1 w-full p-2 border rounded-lg bg-background" value={general.settings.defaultPlan} onChange={(e) => general.setSettings({ ...general.settings, defaultPlan: e.target.value })}>
                    <option value="essentiel">Essentiel</option>
                    <option value="pro">Pro</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <Button onClick={() => general.save()} disabled={general.saving} className="gradient-hero border-0 mt-4"><Save className="w-4 h-4 mr-2" />Sauvegarder</Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="notifications" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Alertes</CardTitle></CardHeader>
              <CardContent>
                <Toggle checked={notifications.settings.emailAlerts} onChange={() => notifications.setSettings({ ...notifications.settings, emailAlerts: !notifications.settings.emailAlerts })} label="Alertes email" />
                <Toggle checked={notifications.settings.securityAlerts} onChange={() => notifications.setSettings({ ...notifications.settings, securityAlerts: !notifications.settings.securityAlerts })} label="Alertes sécurité" />
                <Toggle checked={notifications.settings.billingAlerts} onChange={() => notifications.setSettings({ ...notifications.settings, billingAlerts: !notifications.settings.billingAlerts })} label="Alertes facturation" />
                <Toggle checked={notifications.settings.systemAlerts} onChange={() => notifications.setSettings({ ...notifications.settings, systemAlerts: !notifications.settings.systemAlerts })} label="Alertes système" />
                <Button onClick={() => notifications.save()} disabled={notifications.saving} className="gradient-hero border-0 mt-4"><Save className="w-4 h-4 mr-2" />Sauvegarder</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminSettings;
