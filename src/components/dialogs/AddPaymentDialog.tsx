import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ShieldCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  computeInsuranceSplit,
  encodeInsuranceDescription,
  extractInsuranceFromDescription,
} from "@/lib/insurance";

export interface PaymentForm {
  patientId: string;
  patientName: string;
  amount: number;
  method: string;
  description: string;
}

const methods = ["Orange Money", "Wave", "MTN Mobile Money", "Moov Money", "Espèces", "Carte bancaire"];
const emptyForm: PaymentForm = { patientId: "", patientName: "", amount: 0, method: "Orange Money", description: "" };

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
  const [hasInsurance, setHasInsurance] = useState(false);
  const [insuranceName, setInsuranceName] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [coveragePercentage, setCoveragePercentage] = useState<number>(80);

  const isEdit = !!editData;

  useEffect(() => {
    if (editData && open) {
      const { insurance, cleanDescription } = extractInsuranceFromDescription(editData.description);
      setForm({ ...editData, description: cleanDescription });
      if (insurance) {
        setHasInsurance(true);
        setInsuranceName(insurance.insuranceName);
        setPolicyNumber(insurance.policyNumber || "");
        setCoveragePercentage(insurance.coveragePercentage);
      } else {
        setHasInsurance(false);
        setInsuranceName("");
        setPolicyNumber("");
        setCoveragePercentage(80);
      }
    } else if (!open) {
      setForm(emptyForm);
      setHasInsurance(false);
      setInsuranceName("");
      setPolicyNumber("");
      setCoveragePercentage(80);
    }
  }, [editData, open]);

  const insuranceSplit = useMemo(() => {
    if (!hasInsurance || !coveragePercentage) return null;
    return computeInsuranceSplit(form.amount, coveragePercentage);
  }, [hasInsurance, coveragePercentage, form.amount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientName || !form.amount || !form.description) return;

    let finalDescription = form.description;
    if (hasInsurance && insuranceName.trim() && coveragePercentage > 0 && insuranceSplit) {
      finalDescription = encodeInsuranceDescription(form.description, {
        insuranceName: insuranceName.trim(),
        policyNumber: policyNumber.trim() || undefined,
        coveragePercentage,
        insuranceShare: insuranceSplit.insuranceShare,
        patientShare: insuranceSplit.patientShare,
      });
    }

    const payload = { ...form, description: finalDescription };
    if (isEdit) onEdit?.(payload);
    else onAdd?.(payload);
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">{isEdit ? "Modifier le paiement" : "Enregistrer un paiement"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <Label>Patient *</Label>
            {patientList.length > 0 ? (
              <Select value={form.patientId || form.patientName} onValueChange={(v) => {
                const p = patientList.find((x) => x.id === v);
                setForm({ ...form, patientId: v, patientName: p?.name || v });
              }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {patientList.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input className="mt-1" value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} placeholder="Nom du patient" />
            )}
          </div>
          <div>
            <Label>Description de l'acte *</Label>
            <Input className="mt-1" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Consultation générale, échographie..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Montant total (FCFA) *</Label>
              <Input className="mt-1" type="number" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} placeholder="15000" />
            </div>
            <div>
              <Label>Méthode d'encaissement</Label>
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

          {/* Section Prise en Charge Assurance / Tiers-Payant */}
          <div className="p-3.5 rounded-xl border border-border bg-secondary/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <Label htmlFor="insurance-toggle" className="text-xs font-semibold text-foreground cursor-pointer">
                  Tiers-Payant / Assurance & Mutuelle
                </Label>
              </div>
              <Switch
                id="insurance-toggle"
                checked={hasInsurance}
                onCheckedChange={setHasInsurance}
              />
            </div>

            {hasInsurance && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Assureur / Mutuelle *</Label>
                    <Input
                      placeholder="CNAM, NSIA, Sunu..."
                      className="h-8 mt-1 text-xs"
                      value={insuranceName}
                      onChange={(e) => setInsuranceName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">N° Assuré / Police</Label>
                    <Input
                      placeholder="POL-123456"
                      className="h-8 mt-1 text-xs"
                      value={policyNumber}
                      onChange={(e) => setPolicyNumber(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-[11px] text-muted-foreground">Taux de couverture (%)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    className="h-8 mt-1 text-xs"
                    value={coveragePercentage || ""}
                    onChange={(e) => setCoveragePercentage(Math.min(100, Math.max(0, Number(e.target.value))))}
                  />
                </div>

                {insuranceSplit && form.amount > 0 && (
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-card border border-border text-xs">
                    <div>
                      <span className="text-muted-foreground">Part Assurance ({coveragePercentage}%) :</span>
                      <p className="font-semibold text-primary">{insuranceSplit.insuranceShare.toLocaleString()} FCFA</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Part Patient (Ticket mod.) :</span>
                      <p className="font-semibold text-foreground">{insuranceSplit.patientShare.toLocaleString()} FCFA</p>
                    </div>
                  </div>
                )}
              </div>
            )}
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
