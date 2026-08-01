import { useEffect, useState } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  Key,
  Search,
  Plus,
  Copy,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  MoreVertical,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  Globe,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";

interface APIKey {
  id: string;
  name: string;
  key: string | null; // plaintext only right after creation
  prefix: string;
  scopes: string[];
  rateLimit: number;
  status: "active" | "revoked" | "expired";
  createdAt: string;
  lastUsed?: string | null;
  expiresAt?: string | null;
  requests: number;
}

const SuperAdminAPIManagement = () => {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [newKey, setNewKey] = useState({
    name: "",
    scopes: [] as string[],
    rateLimit: 1000,
    expiresIn: "never",
  });

  const loadKeys = async () => {
    setLoading(true);
    try {
      const [keysRes, logsRes] = await Promise.all([
        supabase.from("api_keys").select("*").order("created_at", { ascending: false }),
        supabase.from("api_request_logs").select("api_key_id"),
      ]);
      if (keysRes.error) throw keysRes.error;

      const now = Date.now();
      setApiKeys(
        (keysRes.data ?? []).map((k: any) => ({
          id: k.id,
          name: k.name,
          key: null,
          prefix: k.key_prefix,
          scopes: k.scopes ?? [],
          rateLimit: k.requests_per_minute ?? 0,
          status: !k.is_active
            ? "revoked"
            : k.expires_at && new Date(k.expires_at).getTime() < now
            ? "expired"
            : "active",
          createdAt: k.created_at,
          lastUsed: k.last_used_at,
          expiresAt: k.expires_at,
          requests: (logsRes.data ?? []).filter((l: any) => l.api_key_id === k.id).length,
        }))
      );
    } catch (error) {
      console.error("Error loading API keys:", error);
      toast.error("Erreur lors du chargement des clés API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const statusConfig = {
    active: { label: "Actif", icon: CheckCircle, color: "bg-success/10 text-success border-success/20" },
    revoked: { label: "Révoqué", icon: XCircle, color: "bg-destructive/10 text-destructive border-destructive/20" },
    expired: { label: "Expiré", icon: Clock, color: "bg-warning/10 text-warning border-warning/20" },
  };

  const scopeConfig: Record<string, { label: string; color: string }> = {
    read: { label: "Read", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    write: { label: "Write", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
    admin: { label: "Admin", color: "bg-destructive/10 text-destructive border-destructive/20" },
  };

  const filteredKeys = apiKeys.filter((key) => {
    const matchesSearch =
      key.name.toLowerCase().includes(search.toLowerCase()) ||
      (key.prefix ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || key.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("Clé API copiée");
  };

  const handleToggleKeyVisibility = (keyId: string) => {
    setShowKeys({ ...showKeys, [keyId]: !showKeys[keyId] });
  };

  const handleRevokeKey = async (keyId: string) => {
    const { error } = await supabase.from("api_keys").update({ is_active: false }).eq("id", keyId);
    if (error) {
      toast.error("Erreur lors de la révocation");
      return;
    }
    toast.success("Clé API révoquée");
    loadKeys();
  };

  const handleDeleteKey = async (keyId: string) => {
    const { error } = await supabase.from("api_keys").delete().eq("id", keyId);
    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }
    toast.success("Clé API supprimée");
    loadKeys();
  };

  const toggleScope = (scope: string) => {
    setNewKey((prev) => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter((s) => s !== scope)
        : [...prev.scopes, scope],
    }));
  };

  const handleCreateKey = async () => {
    if (!newKey.name.trim()) {
      toast.error("Le nom de la clé est requis");
      return;
    }
    try {
      const { data: generated, error: genError } = await supabase.rpc("generate_api_key");
      if (genError || !generated) throw genError ?? new Error("generation failed");

      const { data: hashed, error: hashError } = await supabase.rpc("hash_api_key", {
        api_key: generated as string,
      });
      if (hashError) throw hashError;

      const expiresMap: Record<string, number | null> = { never: null, "30d": 30, "90d": 90, "1y": 365 };
      const days = expiresMap[newKey.expiresIn];

      const { data: userData } = await supabase.auth.getUser();

      const { data: inserted, error } = await supabase
        .from("api_keys")
        .insert({
          name: newKey.name,
          user_id: userData.user?.id ?? null,
          key_prefix: (generated as string).slice(0, 12),
          key_hash: hashed as string,
          scopes: newKey.scopes,
          requests_per_minute: newKey.rateLimit,
          is_active: true,
          expires_at: days ? new Date(Date.now() + days * 86400000).toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;

      setDialogOpen(false);
      setNewKey({ name: "", scopes: [], rateLimit: 1000, expiresIn: "never" });
      await loadKeys();
      setApiKeys((prev) =>
        prev.map((k) => (k.id === inserted.id ? { ...k, key: generated as string } : k))
      );
      setShowKeys((prev) => ({ ...prev, [inserted.id]: true }));
      toast.success("Clé API créée — copiez-la maintenant, elle ne sera plus affichée");
    } catch (error) {
      console.error("Error creating API key:", error);
      toast.error("Erreur lors de la création de la clé API");
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">API Management</h1>
            <p className="text-muted-foreground">Gestion des clés API globales</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-hero border-0">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle Clé API
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une Clé API</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Nom de la clé</Label>
                  <Input
                    value={newKey.name}
                    onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                    placeholder="Production API Key"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Scopes</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["read", "write", "admin"].map((scope) => (
                      <Button
                        key={scope}
                        variant={newKey.scopes.includes(scope) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleScope(scope)}
                      >
                        {scope}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Limite de taux (req/min)</Label>
                  <Input
                    type="number"
                    value={newKey.rateLimit}
                    onChange={(e) => setNewKey({ ...newKey, rateLimit: parseInt(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Expiration</Label>
                  <Select value={newKey.expiresIn} onValueChange={(value) => setNewKey({ ...newKey, expiresIn: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Jamais</SelectItem>
                      <SelectItem value="30d">30 jours</SelectItem>
                      <SelectItem value="90d">90 jours</SelectItem>
                      <SelectItem value="1y">1 an</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateKey} className="gradient-hero border-0 w-full">
                  Créer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une clé API..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="revoked">Révoqué</SelectItem>
                  <SelectItem value="expired">Expiré</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Clés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{apiKeys.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Actives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {apiKeys.filter((k) => k.status === "active").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Requêtes Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {apiKeys.reduce((sum, k) => sum + k.requests, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Rate Limit Moyen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {apiKeys.length ? Math.round(apiKeys.reduce((sum, k) => sum + k.rateLimit, 0) / apiKeys.length) : 0} req/min
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Clés API</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Chargement...</div>
            ) : filteredKeys.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune clé API trouvée</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredKeys.map((apiKey) => {
                  const statusInfo = statusConfig[apiKey.status];
                  const StatusIcon = statusInfo.icon;

                  return (
                    <div
                      key={apiKey.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Key className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-foreground">{apiKey.name}</h3>
                            <Badge className={statusInfo.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                              {showKeys[apiKey.id] && apiKey.key ? apiKey.key : `${apiKey.prefix}${"•".repeat(12)}`}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleToggleKeyVisibility(apiKey.id)}
                            >
                              {showKeys[apiKey.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleCopyKey(apiKey.key ?? apiKey.prefix)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-1">
                            {apiKey.scopes.map((scope) => {
                              const scopeInfo = scopeConfig[scope as keyof typeof scopeConfig];
                              return (
                                <Badge key={scope} className={scopeInfo.color}>
                                  {scopeInfo.label}
                                </Badge>
                              );
                            })}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <BarChart3 className="w-3 h-3" />
                              {apiKey.requests.toLocaleString()} requêtes
                            </span>
                            <span className="flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              {apiKey.rateLimit} req/min
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Créé: {new Date(apiKey.createdAt).toLocaleDateString()}
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
                            {apiKey.status === "active" && (
                              <DropdownMenuItem onClick={() => handleRevokeKey(apiKey.id)}>
                                <Shield className="w-4 h-4 mr-2" />
                                Révoquer
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Régénérer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DeleteConfirmDialog
                              onConfirm={() => handleDeleteKey(apiKey.id)}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              }
                            />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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

export default SuperAdminAPIManagement;
