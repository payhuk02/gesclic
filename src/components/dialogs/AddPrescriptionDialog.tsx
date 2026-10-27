import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  formatFcfaDot,
  medicationLineTotal,
  prescriptionTotal,
  type PrescriptionMedication,
} from "@/lib/prescription-meds";

export interface PrescriptionForm {
  patientId: string;
  patientName: string;
  doctorName: string;
  medications: PrescriptionMedication[];
  notes: string;
}

const emptyMed: PrescriptionMedication = { name: "", dosage: "", quantity: 1, unitPrice: 0 };
const emptyForm: PrescriptionForm = { patientId: "", patientName: "", doctorName: "", medications: [], notes: "" };

interface Props {
  onAdd?: (rx: PrescriptionForm) => void;
  onEdit?: (rx: PrescriptionForm) => void;
  editData?: PrescriptionForm | null;
  trigger?: React.ReactNode;
  patients?: { id: string; name: string }[];
  doctors?: { id: string; name: string }[];
}

const AddPrescriptionDialog = ({ onAdd, onEdit, editData, trigger, patients, doctors }: Props) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PrescriptionForm>(emptyForm);
  const [draft, setDraft] = useState<PrescriptionMedication>(emptyMed);
  const isEdit = !!editData;

  useEffect(() => {
    if (editData && open) setForm({ ...emptyForm, ...editData, notes: editData.notes || "" });
    else if (!open) {
      setForm(emptyForm);
      setDraft(emptyMed);
    }
  }, [editData, open]);

  const total = useMemo(() => prescriptionTotal(form.medications), [form.medications]);

  const addMed = () => {
    const name = draft.name.trim();
    if (!name) return;
    setForm({
      ...form,
      medications: [
        ...form.medications,
        {
          name,
          dosage: draft.dosage.trim(),
          quantity: Math.max(1, Number(draft.quantity) || 1),
          unitPrice: Math.max(0, Number(draft.unitPrice) || 0),
        },
      ],
    });
    setDraft(emptyMed);
  };

  const updateLine = (index: number, patch: Partial<PrescriptionMedication>) => {
    setForm({
      ...form,
      medications: form.medications.map((m, i) => (i === index ? { ...m, ...patch } : m)),
    });
  };

  const removeMed = (index: number) => {
    setForm({ ...form, medications: form.medications.filter((_, i) => i !== index) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientName || !form.doctorName) return;
    if (form.medications.length === 0) {
      toast.error("Ajoutez au moins un médicament");
      return;
    }
    if (isEdit) onEdit?.(form);
    else onAdd?.(form);
    setForm(emptyForm);
    setOpen(false);
  };

  const patientList = patients || [];
  const doctorList = doctors || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gradient-hero border-0 gap-2">
            <Plus className="w-4 h-4" />
            Nouvelle ordonnance
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">{isEdit ? "Modifier l'ordonnance" : "Nouvelle ordonnance"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Patient *</Label>
              {patientList.length > 0 ? (
                <Select value={form.patientId || form.patientName} onValueChange={(v) => {
                  const p = patientList.find((x) => x.id === v);
                  setForm({ ...form, patientId: v, patientName: p?.name || v });
                }}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {patientList.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              ) : (
                <Input className="mt-1" value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} placeholder="Nom du patient" />
              )}
            </div>
            <div>
              <Label>Médecin *</Label>
              {doctorList.length > 0 ? (
                <Select value={form.doctorName} onValueChange={(v) => setForm({ ...form, doctorName: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {doctorList.map((d) => (<SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              ) : (
                <Input className="mt-1" value={form.doctorName} onChange={(e) => setForm({ ...form, doctorName: e.target.value })} placeholder="Nom du médecin" />
              )}
            </div>
          </div>

          <div>
            <Label>Médicaments *</Label>
            <div className="grid grid-cols-2 sm:grid-cols-12 gap-2 mt-1">
              <Input className="sm:col-span-4" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Nom" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMed())} />
              <Input className="sm:col-span-3" value={draft.dosage} onChange={(e) => setDraft({ ...draft, dosage: e.target.value })} placeholder="Posologie" />
              <Input className="sm:col-span-2" type="number" min={1} value={draft.quantity} onChange={(e) => setDraft({ ...draft, quantity: Number(e.target.value) })} placeholder="Qté" />
              <Input className="sm:col-span-2" type="number" min={0} value={draft.unitPrice || ""} onChange={(e) => setDraft({ ...draft, unitPrice: Number(e.target.value) })} placeholder="Prix" />
              <Button type="button" variant="outline" className="sm:col-span-1" onClick={addMed}>Ajouter</Button>
            </div>
            {form.medications.length > 0 && (
              <div className="mt-3 border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="text-left p-2 font-medium">Médicament</th>
                      <th className="text-left p-2 font-medium hidden sm:table-cell">Posologie</th>
                      <th className="text-right p-2 font-medium">Qté</th>
                      <th className="text-right p-2 font-medium">P.U.</th>
                      <th className="text-right p-2 font-medium">Montant</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {form.medications.map((m, i) => (
                      <tr key={`${m.name}-${i}`} className="border-t border-border">
                        <td className="p-2">
                          <Input value={m.name} onChange={(e) => updateLine(i, { name: e.target.value })} className="h-8" />
                        </td>
                        <td className="p-2 hidden sm:table-cell">
                          <Input value={m.dosage} onChange={(e) => updateLine(i, { dosage: e.target.value })} className="h-8" />
                        </td>
                        <td className="p-2 w-16">
                          <Input type="number" min={1} value={m.quantity} onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })} className="h-8 text-right" />
                        </td>
                        <td className="p-2 w-24">
                          <Input type="number" min={0} value={m.unitPrice} onChange={(e) => updateLine(i, { unitPrice: Number(e.target.value) })} className="h-8 text-right" />
                        </td>
                        <td className="p-2 text-right tabular-nums whitespace-nowrap">{formatFcfaDot(medicationLineTotal(m))} F</td>
                        <td className="p-1">
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeMed(i)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end px-3 py-2 bg-muted/30 border-t border-border text-sm font-semibold">
                  Total : {formatFcfaDot(total)} FCFA
                </div>
              </div>
            )}
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea className="mt-1" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Conseils, durée du traitement…" />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" className="gradient-hero border-0">{isEdit ? "Enregistrer" : "Créer"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPrescriptionDialog;
