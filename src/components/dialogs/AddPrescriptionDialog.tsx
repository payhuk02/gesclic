import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, AlertTriangle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import {
  formatFcfaDot,
  medicationLineTotal,
  prescriptionTotal,
  type PrescriptionMedication,
} from "@/lib/prescription-meds";
import { checkAllergyConflict } from "@/lib/allergy-checker";

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
  patients?: { id: string; name: string; allergies?: string }[];
  doctors?: { id: string; name: string }[];
}

const AddPrescriptionDialog = ({ onAdd, onEdit, editData, trigger, patients, doctors }: Props) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PrescriptionForm>(emptyForm);
  const [draft, setDraft] = useState<PrescriptionMedication>(emptyMed);
  const isEdit = !!editData;

  const patientList = patients || [];
  const doctorList = doctors || [];

  const selectedPatient = useMemo(() => {
    return patientList.find((p) => p.id === form.patientId || p.name === form.patientName);
  }, [patientList, form.patientId, form.patientName]);

  const patientAllergies = selectedPatient?.allergies;
  const hasKnownAllergies =
    !!patientAllergies &&
    patientAllergies.trim().toLowerCase() !== "aucune" &&
    patientAllergies.trim().toLowerCase() !== "neant";

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

    if (hasKnownAllergies) {
      const conflict = checkAllergyConflict(patientAllergies, name);
      if (conflict.hasConflict) {
        toast.error(conflict.message || `Attention : Risque d'allergie pour « ${name} » !`, {
          duration: 6000,
        });
      }
    }

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

    // Safety check for all medications
    if (hasKnownAllergies) {
      const conflicts = form.medications
        .map((m) => checkAllergyConflict(patientAllergies, m.name))
        .filter((c) => c.hasConflict);

      if (conflicts.length > 0) {
        const confirmPrescribe = window.confirm(
          `ALERTE PHARMACOLOGIQUE :\n${conflicts.map((c) => c.message).join("\n")}\n\nSouhaitez-vous tout de même confirmer cette prescription sous votre responsabilité médicale ?`,
        );
        if (!confirmPrescribe) return;
      }
    }

    if (isEdit) onEdit?.(form);
    else onAdd?.(form);
    setForm(emptyForm);
    setOpen(false);
  };

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

          {hasKnownAllergies && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Allergies déclarées du patient : {patientAllergies}</p>
                <p className="text-muted-foreground mt-0.5">
                  Vérifiez scrupuleusement les principes actifs et interactions croisées avant toute prescription.
                </p>
              </div>
            </div>
          )}

          <div>
            <Label>Médicaments *</Label>
            <div className="flex flex-col md:flex-row gap-2 mt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Nom"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMed())}
                />
                <Input
                  value={draft.dosage}
                  onChange={(e) => setDraft({ ...draft, dosage: e.target.value })}
                  placeholder="Posologie"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMed())}
                />
              </div>
              <div className="flex items-center gap-2">
                <Input
                  className="w-20 shrink-0"
                  type="number"
                  min={1}
                  value={draft.quantity}
                  onChange={(e) => setDraft({ ...draft, quantity: Number(e.target.value) })}
                  placeholder="Qté"
                  title="Quantité"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMed())}
                />
                <Input
                  className="w-24 sm:w-28 shrink-0"
                  type="number"
                  min={0}
                  value={draft.unitPrice || ""}
                  onChange={(e) => setDraft({ ...draft, unitPrice: Number(e.target.value) })}
                  placeholder="Prix"
                  title="Prix unitaire"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMed())}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 px-3.5 gap-1.5 whitespace-nowrap hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={addMed}
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>Ajouter</span>
                </Button>
              </div>
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
                    {form.medications.map((m, i) => {
                      const conflict = hasKnownAllergies
                        ? checkAllergyConflict(patientAllergies, m.name)
                        : { hasConflict: false };

                      return (
                        <tr key={`${m.name}-${i}`} className={conflict.hasConflict ? "border-t border-destructive/30 bg-destructive/5" : "border-t border-border"}>
                          <td className="p-2">
                            <Input value={m.name} onChange={(e) => updateLine(i, { name: e.target.value })} className="h-8" />
                            {conflict.hasConflict && (
                              <div className="flex items-center gap-1 text-[11px] text-destructive font-medium mt-1">
                                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                                <span>Alerte allergie : {conflict.matchedAllergy}</span>
                              </div>
                            )}
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
                      );
                    })}
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
