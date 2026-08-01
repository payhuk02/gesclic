import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { toast } from "sonner";

export interface PharmacyItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  threshold: number;
}

export const usePharmacyStock = () => {
  const { user } = useAuth();
  const { activeClinicId } = useClinic();
  const [items, setItems] = useState<PharmacyItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    if (!user || !activeClinicId) { setItems([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from("pharmacy_stock")
      .select("id, name, category, quantity, price, threshold")
      .eq("clinic_id", activeClinicId)
      .order("name");
    if (error) { console.error(error); toast.error("Erreur chargement stock"); }
    else setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [user, activeClinicId]);

  const addItem = async (form: Omit<PharmacyItem, "id">) => {
    if (!user || !activeClinicId) return;
    const { data, error } = await supabase.from("pharmacy_stock").insert({ ...form, user_id: user.id, clinic_id: activeClinicId }).select().single();
    if (error) { toast.error("Erreur ajout produit"); return; }
    setItems((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    toast.success(`Produit "${form.name}" ajouté`);
  };

  const updateItem = async (id: string, form: Partial<PharmacyItem>) => {
    const { error } = await supabase.from("pharmacy_stock").update(form).eq("id", id);
    if (error) { toast.error("Erreur modification"); return; }
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...form } : i));
    toast.success("Produit modifié");
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from("pharmacy_stock").delete().eq("id", id);
    if (error) { toast.error("Erreur suppression"); return; }
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Produit supprimé");
  };

  return { items, loading, addItem, updateItem, deleteItem, refetch: fetchItems };
};
