import { useEffect, useState } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  Flag,
  Search,
  Plus,
  ToggleRight,
  ToggleLeft,
  Trash2,
  MoreVertical,
  Zap,
  Rocket,
  Shield,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  rollout_percentage: number;
  environment: string;
  category: string;
  updated_at: string;
}

const SuperAdminFeatureFlags = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newFlag, setNewFlag] = useState({
    key: "",
    name: "",
    description: "",
    environment: "production",
    category: "experimental",
  });

  const load = async () => {
    try {
      const { data, error } = await supabase.from("feature_flags").select("*").order("name");
      if (error) throw error;
      setFlags((data ?? []) as FeatureFlag[]);
    } catch (error) {
      console.error("Error loading feature flags:", error);
      toast.error("Erreur lors du chargement des feature flags");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const categoryConfig: Record<string, { label: string; icon: typeof Rocket; color: string }> = {
    core: { label: "Core", icon: Rocket, color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    beta: { label: "Beta", icon: Zap, color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
    experimental: { label: "Expérimental", icon: Globe, color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
    deprecated: { label: "Déprécié", icon: Shield, color: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
    general: { label: "Général", icon: Flag, color: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
  };

  const filteredFlags = flags.filter((flag) => {
    const matchesSearch =
      flag.name.toLowerCase().includes(search.toLowerCase()) ||
      flag.key.toLowerCase().includes(search.toLowerCase()) ||
      (flag.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || flag.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleToggleFlag = async (flag: FeatureFlag) => {
    const { error } = await supabase
      .from("feature_flags")
      .update({ enabled: !flag.enabled })
      .eq("id", flag.id);
    if (error) {
      toast.error("Erreur lors de la mise à jour");
      return;
    }
    toast.success("Feature flag mis à jour");
    load();
  };

  const handleCreateFlag = async () => {
    if (!newFlag.key.trim() || !newFlag.name.trim()) {
      toast.error("Clé et nom sont requis");
      return;
    }
    const { error } = await supabase.from("feature_flags").insert({
      key: newFlag.key.trim(),
      name: newFlag.name.trim(),
      description: newFlag.description || null,
      environment: newFlag.environment,
      category: newFlag.category,
    });
    if (error) {
      toast.error("Erreur lors de la création du feature flag");
      return;
    }
    setDialogOpen(false);
    setNewFlag({ key: "", name: "", description: "", environment: "production", category: "experimental" });
    toast.success("Feature flag créé");
    load();
  };

  const handleDeleteFlag = async (flagId: string) => {
    const { error } = await supabase.from("feature_flags").delete().eq("id", flagId);
    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }
    toast.success("Feature flag supprimé");
    load();
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Feature Flags</h1>
            <p className="text-muted-foreground">Gestion des fonctionnalités de la plateforme</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-hero border-0">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Feature Flag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un Feature Flag</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Clé (key)</Label>
                  <Input
                    value={newFlag.key}
                    onChange={(e) => setNewFlag({ ...newFlag, key: e.target.value })}
                    placeholder="feature_name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Nom</Label>
                  <Input
                    value={newFlag.name}
                    onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
                    placeholder="Nom de la fonctionnalité"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newFlag.description}
                    onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                    placeholder="Description de la fonctionnalité"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Environnement</Label>
                  <Select value={newFlag.environment} onValueChange={(value) => setNewFlag({ ...newFlag, environment: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="development">Développement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Catégorie</Label>
                  <Select value={newFlag.category} onValueChange={(value) => setNewFlag({ ...newFlag, category: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="core">Core</SelectItem>
                      <SelectItem value="beta">Beta</SelectItem>
                      <SelectItem value="experimental">Expérimental</SelectItem>
                      <SelectItem value="deprecated">Déprécié</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateFlag} className="gradient-hero border-0 w-full">
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
                  placeholder="Rechercher un feature flag..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  <SelectItem value="core">Core</SelectItem>
                  <SelectItem value="beta">Beta</SelectItem>
                  <SelectItem value="experimental">Expérimental</SelectItem>
                  <SelectItem value="deprecated">Déprécié</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Flags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{flags.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Activés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {flags.filter((f) => f.enabled).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Désactivés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">
                {flags.filter((f) => !f.enabled).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Beta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {flags.filter((f) => f.category === "beta").length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Feature Flags</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Chargement...</div>
            ) : filteredFlags.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Flag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun feature flag trouvé</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFlags.map((flag) => {
                  const categoryInfo = categoryConfig[flag.category] ?? categoryConfig.general;
                  const CategoryIcon = categoryInfo.icon;

                  return (
                    <div
                      key={flag.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Flag className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-foreground">{flag.name}</h3>
                            <Badge className={categoryInfo.color}>
                              <CategoryIcon className="w-3 h-3 mr-1" />
                              {categoryInfo.label}
                            </Badge>
                            <Badge variant="outline">{flag.environment}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{flag.key}</p>
                          <p className="text-sm text-muted-foreground">{flag.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Modifié: {new Date(flag.updated_at).toLocaleString()}</span>
                            <span>Déploiement: {flag.rollout_percentage}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleFlag(flag)}
                          className="text-primary"
                        >
                          {flag.enabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DeleteConfirmDialog
                              onConfirm={() => handleDeleteFlag(flag.id)}
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

export default SuperAdminFeatureFlags;
