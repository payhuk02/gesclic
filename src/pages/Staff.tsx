import AppLayout from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Star, Plus, Search, Phone, Mail, Stethoscope, Loader2, Pencil, UserPlus, SearchX } from "lucide-react";
import { useState } from "react";
import { useDoctors, type Doctor } from "@/hooks/useDoctors";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import MembersPanel from "@/components/staff/MembersPanel";
import EmptyState from "@/components/EmptyState";

interface DoctorForm { name: string; specialty: string; phone: string; email: string; status: string }
const empty: DoctorForm = { name: "", specialty: "Médecine générale", phone: "", email: "", status: "active" };

const DoctorDialog = ({ trigger, initial, onSubmit, title }: { trigger: React.ReactNode; initial?: Doctor; onSubmit: (f: DoctorForm) => void; title: string }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<DoctorForm>(initial || empty);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    onSubmit(form);
    setOpen(false);
    if (!initial) setForm(empty);
  };
  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v && initial) setForm(initial); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Nom complet *</Label><Input className="mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dr. Jean Dupont" /></div>
          <div><Label>Spécialité</Label><Input className="mt-1" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Téléphone</Label><Input className="mt-1" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Email</Label><Input className="mt-1" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button type="submit" className="gradient-hero border-0">Enregistrer</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Staff = () => {
  const [search, setSearch] = useState("");
  const { doctors, loading, addDoctor, updateDoctor, deleteDoctor } = useDoctors();

  const filtered = doctors.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));
  const getInitials = (name: string) => name.replace(/^Dr\.?\s*/i, "").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <AppLayout title="Personnel médical">
      <div className="mb-6">
        <MembersPanel />
      </div>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">Annuaire des médecins</h2>
        <p className="text-sm text-muted-foreground">Fiches des praticiens (indépendant des comptes utilisateurs).</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <DoctorDialog title="Nouveau médecin" onSubmit={(f) => addDoctor(f)} trigger={<Button className="gradient-hero border-0 gap-2"><Plus className="w-4 h-4" />Ajouter</Button>} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        search ? (
          <EmptyState icon={SearchX} title="Aucun médecin trouvé" description={`Aucun résultat pour « ${search} ».`} />
        ) : (
          <EmptyState
            icon={UserPlus}
            title="Aucun médecin dans l'annuaire"
            description="Les fiches médecins servent à assigner des rendez-vous, ordonnances et analyses. Elles sont indépendantes des comptes utilisateurs — invitez vos collaborateurs plus haut sur cette page pour leur donner un accès."
            tips={[
              "Le nom apparaît dans les menus déroulants (rendez-vous, ordonnances, analyses).",
              "La spécialité aide à filtrer et à générer les statistiques.",
              "Une fiche « Inactive » reste consultable mais n'apparaît plus dans les listes de sélection.",
            ]}
            action={<DoctorDialog title="Nouveau médecin" onSubmit={(f) => addDoctor(f)} trigger={<Button className="gradient-hero border-0 gap-2"><Plus className="w-4 h-4" />Ajouter un médecin</Button>} />}
          />
        )
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d) => (
            <div key={d.id} className="bg-card rounded-xl p-5 shadow-card border border-border">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full gradient-hero flex items-center justify-center text-lg font-bold text-primary-foreground">{getInitials(d.name)}</div>
                  <div>
                    <p className="font-semibold text-foreground">{d.name}</p>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Stethoscope className="w-3.5 h-3.5 text-primary" />
                      <span className="text-muted-foreground">{d.specialty}</span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className={d.status === "active" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}>
                  {d.status === "active" ? "Actif" : "Inactif"}
                </Badge>
              </div>
              <div className="space-y-2 text-sm mb-4">
                {d.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-3.5 h-3.5" />{d.phone}</div>}
                {d.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-3.5 h-3.5" />{d.email}</div>}
              </div>
              <div className="flex justify-end gap-1">
                <DoctorDialog title="Modifier" initial={d} onSubmit={(f) => updateDoctor(d.id, f)} trigger={<Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="w-3.5 h-3.5" /></Button>} />
                <DeleteConfirmDialog onConfirm={() => deleteDoctor(d.id)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Staff;
