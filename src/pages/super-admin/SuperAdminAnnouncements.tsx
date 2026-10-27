import { useEffect, useState } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Megaphone, Search, Plus, Trash2, MoreVertical, Eye, Send, Clock, Calendar, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { fromAdmin } from "@/lib/admin-db";
import { useAuth } from "@/contexts/AuthContext";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  target: string;
  priority: string;
  status: string;
  scheduled_for: string | null;
  published_at: string | null;
  created_by: string | null;
  created_at: string;
}

const SuperAdminAnnouncements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [preview, setPreview] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ title: "", content: "", type: "info", target: "all", priority: "medium" });

  const load = async () => {
    const { data } = await fromAdmin("platform_announcements").select("*").order("created_at", { ascending: false });
    setAnnouncements((data ?? []) as Announcement[]);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.title.trim() || !form.content.trim()) return toast.error("Titre et contenu requis");
    const { error } = await fromAdmin("platform_announcements").insert({
      ...form,
      status: "draft",
      created_by: user?.id ?? null,
    });
    if (error) toast.error("Création impossible");
    else { toast.success("Annonce créée"); setDialogOpen(false); setForm({ title: "", content: "", type: "info", target: "all", priority: "medium" }); load(); }
  };

  const publish = async (id: string) => {
    const { error } = await fromAdmin("platform_announcements").update({ status: "published", published_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error("Publication impossible");
    else { toast.success("Annonce publiée"); load(); }
  };

  const archive = async (id: string) => {
    const { error } = await fromAdmin("platform_announcements").update({ status: "archived" }).eq("id", id);
    if (error) toast.error("Archivage impossible");
    else { toast.success("Annonce archivée"); load(); }
  };

  const remove = async (id: string) => {
    const { error } = await fromAdmin("platform_announcements").delete().eq("id", id);
    if (error) toast.error("Suppression impossible");
    else { toast.success("Annonce supprimée"); load(); }
  };

  const typeConfig: Record<string, string> = { info: "bg-blue-500/10 text-blue-600", warning: "bg-orange-500/10 text-orange-600", success: "bg-green-500/10 text-green-600", maintenance: "bg-purple-500/10 text-purple-600" };
  const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
    draft: { label: "Brouillon", icon: Clock, color: "bg-slate-500/10 text-slate-600" },
    scheduled: { label: "Programmé", icon: Calendar, color: "bg-blue-500/10 text-blue-600" },
    published: { label: "Publié", icon: CheckCircle, color: "bg-success/10 text-success" },
    archived: { label: "Archivé", icon: XCircle, color: "bg-slate-500/10 text-slate-600" },
  };

  const filtered = announcements.filter((a) =>
    (`${a.title} ${a.content}`.toLowerCase().includes(search.toLowerCase()))
    && (statusFilter === "all" || a.status === statusFilter)
  );

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Announcements</h1>
            <p className="text-muted-foreground">Annonces réelles de la plateforme</p>
          </div>
          <Button className="gradient-hero border-0" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Nouvelle Annonce</Button>
        </div>
        <Card>
          <CardContent className="p-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une annonce..." className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="published">Publié</SelectItem>
                <SelectItem value="archived">Archivé</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{announcements.length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Publiées</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{announcements.filter((a) => a.status === "published").length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Brouillons</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{announcements.filter((a) => a.status === "draft").length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Archivées</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{announcements.filter((a) => a.status === "archived").length}</div></CardContent></Card>
        </div>
        <Card>
          <CardHeader><CardTitle>Annonces</CardTitle></CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground"><Megaphone className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Aucune annonce</p></div>
            ) : filtered.map((a) => {
              const st = statusConfig[a.status] ?? statusConfig.draft;
              const Icon = st.icon;
              return (
                <div key={a.id} className="flex gap-4 p-4 border rounded-lg mb-3">
                  <div className="flex-1">
                    <div className="flex gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold">{a.title}</h3>
                      <Badge className={typeConfig[a.type] ?? typeConfig.info}>{a.type}</Badge>
                      <Badge className={st.color}><Icon className="w-3 h-3 mr-1" />{st.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{a.content}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setPreview(a)}><Eye className="w-4 h-4 mr-2" />Prévisualiser</DropdownMenuItem>
                      {a.status !== "published" && <DropdownMenuItem onClick={() => publish(a.id)}><Send className="w-4 h-4 mr-2" />Publier</DropdownMenuItem>}
                      {a.status === "published" && <DropdownMenuItem onClick={() => archive(a.id)}>Archiver</DropdownMenuItem>}
                      <DeleteConfirmDialog onConfirm={() => remove(a.id)} trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}><Trash2 className="w-4 h-4 mr-2" />Supprimer</DropdownMenuItem>} />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouvelle annonce</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Titre</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Contenu</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
              <Button className="w-full gradient-hero border-0" onClick={create}>Créer</Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>{preview?.title}</DialogTitle></DialogHeader>
            <p className="text-sm">{preview?.content}</p>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminAnnouncements;
