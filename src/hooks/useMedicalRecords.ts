import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { toast } from "sonner";

export interface MedicalRecord {
  id: string;
  patient_name: string;
  date: string;
  diagnosis: string;
  treatment: string;
  notes: string;
}

export const useMedicalRecords = () => {
  const { user } = useAuth();
  const { activeClinicId } = useClinic();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    if (!user || !activeClinicId) { setRecords([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from("medical_records")
      .select("id, patient_name, date, diagnosis, treatment, notes")
      .eq("clinic_id", activeClinicId)
      .order("date", { ascending: false });
    if (error) { console.error(error); toast.error("Erreur chargement dossiers"); }
    else setRecords(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchRecords(); }, [user, activeClinicId]);

  const addRecord = async (form: Omit<MedicalRecord, "id">) => {
    if (!user || !activeClinicId) return;
    const { data, error } = await supabase.from("medical_records").insert({ ...form, user_id: user.id, clinic_id: activeClinicId }).select().single();
    if (error) { toast.error("Erreur création dossier"); return; }
    setRecords((prev) => [data, ...prev]);
    toast.success(`Dossier créé pour ${form.patient_name}`);
  };

  const updateRecord = async (id: string, form: Partial<MedicalRecord>) => {
    const { error } = await supabase.from("medical_records").update(form).eq("id", id);
    if (error) { toast.error("Erreur modification"); return; }
    setRecords((prev) => prev.map((r) => r.id === id ? { ...r, ...form } : r));
    toast.success("Dossier modifié");
  };

  const deleteRecord = async (id: string) => {
    const { error } = await supabase.from("medical_records").delete().eq("id", id);
    if (error) { toast.error("Erreur suppression"); return; }
    setRecords((prev) => prev.filter((r) => r.id !== id));
    toast.success("Dossier supprimé");
  };

  return { records, loading, addRecord, updateRecord, deleteRecord, refetch: fetchRecords };
};
