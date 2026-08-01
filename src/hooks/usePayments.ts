import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { toast } from "sonner";

export interface Payment {
  id: string;
  patient_name: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  date: string;
  description: string;
}

export const usePayments = () => {
  const { user } = useAuth();
  const { activeClinicId } = useClinic();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    if (!user || !activeClinicId) { setPayments([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from("payments")
      .select("id, patient_name, amount, currency, method, status, date, description")
      .eq("clinic_id", activeClinicId)
      .order("created_at", { ascending: false });
    if (error) { console.error(error); toast.error("Erreur chargement paiements"); }
    else setPayments(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchPayments(); }, [user, activeClinicId]);

  const addPayment = async (form: { patient_name: string; amount: number; method: string; description: string }) => {
    if (!user || !activeClinicId) return;
    const { data, error } = await supabase
      .from("payments")
      .insert({ ...form, user_id: user.id, clinic_id: activeClinicId, currency: "FCFA", status: "paid", date: new Date().toISOString().split("T")[0] })
      .select()
      .single();
    if (error) { toast.error("Erreur ajout paiement"); return; }
    setPayments((prev) => [data, ...prev]);
    toast.success(`Paiement de ${form.amount.toLocaleString()} FCFA enregistré`);
  };

  const updatePayment = async (id: string, form: { patient_name: string; amount: number; method: string; description: string }) => {
    const { error } = await supabase.from("payments").update(form).eq("id", id);
    if (error) { toast.error("Erreur modification"); return; }
    setPayments((prev) => prev.map((p) => p.id === id ? { ...p, ...form } : p));
    toast.success("Paiement modifié");
  };

  const deletePayment = async (id: string) => {
    const { error } = await supabase.from("payments").delete().eq("id", id);
    if (error) { toast.error("Erreur suppression"); return; }
    setPayments((prev) => prev.filter((p) => p.id !== id));
    toast.success("Paiement supprimé");
  };

  return { payments, loading, addPayment, updatePayment, deletePayment, refetch: fetchPayments };
};
