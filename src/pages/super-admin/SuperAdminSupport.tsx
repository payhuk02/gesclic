import { useEffect, useState } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { MessageSquare, Search, Clock, User, Building2, AlertCircle, CheckCircle, MoreVertical, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { fromAdmin } from "@/lib/admin-db";

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  user_name: string | null;
  email: string | null;
  clinic_id: string | null;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved" | "closed";
  category: string;
  created_at: string;
}

const SuperAdminSupport = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [clinics, setClinics] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const load = async () => {
    const [{ data }, clinicsRes] = await Promise.all([
      fromAdmin("support_tickets").select("*").order("created_at", { ascending: false }),
      fromAdmin("clinics").select("id, name"),
    ]);
    setTickets((data ?? []) as SupportTicket[]);
    setClinics(Object.fromEntries(((clinicsRes.data ?? []) as { id: string; name: string }[]).map((c) => [c.id, c.name])));
  };

  useEffect(() => { load(); }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    const { error } = await fromAdmin("support_tickets").update({ status }).eq("id", id);
    if (error) toast.error("Mise à jour impossible");
    else { toast.success("Statut mis à jour"); load(); }
  };

  const handleDeleteTicket = async (id: string) => {
    const { error } = await fromAdmin("support_tickets").delete().eq("id", id);
    if (error) toast.error("Suppression impossible");
    else { toast.success("Ticket supprimé"); load(); }
  };

  const priorityConfig = {
    low: { label: "Faible", color: "bg-slate-500/10 text-slate-600" },
    medium: { label: "Moyen", color: "bg-blue-500/10 text-blue-600" },
    high: { label: "Haut", color: "bg-orange-500/10 text-orange-600" },
    critical: { label: "Critique", color: "bg-destructive/10 text-destructive" },
  };
  const statusConfig = {
    open: { label: "Ouvert", icon: AlertCircle, color: "bg-blue-500/10 text-blue-600" },
    in_progress: { label: "En cours", icon: Clock, color: "bg-orange-500/10 text-orange-600" },
    resolved: { label: "Résolu", icon: CheckCircle, color: "bg-success/10 text-success" },
    closed: { label: "Fermé", icon: CheckCircle, color: "bg-slate-500/10 text-slate-600" },
  };

  const filtered = tickets.filter((t) => {
    const hay = `${t.subject} ${t.description} ${t.user_name ?? ""} ${t.email ?? ""}`.toLowerCase();
    return hay.includes(search.toLowerCase())
      && (statusFilter === "all" || t.status === statusFilter)
      && (priorityFilter === "all" || t.priority === priorityFilter);
  });

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground">Tickets réels de la plateforme</p>
        </div>
        <Card>
          <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Rechercher un ticket..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="open">Ouvert</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="resolved">Résolu</SelectItem>
                <SelectItem value="closed">Fermé</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes priorités</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
                <SelectItem value="medium">Moyen</SelectItem>
                <SelectItem value="high">Haut</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{tickets.length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Ouverts</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{tickets.filter((t) => t.status === "open").length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">En cours</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{tickets.filter((t) => t.status === "in_progress").length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Critiques</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{tickets.filter((t) => t.priority === "critical").length}</div></CardContent></Card>
        </div>
        <Card>
          <CardHeader><CardTitle>Tickets de Support</CardTitle></CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun ticket trouvé</p>
              </div>
            ) : filtered.map((ticket) => {
              const StatusIcon = statusConfig[ticket.status]?.icon ?? AlertCircle;
              return (
                <div key={ticket.id} className="flex gap-4 p-4 border rounded-lg mb-3">
                  <div className="flex-1">
                    <div className="flex gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold">{ticket.subject}</h3>
                      <Badge className={priorityConfig[ticket.priority]?.color}>{priorityConfig[ticket.priority]?.label ?? ticket.priority}</Badge>
                      <Badge className={statusConfig[ticket.status]?.color}><StatusIcon className="w-3 h-3 mr-1" />{statusConfig[ticket.status]?.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{ticket.description}</p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{ticket.user_name || ticket.email || "—"}</span>
                      {ticket.clinic_id && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{clinics[ticket.clinic_id] ?? "—"}</span>}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleUpdateStatus(ticket.id, "in_progress")}>Marquer En cours</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateStatus(ticket.id, "resolved")}>Marquer Résolu</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateStatus(ticket.id, "closed")}>Archiver</DropdownMenuItem>
                      <DeleteConfirmDialog onConfirm={() => handleDeleteTicket(ticket.id)} trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}><Trash2 className="w-4 h-4 mr-2" />Supprimer</DropdownMenuItem>} />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminSupport;
