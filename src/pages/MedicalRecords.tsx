import AppLayout from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, FileText, Stethoscope, ChevronDown, ChevronUp, Loader2, Pencil, SearchX, ClipboardList, Activity, Heart, Thermometer, Scale } from "lucide-react";
import { useState, useMemo } from "react";
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
import {
  calculateBMI,
  encodeVitalsToNotes,
  extractVitalsFromNotes,
  type VitalSigns,
} from "@/lib/vitals";

interface RecordForm { patient_id: string; patient_name: string; date: string; diagnosis: string; treatment: string; notes: string }
const empty: RecordForm = { patient_id: "", patient_name: "", date: new Date().toISOString().split("T")[0], diagnosis: "", treatment: "", notes: "" };

const RecordDialog = ({ trigger, initial, onSubmit, title, patients }: {
  trigger: React.ReactNode; initial?: RecordForm; onSubmit: (f: RecordForm) => void; title: string;
  patients: { id: string; name: string }[];
}) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<RecordForm>(() => {
    if (!initial) return empty;
    const { cleanNotes } = extractVitalsFromNotes(initial.notes);
    return { ...initial, notes: cleanNotes };
  });

  const [vitals, setVitals] = useState<VitalSigns>(() => {
    if (!initial) return {};
    const { vitals: v } = extractVitalsFromNotes(initial.notes);
    return v || {};
  });

  const bmiEval = useMemo(() => calculateBMI(vitals.weight, vitals.height), [vitals.weight, vitals.height]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient_name || !form.diagnosis) return;

    const fullNotes = encodeVitalsToNotes(vitals, form.notes);
    onSubmit({ ...form, notes: fullNotes });
    setOpen(false);
    if (!initial) {
      setForm(empty);
      setVitals({});
    }
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (v && initial) {
      const { vitals: extractedVitals, cleanNotes } = extractVitalsFromNotes(initial.notes);
      setForm({ ...initial, notes: cleanNotes });
      setVitals(extractedVitals || {});
    } else if (!v && !initial) {
      setForm(empty);
      setVitals({});
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Patient *</Label>
            {patients.length > 0 ? (
              <Select value={form.patient_id || form.patient_name} onValueChange={(v) => {
                const p = patients.find((x) => x.id === v);
                setForm({ ...form, patient_id: v, patient_name: p?.name || v });
              }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner un patient" /></SelectTrigger>
                <SelectContent>{patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            ) : <Input className="mt-1" value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} />}
          </div>
          <div><Label>Date *</Label><Input className="mt-1" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <div><Label>Diagnostic *</Label><Input className="mt-1" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} placeholder="ex: Rhinopharyngite aiguë, Hypertension..." /></div>

          {/* Section Constantes Vitales */}
          <div className="p-3.5 rounded-xl border border-border bg-secondary/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-primary" />
                Constantes vitales & Biomécanique
              </span>
              {bmiEval && (
                <Badge variant="outline" className={`text-[10px] ${bmiEval.color}`}>
                  IMC: {bmiEval.bmi} kg/m² ({bmiEval.category})
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <Label className="text-[11px] text-muted-foreground">TA Syst. (mmHg)</Label>
                <Input
                  type="number"
                  placeholder="120"
                  className="h-8 mt-1 text-xs"
                  value={vitals.bp_systolic || ""}
                  onChange={(e) => setVitals({ ...vitals, bp_systolic: Number(e.target.value) || undefined })}
                />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">TA Diast. (mmHg)</Label>
                <Input
                  type="number"
                  placeholder="80"
                  className="h-8 mt-1 text-xs"
                  value={vitals.bp_diastolic || ""}
                  onChange={(e) => setVitals({ ...vitals, bp_diastolic: Number(e.target.value) || undefined })}
                />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Pouls (bpm)</Label>
                <Input
                  type="number"
                  placeholder="72"
                  className="h-8 mt-1 text-xs"
                  value={vitals.heart_rate || ""}
                  onChange={(e) => setVitals({ ...vitals, heart_rate: Number(e.target.value) || undefined })}
                />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Température (°C)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="37.0"
                  className="h-8 mt-1 text-xs"
                  value={vitals.temperature || ""}
                  onChange={(e) => setVitals({ ...vitals, temperature: Number(e.target.value) || undefined })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div>
                <Label className="text-[11px] text-muted-foreground">SpO2 (%)</Label>
                <Input
                  type="number"
                  placeholder="98"
                  className="h-8 mt-1 text-xs"
                  value={vitals.spo2 || ""}
                  onChange={(e) => setVitals({ ...vitals, spo2: Number(e.target.value) || undefined })}
                />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Poids (kg)</Label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="70"
                  className="h-8 mt-1 text-xs"
                  value={vitals.weight || ""}
                  onChange={(e) => setVitals({ ...vitals, weight: Number(e.target.value) || undefined })}
                />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Taille (cm)</Label>
                <Input
                  type="number"
                  placeholder="175"
                  className="h-8 mt-1 text-xs"
                  value={vitals.height || ""}
                  onChange={(e) => setVitals({ ...vitals, height: Number(e.target.value) || undefined })}
                />
              </div>
            </div>
          </div>

          <div><Label>Traitement</Label><Textarea className="mt-1" value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })} placeholder="Posologie, soins prescrits, arrêt de travail..." /></div>
          <div><Label>Notes cliniques</Label><Textarea className="mt-1" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Observations, antécédents, examens complémentaires..." /></div>
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
        <div className="flex items-center justify-center py-16 sm:py-20"><Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-primary" /></div>
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
            const { vitals, cleanNotes } = extractVitalsFromNotes(record.notes);
            const bmiEval = vitals ? calculateBMI(vitals.weight, vitals.height) : null;

            return (
              <div key={record.id} className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
                <button onClick={() => setExpanded(isExpanded ? null : record.id)} className="w-full flex items-center gap-4 p-5 text-left hover:bg-secondary/20 transition-colors">
                  <Stethoscope className="w-6 h-6 text-primary shrink-0" strokeWidth={1.75} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground">{record.patient_name}</p>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Consultation</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{record.diagnosis}</p>
                    {vitals && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {vitals.bp_systolic && vitals.bp_diastolic && (
                          <Badge variant="outline" className="text-[10px] bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20">
                            TA: {vitals.bp_systolic}/{vitals.bp_diastolic}
                          </Badge>
                        )}
                        {vitals.heart_rate && (
                          <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20">
                            FC: {vitals.heart_rate} bpm
                          </Badge>
                        )}
                        {vitals.temperature && (
                          <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                            T°: {vitals.temperature}°C
                          </Badge>
                        )}
                        {bmiEval && (
                          <Badge variant="outline" className={`text-[10px] ${bmiEval.color}`}>
                            IMC: {bmiEval.bmi} ({bmiEval.category})
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-sm text-foreground">{record.date}</p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" strokeWidth={1.75} /> : <ChevronDown className="w-5 h-5 text-muted-foreground" strokeWidth={1.75} />}
                </button>
                {isExpanded && (
                  <div className="border-t border-border p-5 space-y-4 bg-secondary/10">
                    {vitals && (
                      <div className="p-3.5 rounded-xl bg-card border border-border">
                        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-primary" />
                          Constantes vitales relevées
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-muted-foreground">
                          {vitals.bp_systolic && vitals.bp_diastolic && <div>TA : <strong className="text-foreground">{vitals.bp_systolic}/{vitals.bp_diastolic} mmHg</strong></div>}
                          {vitals.heart_rate && <div>Pouls : <strong className="text-foreground">{vitals.heart_rate} bpm</strong></div>}
                          {vitals.temperature && <div>T° : <strong className="text-foreground">{vitals.temperature} °C</strong></div>}
                          {vitals.spo2 && <div>SpO2 : <strong className="text-foreground">{vitals.spo2}%</strong></div>}
                          {vitals.weight && <div>Poids : <strong className="text-foreground">{vitals.weight} kg</strong></div>}
                          {vitals.height && <div>Taille : <strong className="text-foreground">{vitals.height} cm</strong></div>}
                          {bmiEval && <div className="col-span-2">IMC : <strong className="text-foreground">{bmiEval.bmi} kg/m²</strong> ({bmiEval.category})</div>}
                        </div>
                      </div>
                    )}
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
                      <p className="text-sm text-muted-foreground italic">{cleanNotes || "—"}</p>
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
