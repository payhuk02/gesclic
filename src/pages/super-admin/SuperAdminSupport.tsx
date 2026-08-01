import { useEffect, useState } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  MessageSquare,
  Search,
  Clock,
  User,
  Building2,
  AlertCircle,
  CheckCircle,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  user_name: string | null;
  email: string | null;
  clinic_id: string | null;
  priority: string;
  status: string;
  category: string;
  created_at: string;
  updated_at: string;
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Basse", color: "bg-muted text-muted-foreground border-border" },
  medium: { label: "Moyenne", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  high: { label: "Haute", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  critical: { label: "Critique", color: "bg-destructive/10 text-destructive border-destructive/20" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: "Ouvert", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  in_progress: { label: "En cours", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  resolved: { label: "Résolu", color: "bg-success/10 text-success border-success/20" },
  closed: { label: "Fermé", color: "bg-muted text-muted-foreground border-border" },
};

const SuperAdminSupport = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [clinicNames, setClinicNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data, error }, { data: clinics }] = await Promise.all([
      supabase.from("support_tickets").select("*").order("created_at", { ascending: false }),
      supabase.from("clinics").select("id, name"),
    ]);
    if (error) toast.error("Erreur de chargement des tickets");
    setTickets((data as any) || []);
    setClinicNames(Object.fromEntries((clinics || []).map((c) => [c.id, c.name])));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("support_tickets").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Ticket mis à jour");
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("support_tickets").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Ticket supprimé");
    load();
  };

  const filtered = tickets.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      t.subject.toLowerCase().includes(q) ||
      (t.email || "").toLowerCase().includes(q) ||
      (t.user_name || "").toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Support Tickets</h1>
          <p className="text-muted-foreground">Demandes d'assistance des utilisateurs</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Total", value: tickets.length, cls: "" },
            {
              label: "Ouverts",
              value: tickets.filter((t) => t.status === "open").length,
              cls: "text-blue-600",
            },
            {
              label: "En cours",
              value: tickets.filter((t) => t.status === "in_progress").length,
              cls: "text-amber-600",
            },
            {
              label: "Résolus",
              value: tickets.filter((t) => t.status === "resolved").length,
              cls: "text-success",
            },
          ].map((s) => (
            <Card key={s.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${s.cls}`}>{s.value}</div>
              </CardContent>
            </Card>
          ))}
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
                <SelectTrigger className="w-full sm:w-44">
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
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes priorités</SelectItem>
                  <SelectItem value="low">Basse</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tickets ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun ticket de support</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((t) => (
                  <div key={t.id} className="p-4 border border-border rounded-lg">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">{t.subject}</h3>
                          <Badge className={priorityConfig[t.priority]?.color}>
                            {priorityConfig[t.priority]?.label || t.priority}
                          </Badge>
                          <Badge className={statusConfig[t.status]?.color}>
                            {statusConfig[t.status]?.label || t.status}
                          </Badge>
                          <Badge variant="outline">{t.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{t.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 flex-wrap">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {t.user_name || t.email || "Inconnu"}
                          </span>
                          {t.clinic_id && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {clinicNames[t.clinic_id] || t.clinic_id}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(t.created_at).toLocaleString()}
                          </span>
                        </div>
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
                              setSelected(t);
                              setDetailOpen(true);
                            }}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Voir le détail
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(t.id, "in_progress")}>
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Marquer en cours
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(t.id, "resolved")}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Marquer résolu
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => remove(t.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.subject}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-foreground whitespace-pre-wrap">{selected?.description}</p>
          <p className="text-xs text-muted-foreground">
            {selected?.email} • {selected && new Date(selected.created_at).toLocaleString()}
          </p>
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  );
};

export default SuperAdminSupport;
