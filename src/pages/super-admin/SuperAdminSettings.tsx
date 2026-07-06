import { useState } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import {
  Settings,
  Globe,
  Shield,
  Bell,
  CreditCard,
  Mail,
  Save,
  ToggleRight,
  ToggleLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const SuperAdminSettings = () => {
  const [settings, setSettings] = useState({
    platformName: "Gesclic",
    platformUrl: "https://gesclic.com",
    supportEmail: "support@gesclic.com",
    maxClinicsPerPlan: {
      free: 1,
      standard: 3,
      pro: 10,
      enterprise: -1,
    },
    maintenanceMode: false,
    registrationEnabled: true,
    requireEmailVerification: true,
    defaultPlan: "free",
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    securityAlerts: true,
    billingAlerts: true,
    systemAlerts: true,
  });

  const handleSave = () => {
    toast.success("Paramètres sauvegardés");
  };

  const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <span className="text-sm text-foreground">{label}</span>
      <button onClick={onChange} className="text-primary">
        {checked ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
      </button>
    </div>
  );

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Platform Settings</h1>
          <p className="text-muted-foreground">Configuration globale de la plateforme</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="general"><Globe className="w-4 h-4 mr-1" />Général</TabsTrigger>
            <TabsTrigger value="security"><Shield className="w-4 h-4 mr-1" />Sécurité</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-1" />Notifications</TabsTrigger>
            <TabsTrigger value="billing"><CreditCard className="w-4 h-4 mr-1" />Facturation</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Informations de la Plateforme</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Nom de la plateforme</Label>
                  <Input
                    value={settings.platformName}
                    onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>URL de la plateforme</Label>
                  <Input
                    value={settings.platformUrl}
                    onChange={(e) => setSettings({ ...settings, platformUrl: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Email de support</Label>
                  <Input
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <Button onClick={handleSave} className="gradient-hero border-0">
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder
                </Button>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Limites par Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(settings.maxClinicsPerPlan).map(([plan, limit]) => (
                  <div key={plan}>
                    <Label>{plan.charAt(0).toUpperCase() + plan.slice(1)} - Max Cliniques</Label>
                    <Input
                      type="number"
                      value={limit === -1 ? "Illimité" : limit}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          maxClinicsPerPlan: {
                            ...settings.maxClinicsPerPlan,
                            [plan]: e.target.value === "Illimité" ? -1 : parseInt(e.target.value),
                          },
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de Sécurité</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Toggle
                  checked={settings.maintenanceMode}
                  onChange={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                  label="Mode Maintenance"
                />
                <Toggle
                  checked={settings.registrationEnabled}
                  onChange={() => setSettings({ ...settings, registrationEnabled: !settings.registrationEnabled })}
                  label="Autoriser les nouvelles inscriptions"
                />
                <Toggle
                  checked={settings.requireEmailVerification}
                  onChange={() => setSettings({ ...settings, requireEmailVerification: !settings.requireEmailVerification })}
                  label="Exiger la vérification par email"
                />
                <div className="pt-4">
                  <Label>Plan par défaut pour les nouveaux utilisateurs</Label>
                  <select
                    value={settings.defaultPlan}
                    onChange={(e) => setSettings({ ...settings, defaultPlan: e.target.value })}
                    className="mt-1 w-full p-2 border border-border rounded-lg bg-background"
                  >
                    <option value="free">Gratuit</option>
                    <option value="standard">Standard</option>
                    <option value="pro">Pro</option>
                  </select>
                </div>
                <Button onClick={handleSave} className="gradient-hero border-0">
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Alertes Système</CardTitle>
              </CardHeader>
              <CardContent>
                <Toggle
                  checked={notifications.emailAlerts}
                  onChange={() => setNotifications({ ...notifications, emailAlerts: !notifications.emailAlerts })}
                  label="Alertes par email"
                />
                <Toggle
                  checked={notifications.securityAlerts}
                  onChange={() => setNotifications({ ...notifications, securityAlerts: !notifications.securityAlerts })}
                  label="Alertes de sécurité"
                />
                <Toggle
                  checked={notifications.billingAlerts}
                  onChange={() => setNotifications({ ...notifications, billingAlerts: !notifications.billingAlerts })}
                  label="Alertes de facturation"
                />
                <Toggle
                  checked={notifications.systemAlerts}
                  onChange={() => setNotifications({ ...notifications, systemAlerts: !notifications.systemAlerts })}
                  label="Alertes système"
                />
                <Button onClick={handleSave} className="gradient-hero border-0 mt-4">
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Configuration de Facturation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Devise par défaut</Label>
                  <Input value="XOF (FCFA)" disabled className="mt-1" />
                </div>
                <div>
                  <Label>Intégration de paiement</Label>
                  <select className="mt-1 w-full p-2 border border-border rounded-lg bg-background">
                    <option>Orange Money</option>
                    <option>MTN Mobile Money</option>
                    <option>Wave</option>
                    <option>Carte bancaire</option>
                  </select>
                </div>
                <Button onClick={handleSave} className="gradient-hero border-0">
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminSettings;
