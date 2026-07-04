import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { toast } from "sonner";

export type LabStatus = "pending" | "in_progress" | "completed" | "validated";

export interface LabResult {
  id: string;
  patient_name: string;
  analysis_type: string;
  date: string;
  result: string;
  status: LabStatus;
}

export const useLabResults = () => {
  const { user } = useAuth();
  const { activeClinicId } = useClinic();
  const [results, setResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResults = async () => {
    if (!user || !activeClinicId) { setResults([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from("lab_results")
      .select("id, patient_name, analysis_type, date, result, status")
      .eq("clinic_id", activeClinicId)
      .order("date", { ascending: false });
    if (error) { console.error(error); toast.error("Erreur chargement analyses"); }
    else setResults((data || []) as LabResult[]);
    setLoading(false);
  };

  useEffect(() => { fetchResults(); }, [user, activeClinicId]);

  const addResult = async (form: Omit<LabResult, "id" | "status"> & { status?: LabStatus }) => {
    if (!user || !activeClinicId) return;
    const { data, error } = await supabase.from("lab_results").insert({ ...form, user_id: user.id, clinic_id: activeClinicId, status: form.status || "pending" }).select().single();
    if (error) { toast.error("Erreur création analyse"); return; }
    setResults((prev) => [data as LabResult, ...prev]);
    toast.success(`Analyse créée pour ${form.patient_name}`);
  };

  const updateResult = async (id: string, form: Partial<LabResult>) => {
    const { error } = await supabase.from("lab_results").update(form).eq("id", id);
    if (error) { toast.error("Erreur modification"); return; }
    setResults((prev) => prev.map((r) => r.id === id ? { ...r, ...form } : r));
    toast.success("Analyse modifiée");
  };

  const deleteResult = async (id: string) => {
    const { error } = await supabase.from("lab_results").delete().eq("id", id);
    if (error) { toast.error("Erreur suppression"); return; }
    setResults((prev) => prev.filter((r) => r.id !== id));
    toast.success("Analyse supprimée");
  };

  return { results, loading, addResult, updateResult, deleteResult, refetch: fetchResults };
};
