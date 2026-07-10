import { useState } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import {
  Flag,
  Search,
  Plus,
  ToggleRight,
  ToggleLeft,
  Edit,
  Trash2,
  MoreVertical,
  Zap,
  Rocket,
  Shield,
  Globe,
  Smartphone,
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
  description: string;
  enabled: boolean;
  type: "boolean" | "percentage" | "user_list";
  value: boolean | number | string[];
  category: "core" | "beta" | "experimental" | "deprecated";
  lastModified: string;
  modifiedBy: string;
}

const SuperAdminFeatureFlags = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([
    {
      id: "1",
      key: "telemedicine_enabled",
      name: "Téléconsultation",
      description: "Active la fonctionnalité de téléconsultation",
      enabled: true,
      type: "boolean",
      value: true,
      category: "core",
      lastModified: new Date().toISOString(),
      modifiedBy: "super_admin@gesclic.com",
    },
    {
      id: "2",
      key: "ai_assistant_beta",
      name: "Assistant IA Beta",
      description: "Assistant IA en phase bêta",
      enabled: true,
      type: "percentage",
      value: 50,
      category: "beta",
      lastModified: new Date(Date.now() - 86400000).toISOString(),
      modifiedBy: "super_admin@gesclic.com",
    },
    {
      id: "3",
      key: "new_dashboard_v2",
      name: "Dashboard V2",
      description: "Nouvelle version du dashboard",
      enabled: false,
      type: "user_list",
      value: ["admin@santeplus.com", "admin@central.com"],
      category: "experimental",
      lastModified: new Date(Date.now() - 172800000).toISOString(),
      modifiedBy: "super_admin@gesclic.com",
    },
    {
      id: "4",
      key: "legacy_api",
      name: "API Legacy",
      description: "Support de l'ancienne API",
      enabled: true,
      type: "boolean",
      value: true,
      category: "deprecated",
      lastModified: new Date(Date.now() - 259200000).toISOString(),
      modifiedBy: "super_admin@gesclic.com",
    },
  ]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [newFlag, setNewFlag] = useState({
    key: "",
    name: "",
    description: "",
    type: "boolean" as const,
    category: "experimental" as const,
  });

  const categoryConfig = {
    core: { label: "Core", icon: Rocket, color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    beta: { label: "Beta", icon: Zap, color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
    experimental: { label: "Expérimental", icon: Globe, color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
    deprecated: { label: "Déprécié", icon: Shield, color: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
  };

  const filteredFlags = flags.filter((flag) => {
    const matchesSearch =
      flag.name.toLowerCase().includes(search.toLowerCase()) ||
      flag.key.toLowerCase().includes(search.toLowerCase()) ||
      flag.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || flag.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleToggleFlag = (flagId: string) => {
    setFlags(
      flags.map((flag) =>
        flag.id === flagId ? { ...flag, enabled: !flag.enabled, lastModified: new Date().toISOString() } : flag
      )
    );
    toast.success("Feature flag mis à jour");
  };

  const handleCreateFlag = () => {
    const flag: FeatureFlag = {
      id: Date.now().toString(),
      key: newFlag.key,
      name: newFlag.name,
      description: newFlag.description,
      enabled: false,
      type: newFlag.type,
      value: newFlag.type === "boolean" ? false : newFlag.type === "percentage" ? 0 : [],
      category: newFlag.category,
      lastModified: new Date().toISOString(),
      modifiedBy: "super_admin@gesclic.com",
    };
    setFlags([...flags, flag]);
    setDialogOpen(false);
    setNewFlag({ key: "", name: "", description: "", type: "boolean", category: "experimental" });
    toast.success("Feature flag créé");
  };

  const handleDeleteFlag = (flagId: string) => {
    setFlags(flags.filter((flag) => flag.id !== flagId));
    toast.success("Feature flag supprimé");
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
                  <Label>Type</Label>
                  <Select value={newFlag.type} onValueChange={(value: any) => setNewFlag({ ...newFlag, type: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="boolean">Booléen</SelectItem>
                      <SelectItem value="percentage">Pourcentage</SelectItem>
                      <SelectItem value="user_list">Liste d'utilisateurs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Catégorie</Label>
                  <Select value={newFlag.category} onValueChange={(value: any) => setNewFlag({ ...newFlag, category: value })}>
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
            {filteredFlags.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Flag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun feature flag trouvé</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFlags.map((flag) => {
                  const categoryInfo = categoryConfig[flag.category];
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
                            <Badge variant="outline">{flag.type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{flag.key}</p>
                          <p className="text-sm text-muted-foreground">{flag.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Modifié: {new Date(flag.lastModified).toLocaleString()}</span>
                            <span>Par: {flag.modifiedBy}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleFlag(flag.id)}
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
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
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
