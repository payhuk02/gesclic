import AppLayout from "@/components/layout/AppLayout";
import { useState, useEffect } from "react";
import { Webhook, Plus, Trash2, RefreshCw, Clock, CheckCircle, AlertCircle, Loader2, Globe, Send, Copy, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { webhookService } from "@/services/webhook.service";
import { useClinic } from "@/contexts/ClinicContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";

interface WebhookSubscriptionForm {
  name: string;
  eventType: string;
  endpointUrl: string;
  secret: string;
}

const emptyForm: WebhookSubscriptionForm = {
  name: "",
  eventType: "",
  endpointUrl: "",
  secret: "",
};

const Webhooks = () => {
  const { activeClinicId } = useClinic();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [deliveryStats, setDeliveryStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [form, setForm] = useState<WebhookSubscriptionForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (activeClinicId) {
      loadData();
    }
  }, [activeClinicId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const subs = await webhookService.getSubscriptions(activeClinicId);
      setSubscriptions(subs);

      // Get delivery stats for first subscription if available
      if (subs.length > 0) {
        const stats = await webhookService.getDeliveryStats(subs[0].id, 30);
        setDeliveryStats(stats);
      }
    } catch (error) {
      console.error("Error loading webhook data:", error);
      toast.error("Erreur lors du chargement des webhooks");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { user } = useAuth();
      if (!user) return;

      await webhookService.createSubscription(
        user.id,
        activeClinicId,
        form.name,
        form.endpointUrl,
        [form.eventType]
      );

      setCreateDialogOpen(false);
      setForm(emptyForm);
      loadData();
      toast.success("Webhook créé avec succès");
    } catch (error) {
      console.error("Error creating webhook subscription:", error);
      toast.error("Erreur lors de la création du webhook");
    }
  };

  const handleDeleteSubscription = async (subscriptionId: string) => {
    try {
      await webhookService.deleteSubscription(subscriptionId);
      loadData();
      toast.success("Webhook supprimé");
    } catch (error) {
      console.error("Error deleting webhook subscription:", error);
      toast.error("Erreur lors de la suppression du webhook");
    }
  };

  const handleTriggerEvent = async (eventType: string, eventData: any) => {
    try {
      await webhookService.triggerEvent(eventType, eventData);
      toast.success("Événement déclenché avec succès");
      loadData();
    } catch (error) {
      console.error("Error triggering webhook event:", error);
      toast.error("Erreur lors du déclenchement de l'événement");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copié dans le presse-papiers");
  };

  const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
    delivered: { label: "Livré", icon: CheckCircle, className: "bg-success/10 text-success border-success/20" },
    failed: { label: "Échoué", icon: AlertCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
    pending: { label: "En attente", icon: Clock, className: "bg-warning/10 text-warning border-warning/20" },
  };

  const eventTypes = [
    "appointment.created",
    "appointment.updated",
    "appointment.cancelled",
    "patient.created",
    "patient.updated",
    "payment.received",
    "payment.failed",
    "prescription.created",
  ];

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch = sub.event_type.toLowerCase().includes(search.toLowerCase()) ||
                         sub.endpoint_url.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? sub.active : !sub.active);
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout title="Webhooks">
      <Tabs defaultValue="subscriptions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
          <TabsTrigger value="events">Événements</TabsTrigger>
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau Webhook
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Créer un Webhook</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateSubscription} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Type d'Événement</Label>
                    <Select value={form.eventType} onValueChange={(v) => setForm({ ...form, eventType: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>URL Endpoint</Label>
                    <Input
                      placeholder="https://votre-endpoint.com/webhook"
                      value={form.endpointUrl}
                      onChange={(e) => setForm({ ...form, endpointUrl: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Secret (Optionnel)</Label>
                    <Input
                      type="password"
                      placeholder="Secret pour signature HMAC"
                      value={form.secret}
                      onChange={(e) => setForm({ ...form, secret: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full">Créer le Webhook</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <EmptyState
              icon={Webhook}
              title="Aucun webhook"
              description="Créez votre premier webhook pour recevoir des notifications en temps réel"
            />
          ) : (
            <div className="grid gap-4">
              {filteredSubscriptions.map((sub) => (
                <Card key={sub.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={sub.active ? "default" : "secondary"}>
                            {sub.active ? "Actif" : "Inactif"}
                          </Badge>
                          <span className="font-mono text-sm">{sub.event_type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground truncate">{sub.endpoint_url}</p>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(sub.endpoint_url)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Créé le {new Date(sub.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteSubscription(sub.id)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Événements Webhook
              </CardTitle>
              <CardDescription>
                Historique des événements webhook récents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : events.length === 0 ? (
                <EmptyState
                  icon={Send}
                  title="Aucun événement"
                  description="Les événements webhook apparaîtront ici"
                />
              ) : (
                <div className="space-y-3">
                  {events.map((event) => {
                    const config = statusConfig[event.delivery_status] || statusConfig.pending;
                    const StatusIcon = config.icon;
                    return (
                      <div key={event.id} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <Badge className={config.className}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                        <div className="flex-1">
                          <p className="font-medium">{event.event_type}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.created_at).toLocaleString()}
                          </p>
                        </div>
                        {event.retry_count > 0 && (
                          <Badge variant="outline">{event.retry_count} retry</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Statistiques de Livraison
              </CardTitle>
              <CardDescription>
                Statistiques de livraison des webhooks sur les 30 derniers jours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {deliveryStats ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Livrés</p>
                      <p className="text-2xl font-bold text-success">{deliveryStats.total_delivered}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Échoués</p>
                      <p className="text-2xl font-bold text-destructive">{deliveryStats.total_failed}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Taux de Succès</p>
                      <p className="text-2xl font-bold">{deliveryStats.success_rate?.toFixed(1)}%</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Temps Moyen</p>
                      <p className="text-2xl font-bold">{deliveryStats.average_delivery_time}ms</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold">Livraisons par Type d'Événement</h3>
                    {deliveryStats.deliveries_by_event_type && deliveryStats.deliveries_by_event_type.length > 0 ? (
                      <div className="space-y-2">
                        {deliveryStats.deliveries_by_event_type.map((item: any) => (
                          <div key={item.event_type} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                            <div className="flex-1 font-mono text-sm">{item.event_type}</div>
                            <Badge variant="outline">{item.count} livraisons</Badge>
                            <Badge className={item.success_rate >= 90 ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}>
                              {item.success_rate.toFixed(1)}% succès
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState icon={Globe} title="Pas de données" description="Aucune donnée de livraison disponible" />
                    )}
                  </div>
                </>
              ) : (
                <EmptyState icon={RefreshCw} title="Pas de données" description="Aucune statistique disponible" />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Webhooks;
