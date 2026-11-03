import AppLayout from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Pencil, Loader2, Download, Printer, CheckCircle2, PackageCheck } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import AddPrescriptionDialog from "@/components/dialogs/AddPrescriptionDialog";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import type { PrescriptionForm } from "@/components/dialogs/AddPrescriptionDialog";
import { usePrescriptions } from "@/hooks/usePrescriptions";
import { usePatients } from "@/hooks/usePatients";
import { useDoctors } from "@/hooks/useDoctors";
import { usePharmacyStock } from "@/hooks/usePharmacyStock";
import { useClinic } from "@/contexts/ClinicContext";
import { generatePrescriptionPDF } from "@/utils/exportUtils";
import { formatFcfaDot, medicationLabel, prescriptionTotal } from "@/lib/prescription-meds";
import { toast } from "sonner";

const Prescriptions = () => {
  const { prescriptions, loading, addPrescription, updatePrescription, setPrescriptionStatus, deletePrescription } = usePrescriptions();
  const { patients } = usePatients();
  const { doctors } = useDoctors();
  const { items: pharmacyItems, updateItem: updatePharmacyItem } = usePharmacyStock();
  const { activeClinic } = useClinic();

  const lists = {
    patients: patients.map((p) => ({ id: p.id, name: p.name, allergies: p.allergies })),
    doctors: doctors.map((d) => ({ id: d.id, name: d.name })),
  };

  const handleAdd = (form: PrescriptionForm) => addPrescription({
    patient_id: form.patientId || null,
    patient_name: form.patientName,
    doctor_name: form.doctorName,
    medications: form.medications,
    notes: form.notes,
  });

  const handleEdit = (id: string, form: PrescriptionForm) => updatePrescription(id, {
    patient_id: form.patientId || null,
    patient_name: form.patientName,
    doctor_name: form.doctorName,
    medications: form.medications,
    notes: form.notes,
  });

  const handleDispenseAndDeductStock = async (rx: (typeof prescriptions)[0]) => {
    if (rx.status === "completed") {
      toast.info("Cette ordonnance a déjà été clôturée.");
      return;
    }

    let deductedCount = 0;
    const missingItems: string[] = [];

    for (const med of rx.medications) {
      const medNameLower = med.name.toLowerCase().trim();
      const stockItem = pharmacyItems.find(
        (item) =>
          item.name.toLowerCase().trim().includes(medNameLower) ||
          medNameLower.includes(item.name.toLowerCase().trim()),
      );

      if (stockItem) {
        const newQuantity = Math.max(0, stockItem.quantity - med.quantity);
        await updatePharmacyItem(stockItem.id, { quantity: newQuantity });
        deductedCount++;
      } else {
        missingItems.push(med.name);
      }
    }

    await setPrescriptionStatus(rx.id, "completed");

    if (deductedCount > 0) {
      toast.success(
        `Ordonnance délivrée et stock mis à jour (${deductedCount} produit${deductedCount > 1 ? "s" : ""} déstocké${deductedCount > 1 ? "s" : ""})`,
      );
    } else {
      toast.success("Ordonnance clôturée (aucun produit correspondant trouvé dans l'inventaire pharmacie).");
    }

    if (missingItems.length > 0) {
      toast.info(`Non trouvés en pharmacie : ${missingItems.join(", ")}`);
    }
  };

  const exportPdf = async (rx: (typeof prescriptions)[0], print = false) => {
    await generatePrescriptionPDF(
      {
        patientName: rx.patient_name,
        doctorName: rx.doctor_name,
        date: rx.date,
        notes: rx.notes,
        medications: rx.medications,
      },
      { clinicName: activeClinic?.name, logoUrl: activeClinic?.logo_url, print },
    );
    toast.success(print ? "Aperçu impression ouvert" : "PDF téléchargé");
  };

  return (
    <AppLayout title="Ordonnances">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">{prescriptions.length} ordonnance{prescriptions.length > 1 ? "s" : ""}</p>
        <AddPrescriptionDialog onAdd={handleAdd} patients={lists.patients} doctors={lists.doctors} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 sm:py-20"><Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-primary" /></div>
      ) : prescriptions.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucune ordonnance émise"
          description="Créez une ordonnance avec médicaments, posologie et prix. Téléchargez-la en PDF ou imprimez-la."
          tips={[
            "Chaque ligne a un prix unitaire et une quantité — le total se calcule automatiquement.",
            "PDF et impression depuis la fiche, avec en-tête de votre clinique.",
            "Passez le statut à « Terminée » quand le traitement est clos.",
          ]}
          action={<AddPrescriptionDialog onAdd={handleAdd} patients={lists.patients} doctors={lists.doctors} />}
        />
      ) : (
        <div className="space-y-4">
          {prescriptions.map((rx) => {
            const total = prescriptionTotal(rx.medications);
            return (
              <div key={rx.id} className="bg-card rounded-xl p-5 shadow-card border border-border">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-6 h-6 text-primary shrink-0" strokeWidth={1.75} />
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{rx.patient_name}</p>
                      <p className="text-sm text-muted-foreground">{rx.doctor_name} — {rx.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                    <Badge variant="outline" className={rx.status === "active" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-muted text-muted-foreground"}>
                      {rx.status === "active" ? "Active" : "Terminée"}
                    </Badge>
                    {rx.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                        title="Délivrer et déduire du stock pharmacie"
                        onClick={() => handleDispenseAndDeductStock(rx)}
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Délivrer & Déstocker</span>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Télécharger PDF" onClick={() => exportPdf(rx)}>
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Imprimer" onClick={() => exportPdf(rx, true)}>
                      <Printer className="w-3.5 h-3.5" />
                    </Button>
                    {rx.status === "active" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Marquer comme terminée" onClick={() => setPrescriptionStatus(rx.id, "completed")}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <AddPrescriptionDialog
                      editData={{ patientId: rx.patient_id || "", patientName: rx.patient_name, doctorName: rx.doctor_name, medications: rx.medications, notes: rx.notes }}
                      onEdit={(form) => handleEdit(rx.id, form)}
                      patients={lists.patients}
                      doctors={lists.doctors}
                      trigger={
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </Button>
                      }
                    />
                    <DeleteConfirmDialog onConfirm={() => deletePrescription(rx.id)} />
                  </div>
                </div>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      {rx.medications.map((m, i) => (
                        <tr key={`${m.name}-${i}`} className="border-t border-border/60">
                          <td className="py-1.5 pr-3 text-foreground">{medicationLabel(m)}</td>
                          <td className="py-1.5 text-right text-muted-foreground whitespace-nowrap">× {m.quantity}</td>
                          <td className="py-1.5 text-right tabular-nums whitespace-nowrap">{formatFcfaDot(m.quantity * m.unitPrice)} FCFA</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  {rx.notes ? <p className="text-xs text-muted-foreground italic truncate">{rx.notes}</p> : <span />}
                  <p className="text-sm font-semibold text-foreground whitespace-nowrap">Total {formatFcfaDot(total)} FCFA</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
};

export default Prescriptions;
