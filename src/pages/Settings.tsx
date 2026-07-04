import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Bell, Shield, CreditCard, Palette, Globe,
  Upload, Save, ToggleLeft, ToggleRight, Clock,
} from "lucide-react";
import { useState } from "react";

const Settings = () => {
  const [notifications, setNotifications] = useState({
    smsReminder: true, whatsappReminder: true, emailNotif: true,
    reminder24h: true, reminder1h: false, resultReady: true,
  });

  const toggle = (key: keyof typeof notifications) =>
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));

  const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <span className="text-sm text-foreground">{label}</span>
      <button onClick={onChange} className="text-primary">
        {checked ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
      </button>
    </div>
  );

  return (
    <AppLayout title="Paramètres">
      <Tabs defaultValue="clinic" className="space-y-6">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="clinic"><Building2 className="w-4 h-4 mr-1" />Clinique</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-1" />Notifications</TabsTrigger>
          <TabsTrigger value="security"><Shield className="w-4 h-4 mr-1" />Sécurité</TabsTrigger>
          <TabsTrigger value="billing"><CreditCard className="w-4 h-4 mr-1" />Abonnement</TabsTrigger>
          <TabsTrigger value="appearance"><Palette className="w-4 h-4 mr-1" />Apparence</TabsTrigger>
        </TabsList>

        {/* CLINIC */}
        <TabsContent value="clinic">
          <div className="bg-card rounded-xl p-6 border border-border space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Profil de la clinique</h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-10 h-10 text-primary" />
              </div>
              <Button variant="outline" size="sm" className="gap-2"><Upload className="w-4 h-4" />Changer le logo</Button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Nom de la clinique</Label><Input defaultValue="Clinique Gesclic Abidjan" className="mt-1" /></div>
              <div><Label>Email</Label><Input defaultValue="contact@gesclic-abidjan.com" className="mt-1" /></div>
              <div><Label>Téléphone</Label><Input defaultValue="+225 27 22 33 44 55" className="mt-1" /></div>
              <div><Label>Adresse</Label><Input defaultValue="Cocody, Abidjan, Côte d'Ivoire" className="mt-1" /></div>
              <div><Label>Pays</Label><Input defaultValue="Côte d'Ivoire" className="mt-1" /></div>
              <div><Label>Site web</Label><Input defaultValue="www.gesclic-abidjan.com" className="mt-1" /></div>
            </div>

            <div className="pt-4">
              <h4 className="font-medium text-foreground mb-3 flex items-center gap-2"><Clock className="w-4 h-4" />Horaires d'ouverture</h4>
              <div className="grid sm:grid-cols-2 gap-3">
                {["Lundi - Vendredi", "Samedi", "Dimanche"].map((day, i) => (
                  <div key={day} className="flex items-center gap-3 bg-secondary/30 rounded-lg p-3">
                    <span className="text-sm font-medium text-foreground w-36">{day}</span>
                    <Input defaultValue={i === 0 ? "08:00 - 18:00" : i === 1 ? "08:00 - 13:00" : "Fermé"} className="text-sm" />
                  </div>
                ))}
              </div>
            </div>

            <Button className="gradient-hero border-0 gap-2"><Save className="w-4 h-4" />Sauvegarder</Button>
          </div>
        </TabsContent>

        {/* NOTIFICATIONS */}
        <TabsContent value="notifications">
          <div className="bg-card rounded-xl p-6 border border-border space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Notifications & Rappels</h3>
            <div className="bg-secondary/30 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-foreground mb-2">Canaux</h4>
              <Toggle checked={notifications.smsReminder} onChange={() => toggle("smsReminder")} label="Rappels SMS" />
              <Toggle checked={notifications.whatsappReminder} onChange={() => toggle("whatsappReminder")} label="Rappels WhatsApp" />
              <Toggle checked={notifications.emailNotif} onChange={() => toggle("emailNotif")} label="Notifications email" />
            </div>
            <div className="bg-secondary/30 rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-2">Automatisations</h4>
              <Toggle checked={notifications.reminder24h} onChange={() => toggle("reminder24h")} label="Rappel 24h avant le rendez-vous" />
              <Toggle checked={notifications.reminder1h} onChange={() => toggle("reminder1h")} label="Rappel 1h avant le rendez-vous" />
              <Toggle checked={notifications.resultReady} onChange={() => toggle("resultReady")} label="Notification résultat disponible" />
            </div>
            <Button className="gradient-hero border-0 gap-2"><Save className="w-4 h-4" />Sauvegarder</Button>
          </div>
        </TabsContent>

        {/* SECURITY */}
        <TabsContent value="security">
          <div className="bg-card rounded-xl p-6 border border-border space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Sécurité</h3>
            <div className="space-y-4">
              <div><Label>Mot de passe actuel</Label><Input type="password" className="mt-1 max-w-md" /></div>
              <div><Label>Nouveau mot de passe</Label><Input type="password" className="mt-1 max-w-md" /></div>
              <div><Label>Confirmer le mot de passe</Label><Input type="password" className="mt-1 max-w-md" /></div>
            </div>
            <div className="bg-secondary/30 rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-2">Authentification à deux facteurs</h4>
              <p className="text-sm text-muted-foreground mb-3">Ajoutez une couche de sécurité supplémentaire à votre compte.</p>
              <Button variant="outline">Activer le 2FA</Button>
            </div>
            <div className="bg-secondary/30 rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-2">Sessions actives</h4>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Chrome — MacOS</p>
                  <p className="text-xs text-muted-foreground">Abidjan, CI · Dernière activité: il y a 2 min</p>
                </div>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">Active</Badge>
              </div>
            </div>
            <Button className="gradient-hero border-0 gap-2"><Save className="w-4 h-4" />Mettre à jour</Button>
          </div>
        </TabsContent>

        {/* BILLING */}
        <TabsContent value="billing">
          <div className="space-y-4">
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Plan actuel</h3>
                  <p className="text-sm text-muted-foreground">Vous êtes sur le plan Pro</p>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20 text-sm px-4 py-1" variant="outline">Pro</Badge>
              </div>
              <div className="grid sm:grid-cols-3 gap-4 mb-4">
                <div className="bg-secondary/30 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">29 900</p>
                  <p className="text-xs text-muted-foreground">FCFA / mois</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">∞</p>
                  <p className="text-xs text-muted-foreground">Médecins</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">∞</p>
                  <p className="text-xs text-muted-foreground">Patients</p>
                </div>
              </div>
              <Button variant="outline">Changer de plan</Button>
            </div>

            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">Historique de facturation</h3>
              <div className="space-y-3">
                {[
                  { date: "Mars 2024", amount: "29 900 FCFA", status: "Payé" },
                  { date: "Février 2024", amount: "29 900 FCFA", status: "Payé" },
                  { date: "Janvier 2024", amount: "29 900 FCFA", status: "Payé" },
                ].map((inv) => (
                  <div key={inv.date} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm text-foreground">{inv.date}</span>
                    <span className="text-sm font-medium text-foreground">{inv.amount}</span>
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">{inv.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* APPEARANCE */}
        <TabsContent value="appearance">
          <div className="bg-card rounded-xl p-6 border border-border space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Apparence & Personnalisation</h3>
            <div>
              <Label>Couleur principale</Label>
              <div className="flex gap-3 mt-2">
                {["#0EA5E9", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444"].map((color) => (
                  <button key={color} className="w-10 h-10 rounded-xl border-2 border-border hover:border-primary transition-colors" style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
            <div>
              <Label>Langue</Label>
              <div className="flex gap-2 mt-2">
                <Button variant="default" size="sm"><Globe className="w-4 h-4 mr-1" />Français</Button>
                <Button variant="outline" size="sm">English</Button>
              </div>
            </div>
            <Button className="gradient-hero border-0 gap-2"><Save className="w-4 h-4" />Sauvegarder</Button>
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Settings;
