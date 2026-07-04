import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil } from "lucide-react";

export interface PatientForm {
  name: string;
  phone: string;
  email: string;
  sex: string;
  dob: string;
  bloodGroup: string;
  allergies: string;
}

const emptyForm: PatientForm = { name: "", phone: "", email: "", sex: "M", dob: "", bloodGroup: "O+", allergies: "Aucune" };

interface Props {
  onAdd?: (patient: PatientForm) => void;
  onEdit?: (patient: PatientForm) => void;
  editData?: PatientForm | null;
  trigger?: React.ReactNode;
}

const AddPatientDialog = ({ onAdd, onEdit, editData, trigger }: Props) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PatientForm>(emptyForm);
  const isEdit = !!editData;

  useEffect(() => {
    if (editData && open) setForm(editData);
    else if (!open) setForm(emptyForm);
  }, [editData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
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
            Nouveau patient
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">{isEdit ? "Modifier le patient" : "Ajouter un patient"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label className="text-sm">Nom complet *</Label>
              <Input className="mt-1.5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Moussa Camara" />
            </div>
            <div>
              <Label className="text-sm">Téléphone *</Label>
              <Input className="mt-1.5" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+225 07 08 09 10" />
            </div>
            <div>
              <Label className="text-sm">Email</Label>
              <Input className="mt-1.5" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
            </div>
            <div>
              <Label className="text-sm">Date de naissance</Label>
              <Input className="mt-1.5" type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
            </div>
            <div>
              <Label className="text-sm">Sexe</Label>
              <Select value={form.sex} onValueChange={(v) => setForm({ ...form, sex: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Homme</SelectItem>
                  <SelectItem value="F">Femme</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Groupe sanguin</Label>
              <Select value={form.bloodGroup} onValueChange={(v) => setForm({ ...form, bloodGroup: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-sm">Allergies</Label>
            <Input className="mt-1.5" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} placeholder="Aucune" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" className="gradient-hero border-0">{isEdit ? "Enregistrer" : "Ajouter"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPatientDialog;
