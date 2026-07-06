import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

export interface AppointmentForm {
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  type: string;
}

const types = ["Consultation", "Suivi", "Suivi cardiaque", "Échographie", "Soin dentaire", "ECG", "Vaccination", "Détartrage", "Pédiatrie", "Bilan"];
const emptyForm: AppointmentForm = { patientName: "", doctorName: "", date: "", time: "", type: "Consultation" };

interface Props {
  onAdd?: (appt: AppointmentForm) => void;
  onEdit?: (appt: AppointmentForm) => void;
  editData?: AppointmentForm | null;
  trigger?: React.ReactNode;
  patients?: { id: string; name: string }[];
  doctors?: { id: string; name: string; specialty?: string }[];
}

const AddAppointmentDialog = ({ onAdd, onEdit, editData, trigger, patients, doctors }: Props) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AppointmentForm>(emptyForm);
  const isEdit = !!editData;

  useEffect(() => {
    if (editData && open) setForm(editData);
    else if (!open) setForm(emptyForm);
  }, [editData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientName || !form.doctorName || !form.date || !form.time) return;
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
            Nouveau rendez-vous
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-lg max-h-[calc(100vh-4rem)] overflow-y-auto pb-safe safe-area-inset-bottom">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">{isEdit ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-4 pt-2">
          <div>
            <Label className="text-sm">Patient *</Label>
            {patientList.length > 0 ? (
              <Select value={form.patientName} onValueChange={(v) => setForm({ ...form, patientName: v })}>
                <SelectTrigger className="mt-1.5 h-10 sm:h-10"><SelectValue placeholder="Sélectionner un patient" /></SelectTrigger>
                <SelectContent>
                  {patientList.map((p) => (<SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>))}
                </SelectContent>
              </Select>
            ) : (
              <Input className="mt-1.5 h-10 sm:h-10" value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} placeholder="Nom du patient" />
            )}
          </div>
          <div>
            <Label className="text-sm">Médecin *</Label>
            {doctorList.length > 0 ? (
              <Select value={form.doctorName} onValueChange={(v) => setForm({ ...form, doctorName: v })}>
                <SelectTrigger className="mt-1.5 h-10 sm:h-10"><SelectValue placeholder="Sélectionner un médecin" /></SelectTrigger>
                <SelectContent>
                  {doctorList.map((d) => (
                    <SelectItem key={d.id} value={d.name}>{d.name}{d.specialty ? ` — ${d.specialty}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input className="mt-1.5 h-10 sm:h-10" value={form.doctorName} onChange={(e) => setForm({ ...form, doctorName: e.target.value })} placeholder="Nom du médecin" />
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label className="text-sm">Date *</Label>
              <Input className="mt-1.5 h-10 sm:h-10" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <Label className="text-sm">Heure *</Label>
              <Input className="mt-1.5 h-10 sm:h-10" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </div>
          </div>
          <div>
            <Label className="text-sm">Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger className="mt-1.5 h-10 sm:h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                {types.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-2 pt-4 pb-safe">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">Annuler</Button>
            <Button type="submit" className="gradient-hero border-0 w-full sm:w-auto">{isEdit ? "Enregistrer" : "Créer"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAppointmentDialog;
