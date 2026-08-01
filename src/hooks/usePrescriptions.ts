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

<<<<<<< HEAD
const parseMeds = (raw: unknown): string[] => {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.map(medToString).filter(Boolean);
  if (typeof raw === "object") return [medToString(raw)].filter(Boolean);
  const text = String(raw).trim();
  if (!text) return [];
  try {
    const v = JSON.parse(text);
    if (Array.isArray(v)) return v.map(medToString).filter(Boolean);
    if (v && typeof v === "object") return [medToString(v)].filter(Boolean);
    if (typeof v === "string") return splitMeds(v);
  } catch {
    /* pas du JSON : on retombe sur le découpage texte */
  }
  return splitMeds(text);
};

/** Découpe une liste écrite à la main : retours ligne, « ; », « , » ou puces. */
const splitMeds = (text: string): string[] =>
  text
    .split(/\r?\n|;|,|(?:^|\s)[-•*]\s+/g)
    .map((s) => s.trim().replace(/^[-•*]\s*/, ""))
    .filter(Boolean);

/** Normalise un médicament objet ({ name, dosage, frequency }) en texte lisible. */
const medToString = (m: unknown): string => {
  if (typeof m === "string") return m.trim();
  if (m && typeof m === "object") {
    const o = m as Record<string, unknown>;
    const parts = [o.name ?? o.nom ?? o.medication, o.dosage ?? o.dose, o.frequency ?? o.frequence, o.duration ?? o.duree]
      .filter((v) => typeof v === "string" && v.trim())
      .map((v) => (v as string).trim());
    if (parts.length) return parts.join(" — ");
  }
  return "";
=======
const parseMeds = (raw: string): string[] => {
  if (!raw) return [];
  try { const v = JSON.parse(raw); return Array.isArray(v) ? v : [raw]; } catch { return raw.split(",").map((s) => s.trim()).filter(Boolean); }
>>>>>>> 784c55442546a8380c5505831e1170f57cc29dfe
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
