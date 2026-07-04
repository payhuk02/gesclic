import AppLayout from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, FileText, Stethoscope, ChevronDown, ChevronUp, Loader2, Pencil, SearchX, ClipboardList } from "lucide-react";
import { useState } from "react";
import { useMedicalRecords } from "@/hooks/useMedicalRecords";
import { usePatients } from "@/hooks/usePatients";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import EmptyState from "@/components/EmptyState";

interface RecordForm { patient_name: string; date: string; diagnosis: string; treatment: string; notes: string }
const empty: RecordForm = { patient_name: "", date: new Date().toISOString().split("T")[0], diagnosis: "", treatment: "", notes: "" };

const RecordDialog = ({ trigger, initial, onSubmit, title, patients }: {
  trigger: React.ReactNode; initial?: RecordForm; onSubmit: (f: RecordForm) => void; title: string;
  patients: { id: string; name: string }[];
}) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<RecordForm>(initial || empty);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient_name || !form.diagnosis) return;
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
          <div><Label>Date *</Label><Input className="mt-1" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <div><Label>Diagnostic *</Label><Input className="mt-1" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} /></div>
          <div><Label>Traitement</Label><Textarea className="mt-1" value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })} /></div>
          <div><Label>Notes</Label><Textarea className="mt-1" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button type="submit" className="gradient-hero border-0">Enregistrer</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const MedicalRecords = () => {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const { records, loading, addRecord, updateRecord, deleteRecord } = useMedicalRecords();
  const { patients } = usePatients();

  const filtered = records.filter((r) => r.patient_name.toLowerCase().includes(search.toLowerCase()) || r.diagnosis.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppLayout title="Dossiers médicaux">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher par patient ou diagnostic..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <RecordDialog title="Nouveau dossier" patients={patients.map((p) => ({ id: p.id, name: p.name }))} onSubmit={(f) => addRecord(f)} trigger={<Button className="gradient-hero border-0 gap-2"><Plus className="w-4 h-4" />Nouveau dossier</Button>} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        search ? (
          <EmptyState icon={SearchX} title="Aucun dossier trouvé" description={`Aucun résultat pour « ${search} ».`} />
        ) : (
          <EmptyState
            icon={ClipboardList}
            title="Aucun dossier médical"
            description="Documentez vos consultations : diagnostic, traitement, notes cliniques. Chaque dossier est rattaché à un patient et horodaté."
            tips={[
              "Créez d'abord vos patients pour les retrouver dans le menu déroulant.",
              "Le champ « Notes » est idéal pour le contexte clinique non structuré.",
              "Les dossiers restent consultables depuis la fiche patient.",
            ]}
            action={<RecordDialog title="Nouveau dossier" patients={patients.map((p) => ({ id: p.id, name: p.name }))} onSubmit={(f) => addRecord(f)} trigger={<Button className="gradient-hero border-0 gap-2"><Plus className="w-4 h-4" />Créer le premier dossier</Button>} />}
          />
        )
      ) : (
        <div className="space-y-4">
          {filtered.map((record) => {
            const isExpanded = expanded === record.id;
            return (
              <div key={record.id} className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
                <button onClick={() => setExpanded(isExpanded ? null : record.id)} className="w-full flex items-center gap-4 p-5 text-left hover:bg-secondary/20 transition-colors">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/10 text-primary">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground">{record.patient_name}</p>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Consultation</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{record.diagnosis}</p>
                  </div>
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-sm text-foreground">{record.date}</p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                </button>
                {isExpanded && (
                  <div className="border-t border-border p-5 space-y-4 bg-secondary/10">
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Diagnostic</h4>
                      <p className="text-sm text-foreground font-medium">{record.diagnosis}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Traitement</h4>
                      <p className="text-sm text-foreground">{record.treatment || "—"}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Notes</h4>
                      <p className="text-sm text-muted-foreground italic">{record.notes || "—"}</p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <RecordDialog title="Modifier le dossier" initial={record} patients={patients.map((p) => ({ id: p.id, name: p.name }))} onSubmit={(f) => updateRecord(record.id, f)} trigger={<Button variant="outline" size="sm" className="gap-1"><Pencil className="w-3.5 h-3.5" />Modifier</Button>} />
                      <DeleteConfirmDialog onConfirm={() => deleteRecord(record.id)} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
};

export default MedicalRecords;
