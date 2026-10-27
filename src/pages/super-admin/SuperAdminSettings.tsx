import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Globe, Shield, Bell, Save, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { GENERAL_SITE_DEFAULTS, LEGAL_SITE_DEFAULTS } from "@/lib/site-content";

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
  const general = usePlatformSettings("general", GENERAL_SITE_DEFAULTS);
  const legal = usePlatformSettings("legal", LEGAL_SITE_DEFAULTS);
  const notifications = usePlatformSettings("notifications", notificationDefaults);

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Paramètres de la plateforme</h1>
          <p className="text-muted-foreground">Ces textes alimentent le pied de page et les pages publiques.</p>
        </div>
        <Tabs defaultValue="general">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="general"><Globe className="w-4 h-4 mr-1" />Général</TabsTrigger>
            <TabsTrigger value="pages"><FileText className="w-4 h-4 mr-1" />Pages & footer</TabsTrigger>
            <TabsTrigger value="security"><Shield className="w-4 h-4 mr-1" />Sécurité</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-1" />Notifications</TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Identité</CardTitle>
                <CardDescription>Nom, contact et mentions du pied de page (site public).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Nom</Label><Input className="mt-1" value={general.settings.platformName} onChange={(e) => general.setSettings({ ...general.settings, platformName: e.target.value })} /></div>
                <div><Label>URL</Label><Input className="mt-1" value={general.settings.platformUrl} onChange={(e) => general.setSettings({ ...general.settings, platformUrl: e.target.value })} /></div>
                <div><Label>Accroche (footer)</Label><Input className="mt-1" value={general.settings.tagline} onChange={(e) => general.setSettings({ ...general.settings, tagline: e.target.value })} /></div>
                <div><Label>Email support</Label><Input className="mt-1" type="email" value={general.settings.supportEmail} onChange={(e) => general.setSettings({ ...general.settings, supportEmail: e.target.value })} /></div>
                <div><Label>Téléphone</Label><Input className="mt-1" value={general.settings.phone} onChange={(e) => general.setSettings({ ...general.settings, phone: e.target.value })} /></div>
                <div><Label>Adresse</Label><Input className="mt-1" value={general.settings.address} onChange={(e) => general.setSettings({ ...general.settings, address: e.target.value })} /></div>
                <div><Label>Mention copyright</Label><Input className="mt-1" value={general.settings.footerNote} onChange={(e) => general.setSettings({ ...general.settings, footerNote: e.target.value })} /></div>
                <Button onClick={() => general.save()} disabled={general.saving} className="gradient-hero border-0"><Save className="w-4 h-4 mr-2" />Sauvegarder</Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="pages" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">Markdown accepté. Les pages /confidentialite, /cgu, /rgpd, /documentation et /contact se mettent à jour après enregistrement.</p>
            {([
              ["privacyTitle", "privacyBody", "Confidentialité"],
              ["termsTitle", "termsBody", "CGU"],
              ["rgpdTitle", "rgpdBody", "RGPD"],
              ["docsTitle", "docsBody", "Documentation"],
              ["contactTitle", "contactBody", "Contact"],
            ] as const).map(([titleKey, bodyKey, label]) => (
              <Card key={titleKey}>
                <CardHeader><CardTitle className="text-lg">{label}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Titre</Label>
                    <Input className="mt-1" value={legal.settings[titleKey]} onChange={(e) => legal.setSettings({ ...legal.settings, [titleKey]: e.target.value })} />
                  </div>
                  <div>
                    <Label>Contenu</Label>
                    <Textarea className="mt-1 min-h-[180px] font-mono text-xs" value={legal.settings[bodyKey]} onChange={(e) => legal.setSettings({ ...legal.settings, [bodyKey]: e.target.value })} />
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button onClick={() => legal.save()} disabled={legal.saving} className="gradient-hero border-0">
              <Save className="w-4 h-4 mr-2" />Sauvegarder les pages
            </Button>
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
