import AppLayout from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Pencil, Loader2 } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import AddPrescriptionDialog from "@/components/dialogs/AddPrescriptionDialog";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import type { PrescriptionForm } from "@/components/dialogs/AddPrescriptionDialog";
import { usePrescriptions } from "@/hooks/usePrescriptions";
import { usePatients } from "@/hooks/usePatients";
import { useDoctors } from "@/hooks/useDoctors";

const Prescriptions = () => {
  const { prescriptions, loading, addPrescription, updatePrescription, deletePrescription } = usePrescriptions();
  const { patients } = usePatients();
  const { doctors } = useDoctors();

  const handleAdd = (form: PrescriptionForm) => addPrescription({ patient_name: form.patientName, doctor_name: form.doctorName, medications: form.medications });
  const handleEdit = (id: string, form: PrescriptionForm) => updatePrescription(id, { patient_name: form.patientName, doctor_name: form.doctorName, medications: form.medications });

  return (
    <AppLayout title="Ordonnances">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">{prescriptions.length} ordonnance{prescriptions.length > 1 ? "s" : ""}</p>
        <AddPrescriptionDialog onAdd={handleAdd} patients={patients.map((p) => ({ id: p.id, name: p.name }))} doctors={doctors.map((d) => ({ id: d.id, name: d.name }))} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : prescriptions.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucune ordonnance émise"
          description="Créez une ordonnance pour un patient à partir d'une consultation. Elle sera immédiatement exportable en PDF."
          tips={[
            "Une ordonnance est liée à un patient et à un médecin de votre clinique.",
            "Ajoutez plusieurs médicaments — posologie et durée s'écrivent en texte libre.",
            "Statut « Active » tant qu'elle n'est pas marquée comme terminée.",
          ]}
          action={<AddPrescriptionDialog onAdd={handleAdd} patients={patients.map((p) => ({ id: p.id, name: p.name }))} doctors={doctors.map((d) => ({ id: d.id, name: d.name }))} />}
        />
      ) : (
        <div className="space-y-4">
          {prescriptions.map((rx) => (
            <div key={rx.id} className="bg-card rounded-xl p-5 shadow-card border border-border">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{rx.patient_name}</p>
                    <p className="text-sm text-muted-foreground">{rx.doctor_name} — {rx.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className={rx.status === "active" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}>
                    {rx.status === "active" ? "Active" : "Terminée"}
                  </Badge>
                  <AddPrescriptionDialog
                    editData={{ patientName: rx.patient_name, doctorName: rx.doctor_name, medications: rx.medications }}
                    onEdit={(form) => handleEdit(rx.id, form)}
                    patients={patients.map((p) => ({ id: p.id, name: p.name }))}
                    doctors={doctors.map((d) => ({ id: d.id, name: d.name }))}
                    trigger={
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    }
                  />
                  <DeleteConfirmDialog onConfirm={() => deletePrescription(rx.id)} />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {rx.medications.map((m) => (
                  <span key={m} className="text-xs bg-secondary px-3 py-1 rounded-full text-foreground">{m}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Prescriptions;
