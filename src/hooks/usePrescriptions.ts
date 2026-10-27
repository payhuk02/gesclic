import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { softDeleteRecord } from "@/lib/soft-delete";
import { parsePrescriptionMeds, type PrescriptionMedication } from "@/lib/prescription-meds";
import { toast } from "sonner";

export interface Prescription {
  id: string;
  patient_id: string | null;
  patient_name: string;
  doctor_name: string;
  date: string;
  medications: PrescriptionMedication[];
  notes: string;
  status: string;
}

interface DbPrescription {
  id: string;
  patient_id: string | null;
  patient_name: string;
  doctor_name: string;
  date: string;
  medications: string;
  notes: string;
  status: string;
}

type PrescriptionInput = {
  patient_id?: string | null;
  patient_name: string;
  doctor_name: string;
  medications: PrescriptionMedication[];
  notes?: string;
  status?: string;
};

const toApp = (p: DbPrescription): Prescription => ({
  ...p,
  medications: parsePrescriptionMeds(p.medications),
});

export const usePrescriptions = () => {
  const { user } = useAuth();
  const { activeClinicId } = useClinic();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrescriptions = async () => {
    if (!user || !activeClinicId) { setPrescriptions([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from("prescriptions")
      .select("id, patient_id, patient_name, doctor_name, date, medications, notes, status")
      .eq("clinic_id", activeClinicId)
      .is("deleted_at", null)
      .order("date", { ascending: false });
    if (error) { console.error(error); toast.error("Erreur chargement ordonnances"); }
    else setPrescriptions((data as DbPrescription[] || []).map(toApp));
    setLoading(false);
  };

  useEffect(() => { fetchPrescriptions(); }, [user, activeClinicId]);

  const addPrescription = async (form: PrescriptionInput) => {
    if (!user || !activeClinicId) return;
    const { data, error } = await supabase
      .from("prescriptions")
      .insert({
        user_id: user.id,
        clinic_id: activeClinicId,
        patient_id: form.patient_id || null,
        patient_name: form.patient_name,
        doctor_name: form.doctor_name,
        medications: JSON.stringify(form.medications),
        notes: form.notes || "",
        date: new Date().toISOString().split("T")[0],
        status: form.status || "active",
      })
      .select().single();
    if (error) { toast.error("Erreur création ordonnance"); return; }
    setPrescriptions((prev) => [toApp(data as DbPrescription), ...prev]);
    toast.success(`Ordonnance créée pour ${form.patient_name}`);
  };

  const updatePrescription = async (id: string, form: PrescriptionInput) => {
    const { error } = await supabase.from("prescriptions").update({
      patient_id: form.patient_id || null,
      patient_name: form.patient_name,
      doctor_name: form.doctor_name,
      medications: JSON.stringify(form.medications),
      notes: form.notes || "",
      ...(form.status ? { status: form.status } : {}),
    }).eq("id", id);
    if (error) { toast.error("Erreur modification"); return; }
    setPrescriptions((prev) => prev.map((rx) => rx.id === id ? {
      ...rx,
      ...form,
      notes: form.notes || "",
      status: form.status || rx.status,
    } : rx));
    toast.success("Ordonnance modifiée");
  };

  const setPrescriptionStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("prescriptions").update({ status }).eq("id", id);
    if (error) { toast.error("Erreur statut"); return; }
    setPrescriptions((prev) => prev.map((rx) => rx.id === id ? { ...rx, status } : rx));
  };

  const deletePrescription = async (id: string) => {
    const { error } = await softDeleteRecord("prescriptions", id);
    if (error) { toast.error("Erreur suppression"); return; }
    setPrescriptions((prev) => prev.filter((rx) => rx.id !== id));
    toast.success("Ordonnance supprimée");
  };

  return { prescriptions, loading, addPrescription, updatePrescription, setPrescriptionStatus, deletePrescription, refetch: fetchPrescriptions };
};
