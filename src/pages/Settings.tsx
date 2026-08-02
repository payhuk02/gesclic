import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2, Bell, Shield, CreditCard, Palette, Globe,
  Upload, Save, Clock, ShieldAlert, Loader2, ArrowRight, User,
  ToggleLeft, ToggleRight, Check,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useClinic } from "@/contexts/ClinicContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import {
  clinicSettingsService,
  DEFAULT_CLINIC_PROFILE_SETTINGS,
  DEFAULT_NOTIFICATION_SETTINGS,
  type ClinicProfileSettings,
  type ClinicNotificationSettings,
} from "@/services/clinic-settings.service";
import { getClinicPlan } from "@/lib/clinic-plans";

const Settings = () => {
  const { activeClinicId, activeClinic, hasClinicRole, refetch, loading: clinicLoading } = useClinic();
  const { user, profile, hasRole, refetchProfile } = useAuth();
  const canManage = hasRole("admin") || hasClinicRole("admin");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [clinicName, setClinicName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [settings, setSettings] = useState<ClinicProfileSettings>(DEFAULT_CLINIC_PROFILE_SETTINGS);
  const [notifications, setNotifications] = useState<ClinicNotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = useCallback(async () => {
    if (!activeClinicId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const profileData = await clinicSettingsService.getClinicProfile(activeClinicId);
      if (profileData) {
        setClinicName(profileData.name);
        setLogoUrl(profileData.logo_url);
        setSettings(profileData.settings);
        setNotifications(profileData.settings.notifications);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [activeClinicId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    setFirstName(profile?.first_name ?? "");
    setLastName(profile?.last_name ?? "");
  }, [profile]);

  const updateSetting = <K extends keyof Omit<ClinicProfileSettings, "notifications" | "opening_hours">>(
    key: K,
    value: ClinicProfileSettings[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateOpeningHour = (key: keyof ClinicProfileSettings["opening_hours"], value: string) => {
    setSettings((prev) => ({
      ...prev,
      opening_hours: { ...prev.opening_hours, [key]: value },
    }));
  };

  const toggleNotification = (key: keyof ClinicNotificationSettings) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage || !activeClinicId) {
      toast.error("Action réservée aux administrateurs de la clinique.");
      return;
    }
    if (!clinicName.trim()) {
      toast.error("Le nom de la clinique est obligatoire");
      return;
    }

    setSaving(true);
    try {
      const { notifications: _n, ...profileFields } = settings;
      await clinicSettingsService.updateClinicProfile(
        activeClinicId,
        { name: clinicName, logo_url: logoUrl, settings: { ...profileFields, notifications } },
        settings,
      );
      await refetch();
      toast.success("Profil clinique enregistré");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage || !activeClinicId) {
      toast.error("Action réservée aux administrateurs de la clinique.");
      return;
    }

    setSavingNotifications(true);
    try {
      await clinicSettingsService.updateClinicProfile(
        activeClinicId,
        { settings: { notifications } },
        settings,
      );
      setSettings((prev) => ({ ...prev, notifications }));
      toast.success("Préférences de notification enregistrées");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la sauvegarde");
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!firstName.trim()) {
      toast.error("Le prénom est obligatoire");
      return;
    }

    setSavingAccount(true);
    try {
      await clinicSettingsService.updateUserProfile(user.id, {
        first_name: firstName,
        last_name: lastName,
      });
      await refetchProfile();
      toast.success("Profil utilisateur enregistré");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la sauvegarde");
    } finally {
      setSavingAccount(false);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeClinicId || !canManage) return;

    setUploadingLogo(true);
    try {
      const url = await clinicSettingsService.uploadClinicLogo(activeClinicId, file);
      setLogoUrl(url);
      await clinicSettingsService.updateClinicProfile(activeClinicId, { logo_url: url });
      await refetch();
      toast.success("Logo mis à jour");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur upload logo");
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const currentPlan = getClinicPlan(activeClinic?.plan);
  const inputsDisabled = !canManage || saving || uploadingLogo;

  const Toggle = ({
    checked,
    onChange,
    label,
    hint,
    disabled,
  }: {
    checked: boolean;
    onChange: () => void;
    label: string;
    hint?: string;
    disabled?: boolean;
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0 gap-4">
      <div>
        <span className="text-sm text-foreground">{label}</span>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <button type="button" onClick={onChange} disabled={disabled} className="text-primary disabled:opacity-50">
        {checked ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
      </button>
    </div>
  );

  if (clinicLoading || loading) {
    return (
      <AppLayout title="Paramètres">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!activeClinicId) {
    return (
      <AppLayout title="Paramètres">
        <EmptyState
          icon={Building2}
          title="Aucune clinique active"
          description="Sélectionnez ou créez une clinique pour accéder aux paramètres."
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Paramètres">
      {!canManage && (
        <Card className="mb-6 border-warning/30 bg-warning/5">
          <CardContent className="py-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Consultation seule</p>
              <p className="text-muted-foreground">
                Seuls les administrateurs de la clinique peuvent modifier le profil clinique et les notifications.
                Votre profil personnel reste modifiable dans l&apos;onglet Compte.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="flex flex-wrap w-full h-auto gap-1">
          <TabsTrigger value="account" className="flex-1 sm:flex-none"><User className="w-4 h-4 mr-1" />Compte</TabsTrigger>
          <TabsTrigger value="clinic" className="flex-1 sm:flex-none"><Building2 className="w-4 h-4 mr-1" />Clinique</TabsTrigger>
          <TabsTrigger value="notifications" className="flex-1 sm:flex-none"><Bell className="w-4 h-4 mr-1" />Notifications</TabsTrigger>
          <TabsTrigger value="security" className="flex-1 sm:flex-none"><Shield className="w-4 h-4 mr-1" />Sécurité</TabsTrigger>
          <TabsTrigger value="billing" className="flex-1 sm:flex-none"><CreditCard className="w-4 h-4 mr-1" />Abonnement</TabsTrigger>
          <TabsTrigger value="appearance" className="flex-1 sm:flex-none"><Palette className="w-4 h-4 mr-1" />Apparence</TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <form onSubmit={handleSaveAccount} className="bg-card rounded-xl p-6 border border-border space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Mon profil</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Informations personnelles visibles dans l&apos;application.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Prénom</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1" required />
              </div>
              <div>
                <Label>Nom</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1" />
              </div>
              <div className="sm:col-span-2">
                <Label>Email</Label>
                <Input value={user?.email ?? ""} className="mt-1" disabled />
                <p className="text-xs text-muted-foreground mt-1">L&apos;email de connexion ne peut pas être modifié ici.</p>
              </div>
            </div>
            <Button type="submit" className="gradient-hero border-0 gap-2" disabled={savingAccount}>
              {savingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer mon profil
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="clinic">
          <form onSubmit={handleSaveClinic} className="bg-card rounded-xl p-6 border border-border space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Profil de la clinique</h3>
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo clinique" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                )}
              </div>
              {canManage && (
                <>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 text-xs sm:text-sm"
                    disabled={uploadingLogo}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadingLogo ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : <Upload className="w-3 h-3 sm:w-4 sm:h-4" />}
                    Changer le logo
                  </Button>
                </>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Nom de la clinique</Label>
                <Input value={clinicName} onChange={(e) => setClinicName(e.target.value)} className="mt-1" disabled={inputsDisabled} required />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={settings.email} onChange={(e) => updateSetting("email", e.target.value)} className="mt-1" disabled={inputsDisabled} placeholder="contact@clinique.com" />
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input value={settings.phone} onChange={(e) => updateSetting("phone", e.target.value)} className="mt-1" disabled={inputsDisabled} placeholder="+225 ..." />
              </div>
              <div>
                <Label>Adresse</Label>
                <Input value={settings.address} onChange={(e) => updateSetting("address", e.target.value)} className="mt-1" disabled={inputsDisabled} />
              </div>
              <div>
                <Label>Pays</Label>
                <Input value={settings.country} onChange={(e) => updateSetting("country", e.target.value)} className="mt-1" disabled={inputsDisabled} />
              </div>
              <div>
                <Label>Site web</Label>
                <Input value={settings.website} onChange={(e) => updateSetting("website", e.target.value)} className="mt-1" disabled={inputsDisabled} placeholder="www.example.com" />
              </div>
            </div>
            <div className="pt-4">
              <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Horaires d&apos;ouverture
              </h4>
              <div className="grid sm:grid-cols-2 gap-3">
                {(
                  [
                    ["weekday", "Lundi - Vendredi"],
                    ["saturday", "Samedi"],
                    ["sunday", "Dimanche"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-3 bg-secondary/30 rounded-lg p-3">
                    <span className="text-sm font-medium text-foreground w-36">{label}</span>
                    <Input
                      value={settings.opening_hours[key]}
                      onChange={(e) => updateOpeningHour(key, e.target.value)}
                      className="text-sm"
                      disabled={inputsDisabled}
                    />
                  </div>
                ))}
              </div>
            </div>
            {canManage && (
              <Button type="submit" className="gradient-hero border-0 gap-2" disabled={saving || uploadingLogo}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Sauvegarder
              </Button>
            )}
          </form>
        </TabsContent>

        <TabsContent value="notifications">
          <form onSubmit={handleSaveNotifications} className="bg-card rounded-xl p-6 border border-border space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Notifications & Rappels</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Les rappels 24h in-app respectent le paramètre « Rappel 24h ». SMS/WhatsApp seront activés prochainement.
              </p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-2">Canaux</h4>
              <Toggle checked={notifications.smsReminder} onChange={() => toggleNotification("smsReminder")} label="Rappels SMS" hint="Bientôt disponible" disabled={!canManage} />
              <Toggle checked={notifications.whatsappReminder} onChange={() => toggleNotification("whatsappReminder")} label="Rappels WhatsApp" hint="Bientôt disponible" disabled={!canManage} />
              <Toggle checked={notifications.emailNotif} onChange={() => toggleNotification("emailNotif")} label="Notifications email" disabled={!canManage} />
            </div>
            <div className="bg-secondary/30 rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-2">Automatisations</h4>
              <Toggle checked={notifications.reminder24h} onChange={() => toggleNotification("reminder24h")} label="Rappel 24h avant le rendez-vous" hint="Actif — notifications in-app" disabled={!canManage} />
              <Toggle checked={notifications.reminder1h} onChange={() => toggleNotification("reminder1h")} label="Rappel 1h avant le rendez-vous" hint="Bientôt disponible" disabled={!canManage} />
              <Toggle checked={notifications.resultReady} onChange={() => toggleNotification("resultReady")} label="Notification résultat disponible" disabled={!canManage} />
            </div>
            {canManage && (
              <Button type="submit" className="gradient-hero border-0 gap-2" disabled={savingNotifications}>
                {savingNotifications ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Sauvegarder
              </Button>
            )}
          </form>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" />Sécurité du compte</CardTitle>
              <CardDescription>Mot de passe, 2FA, journaux d&apos;audit et sessions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                La gestion de la sécurité est centralisée sur la page dédiée.
              </p>
              <Button asChild className="gap-2">
                <Link to="/security">Ouvrir la page Sécurité<ArrowRight className="w-4 h-4" /></Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle>Plan actuel</CardTitle>
                    <CardDescription>Abonnement de la clinique active</CardDescription>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-sm px-4 py-1" variant="outline">
                    {currentPlan.name}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="bg-secondary/30 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{currentPlan.price}</p>
                    <p className="text-xs text-muted-foreground">{currentPlan.period ? `FCFA ${currentPlan.period}` : currentPlan.period || "—"}</p>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-4">
                    <p className="text-sm font-medium text-foreground mb-2">Inclus</p>
                    <ul className="space-y-1">
                      {currentPlan.features.slice(0, 3).map((f) => (
                        <li key={f} className="text-xs text-muted-foreground flex items-center gap-1">
                          <Check className="w-3 h-3 text-success" />{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-4 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground text-center">
                      Plan DB : <span className="font-medium text-foreground">{activeClinic?.plan ?? "free"}</span>
                    </p>
                  </div>
                </div>
                {canManage ? (
                  <Button variant="outline" asChild><Link to="/subscriptions">Changer de plan</Link></Button>
                ) : (
                  <p className="text-xs text-muted-foreground">Seuls les administrateurs peuvent modifier l&apos;abonnement.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Historique de facturation</CardTitle>
                <CardDescription>Factures et paiements d&apos;abonnement</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  L&apos;historique de facturation sera disponible lorsque la facturation en ligne sera activée.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5" />Apparence</CardTitle>
              <CardDescription>Thème et langue — disponible prochainement (pack P2).</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label>Langue (aperçu)</Label>
                <div className="flex gap-2 mt-2">
                  <Button variant="default" size="sm" disabled><Globe className="w-4 h-4 mr-1" />Français</Button>
                  <Button variant="outline" size="sm" disabled>English</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Settings;
