import { useState } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import {
  MessageSquare,
  Search,
  Plus,
  Filter,
  Send,
  Clock,
  User,
  Building2,
  AlertCircle,
  CheckCircle,
  MoreVertical,
  Reply,
  Archive,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  user: string;
  email: string;
  clinic: string | null;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved" | "closed";
  category: "technical" | "billing" | "feature" | "bug" | "other";
  createdAt: string;
  updatedAt: string;
  assignedTo: string | null;
}

const SuperAdminSupport = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: "1",
      subject: "Problème de connexion",
      description: "Je n'arrive pas à me connecter à mon compte depuis hier",
      user: "Jean Dupont",
      email: "jean.dupont@email.com",
      clinic: "Clinique Santé Plus",
      priority: "high",
      status: "in_progress",
      category: "technical",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
      assignedTo: "support@gesclic.com",
    },
    {
      id: "2",
      subject: "Erreur lors du paiement",
      description: "Le paiement a échoué mais mon compte a été débité",
      user: "Marie Kouassi",
      email: "marie.kouassi@email.com",
      clinic: "Hôpital Central",
      priority: "critical",
      status: "open",
      category: "billing",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
      assignedTo: null,
    },
    {
      id: "3",
      subject: "Demande de fonctionnalité",
      description: "Serait-il possible d'ajouter l'export PDF des rapports?",
      user: "Paul Touré",
      email: "paul.toure@email.com",
      clinic: "Cabinet Médical Alpha",
      priority: "medium",
      status: "open",
      category: "feature",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      assignedTo: null,
    },
    {
      id: "4",
      subject: "Bug dans le calendrier",
      description: "Les rendez-vous ne s'affichent pas correctement sur mobile",
      user: "Sophie Diallo",
      email: "sophie.diallo@email.com",
      clinic: "Clinique Bien-être",
      priority: "medium",
      status: "resolved",
      category: "bug",
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      assignedTo: "support@gesclic.com",
    },
  ]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyText, setReplyText] = useState("");

  const priorityConfig = {
    low: { label: "Faible", color: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
    medium: { label: "Moyen", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    high: { label: "Haut", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
    critical: { label: "Critique", color: "bg-destructive/10 text-destructive border-destructive/20" },
  };

  const statusConfig = {
    open: { label: "Ouvert", icon: AlertCircle, color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    in_progress: { label: "En cours", icon: Clock, color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
    resolved: { label: "Résolu", icon: CheckCircle, color: "bg-success/10 text-success border-success/20" },
    closed: { label: "Fermé", icon: CheckCircle, color: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
  };

  const categoryConfig = {
    technical: { label: "Technique", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
    billing: { label: "Facturation", color: "bg-green-500/10 text-green-600 border-green-500/20" },
    feature: { label: "Fonctionnalité", color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20" },
    bug: { label: "Bug", color: "bg-red-500/10 text-red-600 border-red-500/20" },
    other: { label: "Autre", color: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
      ticket.user.toLowerCase().includes(search.toLowerCase()) ||
      ticket.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    const matchesCategory = categoryFilter === "all" || ticket.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const handleUpdateStatus = (ticketId: string, newStatus: string) => {
    setTickets(
      tickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status: newStatus as any, updatedAt: new Date().toISOString() } : ticket
      )
    );
    toast.success("Statut mis à jour");
  };

  const handleDeleteTicket = (ticketId: string) => {
    setTickets(tickets.filter((ticket) => ticket.id !== ticketId));
    toast.success("Ticket supprimé");
  };

  const handleSendReply = () => {
    if (!selectedTicket || !replyText.trim()) return;
    toast.success("Réponse envoyée");
    setReplyDialogOpen(false);
    setReplyText("");
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Support Tickets</h1>
            <p className="text-muted-foreground">Gestion des tickets de support</p>
          </div>
          <Button className="gradient-hero border-0">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Ticket
          </Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un ticket..."
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
                  <SelectItem value="open">Ouvert</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="resolved">Résolu</SelectItem>
                  <SelectItem value="closed">Fermé</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les priorités</SelectItem>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyen</SelectItem>
                  <SelectItem value="high">Haut</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  <SelectItem value="technical">Technique</SelectItem>
                  <SelectItem value="billing">Facturation</SelectItem>
                  <SelectItem value="feature">Fonctionnalité</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tickets.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ouverts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {tickets.filter((t) => t.status === "open").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">En cours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {tickets.filter((t) => t.status === "in_progress").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Critiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {tickets.filter((t) => t.priority === "critical").length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tickets de Support</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTickets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun ticket trouvé</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTickets.map((ticket) => {
                  const priorityInfo = priorityConfig[ticket.priority];
                  const statusInfo = statusConfig[ticket.status];
                  const StatusIcon = statusInfo.icon;
                  const categoryInfo = categoryConfig[ticket.category];

                  return (
                    <div
                      key={ticket.id}
                      className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-foreground">{ticket.subject}</h3>
                            <Badge className={priorityInfo.color}>{priorityInfo.label}</Badge>
                            <Badge className={statusInfo.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                            <Badge className={categoryInfo.color}>{categoryInfo.label}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{ticket.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {ticket.user} ({ticket.email})
                            </span>
                            {ticket.clinic && (
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {ticket.clinic}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(ticket.createdAt).toLocaleString()}
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
                            <DropdownMenuItem onClick={() => { setSelectedTicket(ticket); setReplyDialogOpen(true); }}>
                              <Reply className="w-4 h-4 mr-2" />
                              Répondre
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(ticket.id, "in_progress")}>
                              Marquer En cours
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(ticket.id, "resolved")}>
                              Marquer Résolu
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(ticket.id, "closed")}>
                              <Archive className="w-4 h-4 mr-2" />
                              Archiver
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DeleteConfirmDialog
                              onConfirm={() => handleDeleteTicket(ticket.id)}
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

        <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Répondre au Ticket</DialogTitle>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-4 mt-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">{selectedTicket.subject}</p>
                  <p className="text-xs text-muted-foreground mt-1">{selectedTicket.description}</p>
                </div>
                <div>
                  <Label>Votre réponse</Label>
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Écrivez votre réponse..."
                    className="mt-1 min-h-32"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleSendReply} className="gradient-hero border-0">
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminSupport;
