import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { toast } from "sonner";

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  email: string;
  status: string;
}

export const useDoctors = () => {
  const { user } = useAuth();
  const { activeClinicId } = useClinic();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDoctors = async () => {
    if (!user || !activeClinicId) { setDoctors([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from("doctors")
      .select("id, name, specialty, phone, email, status")
      .eq("clinic_id", activeClinicId)
      .order("name");
    if (error) { console.error(error); toast.error("Erreur chargement médecins"); }
    else setDoctors(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchDoctors(); }, [user, activeClinicId]);

  const addDoctor = async (form: Omit<Doctor, "id" | "status"> & { status?: string }) => {
    if (!user || !activeClinicId) return;
    const { data, error } = await supabase
      .from("doctors")
      .insert({ ...form, user_id: user.id, clinic_id: activeClinicId, status: form.status || "active" })
      .select().single();
    if (error) { toast.error("Erreur ajout médecin"); return; }
    setDoctors((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    toast.success(`Médecin "${form.name}" ajouté`);
  };

  const updateDoctor = async (id: string, form: Partial<Doctor>) => {
    const { error } = await supabase.from("doctors").update(form).eq("id", id);
    if (error) { toast.error("Erreur modification"); return; }
    setDoctors((prev) => prev.map((d) => d.id === id ? { ...d, ...form } : d));
    toast.success("Médecin modifié");
  };

  const deleteDoctor = async (id: string) => {
    const { error } = await supabase.from("doctors").delete().eq("id", id);
    if (error) { toast.error("Erreur suppression"); return; }
    setDoctors((prev) => prev.filter((d) => d.id !== id));
    toast.success("Médecin supprimé");
  };

  return { doctors, loading, addDoctor, updateDoctor, deleteDoctor, refetch: fetchDoctors };
};
