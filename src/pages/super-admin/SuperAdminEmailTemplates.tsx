import { useEffect, useState } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Mail, Search, Plus, Trash2, MoreVertical, Eye, CheckCircle } from "lucide-react";
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

interface EmailTemplate {
  id: string;
  key: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string | null;
  category: string;
  template_type: string;
  variables: unknown;
  is_active: boolean;
  updated_at: string;
}

const SuperAdminEmailTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [preview, setPreview] = useState<EmailTemplate | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ key: "", name: "", subject: "", html_content: "", template_type: "transactional", category: "system" });

  const load = async () => {
    const { data } = await fromAdmin("email_templates").select("*").order("updated_at", { ascending: false });
    setTemplates((data ?? []) as EmailTemplate[]);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.key.trim() || !form.name.trim() || !form.subject.trim()) return toast.error("Champs requis manquants");
    const { error } = await fromAdmin("email_templates").insert(form);
    if (error) toast.error(error.message);
    else { toast.success("Template créé"); setDialogOpen(false); load(); }
  };

  const toggle = async (t: EmailTemplate) => {
    const { error } = await fromAdmin("email_templates").update({ is_active: !t.is_active }).eq("id", t.id);
    if (error) toast.error("Mise à jour impossible");
    else { toast.success("Template mis à jour"); load(); }
  };

  const remove = async (id: string) => {
    const { error } = await fromAdmin("email_templates").delete().eq("id", id);
    if (error) toast.error("Suppression impossible");
    else { toast.success("Template supprimé"); load(); }
  };

  const filtered = templates.filter((t) => {
    const hay = `${t.name} ${t.key} ${t.subject}`.toLowerCase();
    return hay.includes(search.toLowerCase()) && (typeFilter === "all" || t.template_type === typeFilter);
  });

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Email Templates</h1>
            <p className="text-muted-foreground">Templates enregistrés en base</p>
          </div>
          <Button className="gradient-hero border-0" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Nouveau Template</Button>
        </div>
        <Card>
          <CardContent className="p-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un template..." className="pl-10" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="transactional">Transactionnel</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="notification">Notification</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{templates.length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Actifs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{templates.filter((t) => t.is_active).length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Inactifs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{templates.filter((t) => !t.is_active).length}</div></CardContent></Card>
        </div>
        <Card>
          <CardHeader><CardTitle>Templates</CardTitle></CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground"><Mail className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Aucun template</p></div>
            ) : filtered.map((t) => (
              <div key={t.id} className="flex gap-4 p-4 border rounded-lg mb-3">
                <div className="flex-1">
                  <div className="flex gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold">{t.name}</h3>
                    <Badge variant="outline">{t.template_type}</Badge>
                    {t.is_active && <Badge className="bg-success/10 text-success"><CheckCircle className="w-3 h-3 mr-1" />Actif</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{t.key}</p>
                  <p className="text-sm">{t.subject}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setPreview(t)}><Eye className="w-4 h-4 mr-2" />Prévisualiser</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggle(t)}>{t.is_active ? "Désactiver" : "Activer"}</DropdownMenuItem>
                    <DeleteConfirmDialog onConfirm={() => remove(t.id)} trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}><Trash2 className="w-4 h-4 mr-2" />Supprimer</DropdownMenuItem>} />
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </CardContent>
        </Card>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouveau template</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Clé</Label><Input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} /></div>
              <div><Label>Nom</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Sujet</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
              <div><Label>HTML</Label><Textarea value={form.html_content} onChange={(e) => setForm({ ...form, html_content: e.target.value })} /></div>
              <Button className="w-full gradient-hero border-0" onClick={create}>Créer</Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader><DialogTitle>{preview?.name}</DialogTitle></DialogHeader>
            <Input value={preview?.subject ?? ""} disabled />
            <Textarea value={preview?.html_content || preview?.text_content || ""} disabled className="min-h-48 font-mono text-xs" />
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminEmailTemplates;
