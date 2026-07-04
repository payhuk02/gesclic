import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { toast } from "sonner";

export interface Prescription {
  id: string;
  patient_name: string;
  doctor_name: string;
  date: string;
  medications: string[];
  notes: string;
  status: string;
}

interface DbPrescription {
  id: string;
  patient_name: string;
  doctor_name: string;
  date: string;
  medications: string;
  notes: string;
  status: string;
}

const parseMeds = (raw: string): string[] => {
  if (!raw) return [];
  try { const v = JSON.parse(raw); return Array.isArray(v) ? v : [raw]; } catch { return raw.split(",").map((s) => s.trim()).filter(Boolean); }
};

export const usePrescriptions = () => {
  const { user } = useAuth();
  const { activeClinicId } = useClinic();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrescriptions = async () => {
    if (!user || !activeClinicId) { setPrescriptions([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from("prescriptions")
      .select("id, patient_name, doctor_name, date, medications, notes, status")
      .eq("clinic_id", activeClinicId)
      .order("date", { ascending: false });
    if (error) { console.error(error); toast.error("Erreur chargement ordonnances"); }
    else setPrescriptions((data as DbPrescription[] || []).map((p) => ({ ...p, medications: parseMeds(p.medications) })));
    setLoading(false);
  };

  useEffect(() => { fetchPrescriptions(); }, [user, activeClinicId]);

  const addPrescription = async (form: { patient_name: string; doctor_name: string; medications: string[]; notes?: string }) => {
    if (!user || !activeClinicId) return;
    const { data, error } = await supabase
      .from("prescriptions")
      .insert({
        user_id: user.id,
        clinic_id: activeClinicId,
        patient_name: form.patient_name,
        doctor_name: form.doctor_name,
        medications: JSON.stringify(form.medications),
        notes: form.notes || "",
        date: new Date().toISOString().split("T")[0],
        status: "active",
      })
      .select().single();
    if (error) { toast.error("Erreur création ordonnance"); return; }
    const row = data as DbPrescription;
    setPrescriptions((prev) => [{ ...row, medications: parseMeds(row.medications) }, ...prev]);
    toast.success(`Ordonnance créée pour ${form.patient_name}`);
  };

  const updatePrescription = async (id: string, form: { patient_name: string; doctor_name: string; medications: string[]; notes?: string }) => {
    const { error } = await supabase.from("prescriptions").update({
      patient_name: form.patient_name, doctor_name: form.doctor_name, medications: JSON.stringify(form.medications), notes: form.notes || "",
    }).eq("id", id);
    if (error) { toast.error("Erreur modification"); return; }
    setPrescriptions((prev) => prev.map((rx) => rx.id === id ? { ...rx, ...form, notes: form.notes || "" } : rx));
    toast.success("Ordonnance modifiée");
  };

  const deletePrescription = async (id: string) => {
    const { error } = await supabase.from("prescriptions").delete().eq("id", id);
    if (error) { toast.error("Erreur suppression"); return; }
    setPrescriptions((prev) => prev.filter((rx) => rx.id !== id));
    toast.success("Ordonnance supprimée");
  };

  return { prescriptions, loading, addPrescription, updatePrescription, deletePrescription, refetch: fetchPrescriptions };
};
