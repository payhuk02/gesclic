<<<<<<< HEAD
import { useEffect, useState } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { supabase } from "@/integrations/supabase/client";
=======
import { useState } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
import {
  Megaphone,
  Search,
  Plus,
<<<<<<< HEAD
=======
  Edit,
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
  Trash2,
  Send,
  Eye,
  MoreVertical,
<<<<<<< HEAD
  Archive,
=======
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  ToggleRight,
  ToggleLeft,
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
<<<<<<< HEAD
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
=======
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
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
<<<<<<< HEAD
=======
  DialogTrigger,
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
<<<<<<< HEAD
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
=======
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe

interface Announcement {
  id: string;
  title: string;
  content: string;
<<<<<<< HEAD
  type: string;
  target: string;
  priority: string;
  status: string;
  scheduled_for: string | null;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
}

const typeConfig: Record<string, { label: string; color: string }> = {
  info: { label: "Info", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  warning: { label: "Avertissement", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  success: { label: "Nouveauté", color: "bg-success/10 text-success border-success/20" },
  maintenance: { label: "Maintenance", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "bg-muted text-muted-foreground border-border" },
  scheduled: { label: "Programmée", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  published: { label: "Publiée", color: "bg-success/10 text-success border-success/20" },
  archived: { label: "Archivée", color: "bg-muted text-muted-foreground border-border" },
};

const SuperAdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [form, setForm] = useState({
    title: "",
    content: "",
    type: "info",
    target: "all",
    priority: "medium",
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("platform_announcements")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erreur de chargement des annonces");
    setAnnouncements((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const createAnnouncement = async (publish: boolean) => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Titre et contenu obligatoires");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("platform_announcements").insert({
      ...form,
      status: publish ? "published" : "draft",
      published_at: publish ? new Date().toISOString() : null,
      created_by: user?.id ?? null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(publish ? "Annonce publiée" : "Brouillon enregistré");
    setCreateOpen(false);
    setForm({ title: "", content: "", type: "info", target: "all", priority: "medium" });
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("platform_announcements")
      .update({
        status,
        published_at: status === "published" ? new Date().toISOString() : null,
      })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Annonce mise à jour");
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("platform_announcements").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Annonce supprimée");
    load();
  };

  const filtered = announcements.filter((a) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    const matchesType = typeFilter === "all" || a.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

=======
  type: "info" | "warning" | "success" | "maintenance";
  target: "all" | "admins" | "clinics" | "specific";
  targetIds?: string[];
  priority: "low" | "medium" | "high";
  status: "draft" | "scheduled" | "published" | "archived";
  scheduledFor?: string;
  publishedAt?: string;
  expiresAt?: string;
  createdBy: string;
  createdAt: string;
}

const SuperAdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: "1",
      title: "Maintenance prévue",
      content: "Une maintenance est prévue pour le 15 juillet 2024 de 02h00 à 04h00 UTC. Le service sera temporairement indisponible.",
      type: "maintenance",
      target: "all",
      priority: "high",
      status: "published",
      scheduledFor: "2024-07-15T02:00:00Z",
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      expiresAt: "2024-07-16T00:00:00Z",
      createdBy: "super_admin@gesclic.com",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "2",
      title: "Nouvelle fonctionnalité: Téléconsultation",
      content: "Nous sommes ravis d'annoncer le lancement de la téléconsultation! Cette nouvelle fonctionnalité permet de consulter vos patients à distance.",
      type: "success",
      target: "all",
      priority: "medium",
      status: "published",
      publishedAt: new Date(Date.now() - 172800000).toISOString(),
      createdBy: "super_admin@gesclic.com",
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: "3",
      title: "Mise à jour de sécurité",
      content: "Une mise à jour de sécurité importante sera déployée prochainement. Veuillez vous assurer que vos mots de passe sont forts.",
      type: "warning",
      target: "admins",
      priority: "high",
      status: "scheduled",
      scheduledFor: new Date(Date.now() + 86400000).toISOString(),
      createdBy: "super_admin@gesclic.com",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "4",
      title: "Nouveau rapport mensuel disponible",
      content: "Le rapport mensuel de juin 2024 est maintenant disponible dans votre dashboard.",
      type: "info",
      target: "clinics",
      priority: "low",
      status: "draft",
      createdBy: "super_admin@gesclic.com",
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  const typeConfig = {
    info: { label: "Info", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    warning: { label: "Avertissement", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
    success: { label: "Succès", color: "bg-green-500/10 text-green-600 border-green-500/20" },
    maintenance: { label: "Maintenance", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  };

  const statusConfig = {
    draft: { label: "Brouillon", icon: Clock, color: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
    scheduled: { label: "Programmé", icon: Calendar, color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    published: { label: "Publié", icon: CheckCircle, color: "bg-success/10 text-success border-success/20" },
    archived: { label: "Archivé", icon: XCircle, color: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
  };

  const targetConfig = {
    all: { label: "Tous", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
    admins: { label: "Admins", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
    clinics: { label: "Cliniques", color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20" },
    specific: { label: "Spécifique", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  };

  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch =
      announcement.title.toLowerCase().includes(search.toLowerCase()) ||
      announcement.content.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || announcement.status === statusFilter;
    const matchesType = typeFilter === "all" || announcement.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleToggleStatus = (announcementId: string) => {
    setAnnouncements(
      announcements.map((announcement) =>
        announcement.id === announcementId
          ? {
              ...announcement,
              status: announcement.status === "published" ? "archived" : "published",
              publishedAt: announcement.status === "draft" ? new Date().toISOString() : announcement.publishedAt,
            }
          : announcement
      )
    );
    toast.success("Statut mis à jour");
  };

  const handleDeleteAnnouncement = (announcementId: string) => {
    setAnnouncements(announcements.filter((announcement) => announcement.id !== announcementId));
    toast.success("Annonce supprimée");
  };

  const handlePublish = (announcementId: string) => {
    setAnnouncements(
      announcements.map((announcement) =>
        announcement.id === announcementId
          ? { ...announcement, status: "published", publishedAt: new Date().toISOString() }
          : announcement
      )
    );
    toast.success("Annonce publiée");
  };

>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Announcements</h1>
<<<<<<< HEAD
            <p className="text-muted-foreground">Communications à destination des cliniques</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle annonce
=======
            <p className="text-muted-foreground">Gestion des annonces plateforme</p>
          </div>
          <Button className="gradient-hero border-0">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Annonce
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
          </Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une annonce..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
<<<<<<< HEAD
                <SelectTrigger className="w-full sm:w-44">
=======
                <SelectTrigger className="w-full sm:w-40">
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
<<<<<<< HEAD
                  <SelectItem value="scheduled">Programmée</SelectItem>
                  <SelectItem value="published">Publiée</SelectItem>
                  <SelectItem value="archived">Archivée</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-44">
=======
                  <SelectItem value="scheduled">Programmé</SelectItem>
                  <SelectItem value="published">Publié</SelectItem>
                  <SelectItem value="archived">Archivé</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-40">
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Avertissement</SelectItem>
<<<<<<< HEAD
                  <SelectItem value="success">Nouveauté</SelectItem>
=======
                  <SelectItem value="success">Succès</SelectItem>
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

<<<<<<< HEAD
        <Card>
          <CardHeader>
            <CardTitle>Annonces ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune annonce</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((a) => (
                  <div key={a.id} className="p-4 border border-border rounded-lg">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">{a.title}</h3>
                          <Badge className={typeConfig[a.type]?.color}>
                            {typeConfig[a.type]?.label || a.type}
                          </Badge>
                          <Badge className={statusConfig[a.status]?.color}>
                            {statusConfig[a.status]?.label || a.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{a.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Créée le {new Date(a.created_at).toLocaleString()} • cible : {a.target}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelected(a);
                              setPreviewOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Aperçu
                          </DropdownMenuItem>
                          {a.status !== "published" && (
                            <DropdownMenuItem onClick={() => updateStatus(a.id, "published")}>
                              <Send className="w-4 h-4 mr-2" />
                              Publier
                            </DropdownMenuItem>
                          )}
                          {a.status !== "archived" && (
                            <DropdownMenuItem onClick={() => updateStatus(a.id, "archived")}>
                              <Archive className="w-4 h-4 mr-2" />
                              Archiver
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => remove(a.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
=======
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Annonces</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{announcements.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Publiées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {announcements.filter((a) => a.status === "published").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Programmées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {announcements.filter((a) => a.status === "scheduled").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Brouillons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-600">
                {announcements.filter((a) => a.status === "draft").length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Annonces Plateforme</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAnnouncements.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune annonce trouvée</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAnnouncements.map((announcement) => {
                  const typeInfo = typeConfig[announcement.type];
                  const statusInfo = statusConfig[announcement.status];
                  const StatusIcon = statusInfo.icon;
                  const targetInfo = targetConfig[announcement.target];

                  return (
                    <div
                      key={announcement.id}
                      className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Megaphone className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-foreground">{announcement.title}</h3>
                            <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                            <Badge className={statusInfo.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                            <Badge className={targetInfo.color}>{targetInfo.label}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{announcement.content}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(announcement.createdAt).toLocaleString()}
                            </span>
                            {announcement.scheduledFor && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Programmé: {new Date(announcement.scheduledFor).toLocaleString()}
                              </span>
                            )}
                            <span>Par: {announcement.createdBy}</span>
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
                            <DropdownMenuItem onClick={() => { setSelectedAnnouncement(announcement); setPreviewDialogOpen(true); }}>
                              <Eye className="w-4 h-4 mr-2" />
                              Prévisualiser
                            </DropdownMenuItem>
                            {announcement.status === "draft" && (
                              <DropdownMenuItem onClick={() => handlePublish(announcement.id)}>
                                <Send className="w-4 h-4 mr-2" />
                                Publier
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(announcement.id)}>
                              {announcement.status === "published" ? "Archiver" : "Publier"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DeleteConfirmDialog
                              onConfirm={() => handleDeleteAnnouncement(announcement.id)}
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
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
              </div>
            )}
          </CardContent>
        </Card>
<<<<<<< HEAD
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle annonce</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Contenu</Label>
              <Textarea
                rows={5}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Avertissement</SelectItem>
                    <SelectItem value="success">Nouveauté</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cible</Label>
                <Select value={form.target} onValueChange={(v) => setForm({ ...form, target: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="admins">Administrateurs</SelectItem>
                    <SelectItem value="clinics">Cliniques</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => createAnnouncement(false)}>
                Enregistrer en brouillon
              </Button>
              <Button onClick={() => createAnnouncement(true)}>
                <Send className="w-4 h-4 mr-2" />
                Publier
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-foreground whitespace-pre-wrap">{selected?.content}</p>
        </DialogContent>
      </Dialog>
=======

        <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Prévisualisation de l'Annonce</DialogTitle>
            </DialogHeader>
            {selectedAnnouncement && (
              <div className="space-y-4 mt-4">
                <div className={`p-4 rounded-lg border ${typeConfig[selectedAnnouncement.type].color}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={typeConfig[selectedAnnouncement.type].color}>
                      {typeConfig[selectedAnnouncement.type].label}
                    </Badge>
                    <Badge className={targetConfig[selectedAnnouncement.target].color}>
                      {targetConfig[selectedAnnouncement.target].label}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold">{selectedAnnouncement.title}</h3>
                  <p className="text-sm mt-2">{selectedAnnouncement.content}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-muted-foreground">Statut</p>
                    <p className="font-medium">{statusConfig[selectedAnnouncement.status].label}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-muted-foreground">Priorité</p>
                    <p className="font-medium capitalize">{selectedAnnouncement.priority}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-muted-foreground">Créé le</p>
                    <p className="font-medium">{new Date(selectedAnnouncement.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-muted-foreground">Par</p>
                    <p className="font-medium">{selectedAnnouncement.createdBy}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
    </SuperAdminLayout>
  );
};

export default SuperAdminAnnouncements;
