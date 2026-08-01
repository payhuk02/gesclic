import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";

export interface PrescriptionForm {
  patientName: string;
  doctorName: string;
  medications: string[];
}

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
  const [form, setForm] = useState<PrescriptionForm>({ patientName: "", doctorName: "", medications: [] });
  const [medInput, setMedInput] = useState("");
  const isEdit = !!editData;

  useEffect(() => {
    if (editData && open) setForm(editData);
    else if (!open) setForm({ patientName: "", doctorName: "", medications: [] });
  }, [editData, open]);

  const addMed = () => {
    if (medInput.trim() && !form.medications.includes(medInput.trim())) {
      setForm({ ...form, medications: [...form.medications, medInput.trim()] });
      setMedInput("");
    }
  };

  const removeMed = (m: string) => setForm({ ...form, medications: form.medications.filter((x) => x !== m) });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientName || !form.doctorName || form.medications.length === 0) return;
    if (isEdit) onEdit?.(form);
    else onAdd?.(form);
    setForm({ patientName: "", doctorName: "", medications: [] });
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'ordonnance" : "Nouvelle ordonnance"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Patient *</Label>
            {patientList.length > 0 ? (
              <Select value={form.patientName} onValueChange={(v) => setForm({ ...form, patientName: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {patientList.map((p) => (<SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>))}
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
          <div>
            <Label>Médicaments *</Label>
            <div className="flex gap-2 mt-1">
              <Input value={medInput} onChange={(e) => setMedInput(e.target.value)} placeholder="Amoxicilline 500mg" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMed())} />
              <Button type="button" variant="outline" onClick={addMed}>Ajouter</Button>
            </div>
            {form.medications.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.medications.map((m) => (
                  <Badge key={m} variant="secondary" className="gap-1">
                    {m}
                    <button type="button" onClick={() => removeMed(m)}><X className="w-3 h-3" /></button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" className="gradient-hero border-0">{isEdit ? "Enregistrer" : "Créer"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPrescriptionDialog;
