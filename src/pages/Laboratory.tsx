import AppLayout from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, FlaskConical, CheckCircle, Clock, Loader2, FileCheck, Pencil, SearchX } from "lucide-react";
import { useState } from "react";
import { useLabResults, type LabStatus } from "@/hooks/useLabResults";
import { usePatients } from "@/hooks/usePatients";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import EmptyState from "@/components/EmptyState";

const statusConfig: Record<LabStatus, { label: string; icon: typeof Clock; className: string }> = {
  pending: { label: "En attente", icon: Clock, className: "bg-muted text-muted-foreground" },
  in_progress: { label: "En cours", icon: Loader2, className: "bg-warning/10 text-warning border-warning/20" },
  completed: { label: "Terminé", icon: FileCheck, className: "bg-primary/10 text-primary border-primary/20" },
  validated: { label: "Validé", icon: CheckCircle, className: "bg-success/10 text-success border-success/20" },
};

interface LabForm { patient_name: string; analysis_type: string; date: string; result: string; status: LabStatus }
const empty: LabForm = { patient_name: "", analysis_type: "", date: new Date().toISOString().split("T")[0], result: "", status: "pending" };

const LabDialog = ({ trigger, initial, onSubmit, title, patients }: {
  trigger: React.ReactNode; initial?: LabForm; onSubmit: (f: LabForm) => void; title: string; patients: { id: string; name: string }[];
}) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<LabForm>(initial || empty);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient_name || !form.analysis_type) return;
    onSubmit(form);
    setOpen(false);
    if (!initial) setForm(empty);
  };
  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v && initial) setForm(initial); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Patient *</Label>
            {patients.length > 0 ? (
              <Select value={form.patient_name} onValueChange={(v) => setForm({ ...form, patient_name: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{patients.map((p) => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            ) : <Input className="mt-1" value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} />}
          </div>
          <div><Label>Type d'analyse *</Label><Input className="mt-1" value={form.analysis_type} onChange={(e) => setForm({ ...form, analysis_type: e.target.value })} placeholder="Hémogramme, Glycémie..." /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Date</Label><Input className="mt-1" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div>
              <Label>Statut</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as LabStatus })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="validated">Validé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Résultat</Label><Textarea className="mt-1" value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} /></div>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button type="submit" className="gradient-hero border-0">Enregistrer</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Laboratory = () => {
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const { results, loading, addResult, updateResult, deleteResult } = useLabResults();
  const { patients } = usePatients();

  const filtered = results.filter((a) => {
    const matchSearch = a.patient_name.toLowerCase().includes(search.toLowerCase()) || a.analysis_type.toLowerCase().includes(search.toLowerCase());
    const matchStatus = selectedStatus === "all" || a.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: results.length,
    pending: results.filter((a) => a.status === "pending").length,
    inProgress: results.filter((a) => a.status === "in_progress").length,
    completed: results.filter((a) => a.status === "completed" || a.status === "validated").length,
  };

  return (
    <AppLayout title="Laboratoire">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total analyses", value: stats.total, icon: FlaskConical, color: "text-primary bg-primary/10" },
          { label: "En attente", value: stats.pending, icon: Clock, color: "text-muted-foreground bg-muted" },
          { label: "En cours", value: stats.inProgress, icon: Loader2, color: "text-warning bg-warning/10" },
          { label: "Terminées", value: stats.completed, icon: CheckCircle, color: "text-success bg-success/10" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl p-4 shadow-card border border-border">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${s.color}`}><s.icon className="w-4 h-4" /></div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher une analyse..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {[{ key: "all", label: "Tous" }, { key: "pending", label: "En attente" }, { key: "in_progress", label: "En cours" }, { key: "completed", label: "Terminés" }, { key: "validated", label: "Validés" }].map((f) => (
            <Button key={f.key} variant={selectedStatus === f.key ? "default" : "outline"} size="sm" onClick={() => setSelectedStatus(f.key)} className={selectedStatus === f.key ? "gradient-hero border-0" : ""}>
              {f.label}
            </Button>
          ))}
        </div>
        <LabDialog title="Nouvelle analyse" patients={patients.map((p) => ({ id: p.id, name: p.name }))} onSubmit={(f) => addResult(f)} trigger={<Button className="gradient-hero border-0 gap-2 flex-shrink-0"><Plus className="w-4 h-4" />Nouvelle analyse</Button>} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : results.length === 0 ? (
        <div className="bg-card rounded-xl shadow-card border border-border">
          <EmptyState
            icon={FlaskConical}
            title="Aucune analyse enregistrée"
            description="Prescrivez des analyses de laboratoire à vos patients et suivez leur cycle : en attente → en cours → terminé → validé."
            tips={[
              "Le statut « Validé » indique qu'un médecin a signé le résultat.",
              "Les résultats sont consultables depuis la fiche patient.",
              "Utilisez le champ « Type d'analyse » pour standardiser (Hémogramme, Glycémie…).",
            ]}
            action={<LabDialog title="Nouvelle analyse" patients={patients.map((p) => ({ id: p.id, name: p.name }))} onSubmit={(f) => addResult(f)} trigger={<Button className="gradient-hero border-0 gap-2"><Plus className="w-4 h-4" />Créer une analyse</Button>} />}
          />
        </div>
      ) : (
        <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Patient</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Analyse</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="py-4"><EmptyState compact icon={SearchX} title="Aucun résultat" description={search ? `Rien pour « ${search} ».` : "Aucune analyse dans cette catégorie."} /></td></tr>
                ) : filtered.map((a) => {
                  const sc = statusConfig[a.status];
                  return (
                    <tr key={a.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{a.patient_name}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground">{a.analysis_type}</p>
                        {a.result && <p className="text-xs text-muted-foreground mt-0.5 max-w-xs truncate">{a.result}</p>}
                      </td>
                      <td className="px-4 py-3"><Badge variant="outline" className={sc.className}><sc.icon className="w-3 h-3 mr-1" />{sc.label}</Badge></td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{a.date}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <LabDialog title="Modifier l'analyse" initial={a} patients={patients.map((p) => ({ id: p.id, name: p.name }))} onSubmit={(f) => updateResult(a.id, f)} trigger={<Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="w-3.5 h-3.5" /></Button>} />
                          <DeleteConfirmDialog onConfirm={() => deleteResult(a.id)} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Laboratory;
