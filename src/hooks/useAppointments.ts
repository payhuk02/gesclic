import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { toast } from "sonner";

export type AppointmentStatus = "confirmed" | "pending" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  patient_name: string;
  doctor_name: string;
  date: string;
  time: string;
  type: string;
  status: AppointmentStatus;
}

export const useAppointments = () => {
  const { user } = useAuth();
  const { activeClinicId } = useClinic();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    if (!user || !activeClinicId) { setAppointments([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from("appointments")
      .select("id, patient_name, doctor_name, date, time, type, status")
      .eq("clinic_id", activeClinicId)
      .order("date", { ascending: false });
    if (error) { console.error(error); toast.error("Erreur chargement rendez-vous"); }
    else setAppointments((data || []) as Appointment[]);
    setLoading(false);
  };

  useEffect(() => { fetchAppointments(); }, [user, activeClinicId]);

  const addAppointment = async (form: Omit<Appointment, "id" | "status">) => {
    if (!user || !activeClinicId) return;
    const { data, error } = await supabase
      .from("appointments")
      .insert({ ...form, user_id: user.id, clinic_id: activeClinicId, status: "pending" })
      .select()
      .single();
    if (error) { toast.error("Erreur création rendez-vous"); return; }
    setAppointments((prev) => [data as Appointment, ...prev]);
    toast.success(`Rendez-vous créé pour ${form.patient_name}`);
  };

  const updateAppointment = async (id: string, form: Partial<Appointment>) => {
    const { error } = await supabase.from("appointments").update(form).eq("id", id);
    if (error) { toast.error("Erreur modification"); return; }
    setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, ...form } : a));
    toast.success("Rendez-vous modifié");
  };

  const deleteAppointment = async (id: string) => {
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) { toast.error("Erreur suppression"); return; }
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    toast.success("Rendez-vous supprimé");
  };

  return { appointments, loading, addAppointment, updateAppointment, deleteAppointment, refetch: fetchAppointments };
};
