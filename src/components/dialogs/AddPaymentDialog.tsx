import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

export interface PaymentForm {
  patientName: string;
  amount: number;
  method: string;
  description: string;
}

const methods = ["Orange Money", "Wave", "MTN Mobile Money", "Moov Money", "Espèces", "Carte bancaire"];
const emptyForm: PaymentForm = { patientName: "", amount: 0, method: "Orange Money", description: "" };

interface Props {
  onAdd?: (payment: PaymentForm) => void;
  onEdit?: (payment: PaymentForm) => void;
  editData?: PaymentForm | null;
  trigger?: React.ReactNode;
  patients?: { id: string; name: string }[];
}

const AddPaymentDialog = ({ onAdd, onEdit, editData, trigger, patients }: Props) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PaymentForm>(emptyForm);
  const isEdit = !!editData;

  useEffect(() => {
    if (editData && open) setForm(editData);
    else if (!open) setForm(emptyForm);
  }, [editData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientName || !form.amount || !form.description) return;
    if (isEdit) onEdit?.(form);
    else onAdd?.(form);
    setForm(emptyForm);
    setOpen(false);
  };

  const patientList = patients || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gradient-hero border-0 gap-2">
            <Plus className="w-4 h-4" />
            Nouveau paiement
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le paiement" : "Enregistrer un paiement"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Patient *</Label>
            {patientList.length > 0 ? (
              <Select value={form.patientName} onValueChange={(v) => setForm({ ...form, patientName: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {patientList.map((p) => (
                    <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input className="mt-1" value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} placeholder="Nom du patient" />
            )}
          </div>
          <div>
            <Label>Description *</Label>
            <Input className="mt-1" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Consultation générale" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Montant (FCFA) *</Label>
              <Input className="mt-1" type="number" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} placeholder="15000" />
            </div>
            <div>
              <Label>Méthode</Label>
              <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {methods.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" className="gradient-hero border-0">{isEdit ? "Enregistrer" : "Enregistrer"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPaymentDialog;
