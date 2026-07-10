import { useState } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import {
  Mail,
  Search,
  Plus,
  Edit,
  Trash2,
  Send,
  Eye,
  MoreVertical,
  FileText,
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
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";

interface EmailTemplate {
  id: string;
  key: string;
  name: string;
  subject: string;
  type: "transactional" | "marketing" | "notification";
  category: "auth" | "billing" | "appointment" | "system" | "custom";
  lastModified: string;
  modifiedBy: string;
  active: boolean;
}

const SuperAdminEmailTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([
    {
      id: "1",
      key: "welcome_email",
      name: "Email de bienvenue",
      subject: "Bienvenue sur Gesclic",
      type: "transactional",
      category: "auth",
      lastModified: new Date().toISOString(),
      modifiedBy: "super_admin@gesclic.com",
      active: true,
    },
    {
      id: "2",
      key: "appointment_reminder",
      name: "Rappel de rendez-vous",
      subject: "Rappel: Votre rendez-vous demain",
      type: "notification",
      category: "appointment",
      lastModified: new Date(Date.now() - 86400000).toISOString(),
      modifiedBy: "super_admin@gesclic.com",
      active: true,
    },
    {
      id: "3",
      key: "payment_confirmation",
      name: "Confirmation de paiement",
      subject: "Paiement reçu avec succès",
      type: "transactional",
      category: "billing",
      lastModified: new Date(Date.now() - 172800000).toISOString(),
      modifiedBy: "super_admin@gesclic.com",
      active: true,
    },
    {
      id: "4",
      key: "password_reset",
      name: "Réinitialisation mot de passe",
      subject: "Réinitialisez votre mot de passe",
      type: "transactional",
      category: "auth",
      lastModified: new Date(Date.now() - 259200000).toISOString(),
      modifiedBy: "super_admin@gesclic.com",
      active: true,
    },
    {
      id: "5",
      key: "monthly_newsletter",
      name: "Newsletter mensuelle",
      subject: "Nouveautés de Gesclic ce mois",
      type: "marketing",
      category: "custom",
      lastModified: new Date(Date.now() - 345600000).toISOString(),
      modifiedBy: "super_admin@gesclic.com",
      active: false,
    },
  ]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  const typeConfig = {
    transactional: { label: "Transactionnel", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    marketing: { label: "Marketing", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
    notification: { label: "Notification", color: "bg-green-500/10 text-green-600 border-green-500/20" },
  };

  const categoryConfig = {
    auth: { label: "Authentification", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
    billing: { label: "Facturation", color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20" },
    appointment: { label: "Rendez-vous", color: "bg-pink-500/10 text-pink-600 border-pink-500/20" },
    system: { label: "Système", color: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
    custom: { label: "Personnalisé", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(search.toLowerCase()) ||
      template.key.toLowerCase().includes(search.toLowerCase()) ||
      template.subject.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || template.type === typeFilter;
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
    return matchesSearch && matchesType && matchesCategory;
  });

  const handleToggleActive = (templateId: string) => {
    setTemplates(
      templates.map((template) =>
        template.id === templateId ? { ...template, active: !template.active } : template
      )
    );
    toast.success("Template mis à jour");
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter((template) => template.id !== templateId));
    toast.success("Template supprimé");
  };

  const handleSendTest = () => {
    toast.success("Email de test envoyé");
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Email Templates</h1>
            <p className="text-muted-foreground">Gestion des templates d'emails</p>
          </div>
          <Button className="gradient-hero border-0">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Template
          </Button>
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
                {templates.filter((t) => t.active).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inactifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">
                {templates.filter((t) => !t.active).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Transactionnels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {templates.filter((t) => t.type === "transactional").length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Templates d'Emails</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun template trouvé</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTemplates.map((template) => {
                  const typeInfo = typeConfig[template.type];
                  const categoryInfo = categoryConfig[template.category];

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
                            {template.active && (
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
                              {new Date(template.lastModified).toLocaleString()}
                            </span>
                            <span>Par: {template.modifiedBy}</span>
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
                            <DropdownMenuItem onClick={() => { setSelectedTemplate(template); setPreviewDialogOpen(true); }}>
                              <Eye className="w-4 h-4 mr-2" />
                              Prévisualiser
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(template.id)}>
                              {template.active ? "Désactiver" : "Activer"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleSendTest}>
                              <Send className="w-4 h-4 mr-2" />
                              Envoyer Test
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Modifier
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
                        value={`<html>\n<body>\n  <h1>Bienvenue sur Gesclic</h1>\n  <p>Bonjour {{user_name}},</p>\n  <p>Nous sommes ravis de vous accueillir...</p>\n</body>\n</html>`}
                        disabled
                        className="mt-1 min-h-48 font-mono text-xs"
                      />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="variables">
                  <div className="space-y-2">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-mono text-sm">{"{{user_name}}"}</p>
                      <p className="text-xs text-muted-foreground">Nom de l'utilisateur</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-mono text-sm">{"{{clinic_name}}"}</p>
                      <p className="text-xs text-muted-foreground">Nom de la clinique</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-mono text-sm">{"{{reset_link}}"}</p>
                      <p className="text-xs text-muted-foreground">Lien de réinitialisation</p>
                    </div>
                  </div>
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
