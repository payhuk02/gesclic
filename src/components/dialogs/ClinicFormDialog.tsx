import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface ClinicFormValues {
  id?: string;
  name: string;
  plan: string;
  status: string;
  email: string | null;
  country: string | null;
}

interface ClinicFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Clinique à modifier ; absent = création. */
  clinic?: ClinicFormValues | null;
  onSaved: () => void;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

const ClinicFormDialog = ({ open, onOpenChange, clinic, onSaved }: ClinicFormDialogProps) => {
  const isEdit = Boolean(clinic?.id);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    plan: "free",
    status: "active",
    email: "",
    country: "",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      name: clinic?.name ?? "",
      plan: clinic?.plan ?? "free",
      status: clinic?.status ?? "active",
      email: clinic?.email ?? "",
      country: clinic?.country ?? "",
    });
  }, [open, clinic]);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Le nom de la clinique est obligatoire");
      return;
    }
    setSaving(true);
    try {
      const settings = {
        email: form.email.trim() || null,
        country: form.country.trim() || null,
      };

      if (isEdit && clinic?.id) {
        const { data: existing } = await supabase
          .from("clinics")
          .select("settings")
          .eq("id", clinic.id)
          .maybeSingle();

        const { error } = await supabase
          .from("clinics")
          .update({
            name: form.name.trim(),
            plan: form.plan,
            status: form.status,
            settings: { ...((existing?.settings as object) ?? {}), ...settings },
          })
          .eq("id", clinic.id);
        if (error) throw error;
        toast.success("Clinique mise à jour");
      } else {
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth.user?.id;
        if (!userId) throw new Error("Session expirée");

        const { data: created, error } = await supabase
          .from("clinics")
          .insert({
            name: form.name.trim(),
            slug: `${slugify(form.name)}-${Math.random().toString(36).slice(2, 7)}`,
            plan: form.plan,
            status: form.status,
            created_by: userId,
            settings,
          })
          .select("id")
          .single();
        if (error) throw error;

        // Le créateur devient administrateur de la clinique
        const { error: memberError } = await supabase.from("clinic_members").insert({
          clinic_id: created.id,
          user_id: userId,
          role: "admin",
        });
        if (memberError) throw memberError;
        toast.success("Clinique créée");
      }

      onOpenChange(false);
      onSaved();
    } catch (error: any) {
      console.error("Clinic save error:", error);
      toast.error(error?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">{isEdit ? "Modifier la clinique" : "Nouvelle clinique"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 sm:space-y-4">
          <div>
            <Label htmlFor="clinic-name">Nom</Label>
            <Input
              id="clinic-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Clinique Saint-Jean"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="clinic-email">Email de contact</Label>
            <Input
              id="clinic-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="contact@clinique.com"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="clinic-country">Pays</Label>
            <Input
              id="clinic-country"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              placeholder="Côte d'Ivoire"
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Plan</Label>
              <Select value={form.plan} onValueChange={(v) => setForm({ ...form, plan: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Gratuit</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Entreprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Statut</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="suspended">Suspendu</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={saving} className="gradient-hero border-0">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClinicFormDialog;
