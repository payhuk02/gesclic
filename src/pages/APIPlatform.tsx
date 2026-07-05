import AppLayout from "@/components/layout/AppLayout";
import { useState, useEffect } from "react";
import { Key, Clock, AlertTriangle, Copy, Plus, Trash2, RefreshCw, Loader2, Shield, Globe, Code, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiPlatformService } from "@/services/api-platform.service";
import { useClinic } from "@/contexts/ClinicContext";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";

interface APIKeyForm {
  name: string;
  scopes: string[];
  rateLimit: number;
  expiresIn: number;
}

const emptyForm: APIKeyForm = {
  name: "",
  scopes: ["read"],
  rateLimit: 1000,
  expiresIn: 365,
};

const APIPlatform = () => {
  const { activeClinicId } = useClinic();
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [requestLogs, setRequestLogs] = useState<any[]>([]);
  const [webhookSubscriptions, setWebhookSubscriptions] = useState<any[]>([]);
  const [usageSummary, setUsageSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [form, setForm] = useState<APIKeyForm>(emptyForm);
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);

  useEffect(() => {
    if (activeClinicId) {
      loadData();
    }
  }, [activeClinicId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [keys, subscriptions] = await Promise.all([
        apiPlatformService.getClinicAPIKeys(activeClinicId),
        apiPlatformService.getWebhookSubscriptions(activeClinicId),
      ]);

      setApiKeys(keys);
      setWebhookSubscriptions(subscriptions);
      
      // Get logs and usage for the first API key if available
      if (keys.length > 0) {
        const [logs, usage] = await Promise.all([
          apiPlatformService.getAPIRequestLogs(keys[0].id, 1, 50),
          apiPlatformService.getAPIUsageSummary(keys[0].id, 30),
        ]);
        setRequestLogs(logs);
        setUsageSummary(usage);
      }
    } catch (error) {
      console.error("Error loading API data:", error);
      toast.error("Erreur lors du chargement des données API");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAPIKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await apiPlatformService.createAPIKey(activeClinicId, {
        name: form.name,
        scopes: form.scopes,
        rate_limit: form.rateLimit,
        expires_in_days: form.expiresIn,
      });

      setNewKeySecret(result.secret);
      setCreateDialogOpen(false);
      setForm(emptyForm);
      loadData();
      toast.success("Clé API créée avec succès");
    } catch (error) {
      console.error("Error creating API key:", error);
      toast.error("Erreur lors de la création de la clé API");
    }
  };

  const handleDeleteAPIKey = async (keyId: string) => {
    try {
      await apiPlatformService.deleteAPIKey(keyId);
      loadData();
      toast.success("Clé API supprimée");
    } catch (error) {
      console.error("Error deleting API key:", error);
      toast.error("Erreur lors de la suppression de la clé API");
    }
  };

  const handleRevokeAPIKey = async (keyId: string) => {
    try {
      await apiPlatformService.revokeAPIKey(keyId);
      loadData();
      toast.success("Clé API révoquée");
    } catch (error) {
      console.error("Error revoking API key:", error);
      toast.error("Erreur lors de la révocation de la clé API");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copié dans le presse-papiers");
  };

  const scopeConfig: Record<string, { label: string; description: string }> = {
    read: { label: "Lecture", description: "Accès en lecture seule" },
    write: { label: "Écriture", description: "Accès en écriture" },
    admin: { label: "Admin", description: "Accès administrateur complet" },
  };

  const statusConfig: Record<string, { label: string; className: string }> = {
    active: { label: "Actif", className: "bg-success/10 text-success border-success/20" },
    revoked: { label: "Révoqué", className: "bg-destructive/10 text-destructive border-destructive/20" },
    expired: { label: "Expiré", className: "bg-warning/10 text-warning border-warning/20" },
  };

  return (
    <AppLayout title="API Platform">
      <Tabs defaultValue="keys" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="keys">Clés API</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="usage">Utilisation</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">{apiKeys.length} clé{apiKeys.length > 1 ? "s" : ""} API</p>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle Clé
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Créer une Clé API</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateAPIKey} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nom</Label>
                    <Input
                      placeholder="Ma clé API"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Scopes</Label>
                    <div className="space-y-2">
                      {Object.entries(scopeConfig).map(([key, config]) => (
                        <label key={key} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={form.scopes.includes(key)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm({ ...form, scopes: [...form.scopes, key] });
                              } else {
                                setForm({ ...form, scopes: form.scopes.filter((s) => s !== key) });
                              }
                            }}
                          />
                          <span className="text-sm">{config.label}</span>
                          <span className="text-xs text-muted-foreground">- {config.description}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Rate Limit (req/h)</Label>
                      <Input
                        type="number"
                        value={form.rateLimit}
                        onChange={(e) => setForm({ ...form, rateLimit: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Expiration (jours)</Label>
                      <Input
                        type="number"
                        value={form.expiresIn}
                        onChange={(e) => setForm({ ...form, expiresIn: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">Créer la Clé</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {newKeySecret && (
            <Card className="border-warning">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="w-5 h-5" />
                  <p className="font-semibold">Sauvegardez votre clé secrète</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Cette clé ne sera affichée qu'une seule fois. Sauvegardez-la maintenant.
                </p>
                <div className="flex gap-2">
                  <Input value={newKeySecret} readOnly className="font-mono" />
                  <Button size="icon" variant="outline" onClick={() => copyToClipboard(newKeySecret)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <Button onClick={() => setNewKeySecret(null)} className="w-full">
                  J'ai sauvegardé ma clé
                </Button>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : apiKeys.length === 0 ? (
            <EmptyState
              icon={Key}
              title="Aucune clé API"
              description="Créez votre première clé API pour commencer à utiliser l'API"
            />
          ) : (
            <div className="grid gap-4">
              {apiKeys.map((key) => {
                const config = statusConfig[key.status] || statusConfig.active;
                return (
                  <Card key={key.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{key.name}</h3>
                            <Badge className={config.className}>{config.label}</Badge>
                          </div>
                          <div className="flex items-center gap-2 font-mono text-sm bg-muted p-2 rounded">
                            <span>{key.key_prefix}••••••••</span>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(key.key_prefix)}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                            {key.scopes.map((scope: string) => (
                              <Badge key={scope} variant="outline">{scope}</Badge>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Créée le {new Date(key.created_at).toLocaleDateString()}
                            {key.expires_at && ` • Expire le ${new Date(key.expires_at).toLocaleDateString()}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {key.status === "active" && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handleRevokeAPIKey(key.id)}>
                                <Shield className="w-4 h-4 mr-2" />
                                Révoquer
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteAPIKey(key.id)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Logs de Requêtes
              </CardTitle>
              <CardDescription>
                Historique des requêtes API récentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : requestLogs.length === 0 ? (
                <EmptyState
                  icon={Code}
                  title="Aucun log"
                  description="Les requêtes API apparaîtront ici"
                />
              ) : (
                <div className="space-y-3">
                  {requestLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                      <Badge
                        variant={log.status_code >= 200 && log.status_code < 300 ? "default" : "destructive"}
                      >
                        {log.status_code}
                      </Badge>
                      <div className="flex-1">
                        <p className="font-medium">{log.method} {log.endpoint}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline">{log.response_time}ms</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Abonnements Webhook
              </CardTitle>
              <CardDescription>
                Gérez vos abonnements webhook pour les notifications en temps réel
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : webhookSubscriptions.length === 0 ? (
                <EmptyState
                  icon={Globe}
                  title="Aucun webhook"
                  description="Créez votre premier webhook pour recevoir des notifications"
                />
              ) : (
                <div className="space-y-3">
                  {webhookSubscriptions.map((sub) => (
                    <div key={sub.id} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{sub.event_type}</p>
                        <p className="text-sm text-muted-foreground">{sub.endpoint_url}</p>
                      </div>
                      <Badge variant={sub.active ? "default" : "secondary"}>
                        {sub.active ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Résumé d'Utilisation
              </CardTitle>
              <CardDescription>
                Statistiques d'utilisation de l'API sur les 30 derniers jours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {usageSummary ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Requêtes</p>
                      <p className="text-2xl font-bold">{usageSummary.total_requests}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Succès</p>
                      <p className="text-2xl font-bold text-success">{usageSummary.successful_requests}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Erreurs</p>
                      <p className="text-2xl font-bold text-destructive">{usageSummary.failed_requests}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Temps Moyen</p>
                      <p className="text-2xl font-bold">{usageSummary.average_response_time}ms</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold">Requêtes par Endpoint</h3>
                    {usageSummary.requests_by_endpoint && usageSummary.requests_by_endpoint.length > 0 ? (
                      <div className="space-y-2">
                        {usageSummary.requests_by_endpoint.map((item: any) => (
                          <div key={item.endpoint} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                            <div className="flex-1 font-mono text-sm">{item.endpoint}</div>
                            <Badge variant="outline">{item.count} requêtes</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState icon={Code} title="Pas de données" description="Aucune donnée d'utilisation disponible" />
                    )}
                  </div>
                </>
              ) : (
                <EmptyState icon={BarChart3} title="Pas de données" description="Aucune donnée d'utilisation disponible" />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default APIPlatform;
