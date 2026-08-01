import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { toast } from "sonner";

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string;
  sex: string;
  dob: string;
  blood_group: string;
  allergies: string;
  last_visit: string | null;
}

export const usePatients = () => {
  const { user } = useAuth();
  const { activeClinicId } = useClinic();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPatients = async () => {
    if (!user || !activeClinicId) { setPatients([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from("patients")
      .select("id, name, phone, email, sex, dob, blood_group, allergies, last_visit")
      .eq("clinic_id", activeClinicId)
      .order("created_at", { ascending: false });
    if (error) { console.error(error); toast.error("Erreur chargement patients"); }
    else setPatients(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchPatients(); }, [user, activeClinicId]);

  const addPatient = async (form: Omit<Patient, "id" | "last_visit">) => {
    if (!user || !activeClinicId) return;
    const { data, error } = await supabase
      .from("patients")
      .insert({ ...form, user_id: user.id, clinic_id: activeClinicId, last_visit: new Date().toISOString().split("T")[0] })
      .select()
      .single();
    if (error) { toast.error("Erreur ajout patient"); return; }
    setPatients((prev) => [data, ...prev]);
    toast.success(`Patient "${form.name}" ajouté avec succès`);
  };

  const updatePatient = async (id: string, form: Omit<Patient, "id" | "last_visit">) => {
    const { error } = await supabase.from("patients").update(form).eq("id", id);
    if (error) { toast.error("Erreur modification"); return; }
    setPatients((prev) => prev.map((p) => p.id === id ? { ...p, ...form } : p));
    toast.success(`Patient "${form.name}" modifié`);
  };

  const deletePatient = async (id: string, name: string) => {
    const { error } = await supabase.from("patients").delete().eq("id", id);
    if (error) { toast.error("Erreur suppression"); return; }
    setPatients((prev) => prev.filter((p) => p.id !== id));
    toast.success(`Patient "${name}" supprimé`);
  };

  return { patients, loading, addPatient, updatePatient, deletePatient, refetch: fetchPatients };
};
