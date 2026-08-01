import { useEffect, useState } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  Mail,
  Search,
  Plus,
  Trash2,
  Eye,
  MoreVertical,
  Clock,
  CheckCircle,
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";

interface EmailTemplate {
  id: string;
  key: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string | null;
  template_type: string;
  category: string;
  variables: unknown;
  is_active: boolean;
  sent_count: number;
  updated_at: string;
}

const typeConfig: Record<string, { label: string; color: string }> = {
  transactional: { label: "Transactionnel", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  marketing: { label: "Marketing", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  notification: { label: "Notification", color: "bg-green-500/10 text-green-600 border-green-500/20" },
};

const categoryConfig: Record<string, { label: string; color: string }> = {
  auth: { label: "Authentification", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  billing: { label: "Facturation", color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20" },
  appointment: { label: "Rendez-vous", color: "bg-pink-500/10 text-pink-600 border-pink-500/20" },
  system: { label: "Système", color: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
  custom: { label: "Personnalisé", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
};

const emptyForm = {
  key: "",
  name: "",
  subject: "",
  html_content: "",
  category: "system",
  template_type: "transactional",
};

const SuperAdminEmailTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  const load = async () => {
    try {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("name");
      if (error) throw error;
      setTemplates((data ?? []) as EmailTemplate[]);
    } catch (error) {
      console.error("Error loading email templates:", error);
      toast.error("Erreur lors du chargement des modèles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(search.toLowerCase()) ||
      template.key.toLowerCase().includes(search.toLowerCase()) ||
      template.subject.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || template.template_type === typeFilter;
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
    return matchesSearch && matchesType && matchesCategory;
  });

  const handleToggleActive = async (template: EmailTemplate) => {
    const { error } = await supabase
      .from("email_templates")
      .update({ is_active: !template.is_active })
      .eq("id", template.id);
    if (error) {
      toast.error("Erreur lors de la mise à jour");
      return;
    }
    toast.success("Modèle mis à jour");
    load();
  };

  const handleDeleteTemplate = async (id: string) => {
    const { error } = await supabase.from("email_templates").delete().eq("id", id);
    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }
    toast.success("Modèle supprimé");
    load();
  };

  const handleCreate = async () => {
    if (!form.key.trim() || !form.name.trim() || !form.subject.trim()) {
      toast.error("Clé, nom et sujet sont requis");
      return;
    }
    const { error } = await supabase.from("email_templates").insert({
      key: form.key.trim(),
      name: form.name.trim(),
      subject: form.subject.trim(),
      html_content: form.html_content,
      category: form.category,
      template_type: form.template_type,
    });
    if (error) {
      toast.error("Erreur lors de la création du modèle");
      return;
    }
    setForm(emptyForm);
    setCreateOpen(false);
    toast.success("Modèle créé");
    load();
  };

  const templateVariables = (template: EmailTemplate): string[] =>
    Array.isArray(template.variables) ? (template.variables as string[]) : [];

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Email Templates</h1>
            <p className="text-muted-foreground">Gestion des modèles d'e-mails</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-hero border-0">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Nouveau modèle d'e-mail</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Clé unique</Label>
                  <Input
                    value={form.key}
                    onChange={(e) => setForm({ ...form, key: e.target.value })}
                    placeholder="welcome_email"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Nom</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Sujet</Label>
                  <Input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={form.template_type}
                      onValueChange={(v) => setForm({ ...form, template_type: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transactional">Transactionnel</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="notification">Notification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Catégorie</Label>
                    <Select
                      value={form.category}
                      onValueChange={(v) => setForm({ ...form, category: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auth">Authentification</SelectItem>
                        <SelectItem value="billing">Facturation</SelectItem>
                        <SelectItem value="appointment">Rendez-vous</SelectItem>
                        <SelectItem value="system">Système</SelectItem>
                        <SelectItem value="custom">Personnalisé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Contenu HTML</Label>
                  <Textarea
                    value={form.html_content}
                    onChange={(e) => setForm({ ...form, html_content: e.target.value })}
                    className="mt-1 min-h-40 font-mono text-xs"
                  />
                </div>
                <Button onClick={handleCreate} className="gradient-hero border-0 w-full">
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
                  placeholder="Rechercher un template..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="transactional">Transactionnel</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="notification">Notification</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  <SelectItem value="auth">Authentification</SelectItem>
                  <SelectItem value="billing">Facturation</SelectItem>
                  <SelectItem value="appointment">Rendez-vous</SelectItem>
                  <SelectItem value="system">Système</SelectItem>
                  <SelectItem value="custom">Personnalisé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{templates.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {templates.filter((t) => t.is_active).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inactifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">
                {templates.filter((t) => !t.is_active).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">E-mails envoyés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {templates.reduce((s, t) => s + (t.sent_count ?? 0), 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Templates d'Emails</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Chargement...</div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun template trouvé</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTemplates.map((template) => {
                  const typeInfo = typeConfig[template.template_type] ?? typeConfig.transactional;
                  const categoryInfo = categoryConfig[template.category] ?? categoryConfig.system;

                  return (
                    <div
                      key={template.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-foreground">{template.name}</h3>
                            <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                            <Badge className={categoryInfo.color}>{categoryInfo.label}</Badge>
                            {template.is_active && (
                              <Badge className="bg-success/10 text-success border-success/20">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Actif
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{template.key}</p>
                          <p className="text-sm text-foreground">{template.subject}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(template.updated_at).toLocaleString()}
                            </span>
                            <span>{template.sent_count ?? 0} envoi(s)</span>
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
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTemplate(template);
                                setPreviewDialogOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Prévisualiser
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(template)}>
                              {template.is_active ? "Désactiver" : "Activer"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DeleteConfirmDialog
                              onConfirm={() => handleDeleteTemplate(template.id)}
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

        <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Prévisualisation du Template</DialogTitle>
            </DialogHeader>
            {selectedTemplate && (
              <Tabs defaultValue="content" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="content">Contenu</TabsTrigger>
                  <TabsTrigger value="variables">Variables</TabsTrigger>
                </TabsList>
                <TabsContent value="content">
                  <div className="space-y-4">
                    <div>
                      <Label>Sujet</Label>
                      <Input value={selectedTemplate.subject} disabled className="mt-1" />
                    </div>
                    <div>
                      <Label>Contenu HTML</Label>
                      <Textarea
                        value={selectedTemplate.html_content || "(vide)"}
                        disabled
                        className="mt-1 min-h-48 font-mono text-xs"
                      />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="variables">
                  {templateVariables(selectedTemplate).length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                      Aucune variable déclarée pour ce modèle.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {templateVariables(selectedTemplate).map((variable) => (
                        <div key={variable} className="p-3 bg-muted rounded-lg">
                          <p className="font-mono text-sm">{`{{${variable}}}`}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminEmailTemplates;
