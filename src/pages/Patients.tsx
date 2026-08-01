import AppLayout from "@/components/layout/AppLayout";
import { usePatients } from "@/hooks/usePatients";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Phone, Mail, Pencil, Loader2, Users, SearchX } from "lucide-react";
import ExportButtons from "@/components/ExportButtons";
import { useState } from "react";
import { Link } from "react-router-dom";
import AddPatientDialog from "@/components/dialogs/AddPatientDialog";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import type { PatientForm } from "@/components/dialogs/AddPatientDialog";
import EmptyState from "@/components/EmptyState";

const Patients = () => {
  const [search, setSearch] = useState("");
  const { patients, loading, addPatient, updatePatient, deletePatient } = usePatients();

  const filtered = patients.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search)
  );

  const handleAddPatient = (form: PatientForm) => {
    addPatient({ name: form.name, phone: form.phone, email: form.email, sex: form.sex, dob: form.dob, blood_group: form.bloodGroup, allergies: form.allergies });
  };

  const handleEditPatient = (id: string, form: PatientForm) => {
    updatePatient(id, { name: form.name, phone: form.phone, email: form.email, sex: form.sex, dob: form.dob, blood_group: form.bloodGroup, allergies: form.allergies });
  };

  return (
    <AppLayout title="Patients">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher un patient par nom ou téléphone..." className="pl-10 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <AddPatientDialog onAdd={handleAddPatient} />
        <ExportButtons
          data={filtered.map(p => ({ ...p, bloodGroup: p.blood_group })) as unknown as Record<string, unknown>[]}
          columns={[
            { header: "Nom", key: "name" },
            { header: "Téléphone", key: "phone" },
            { header: "Email", key: "email" },
            { header: "Sexe", key: "sex" },
            { header: "Groupe sanguin", key: "bloodGroup" },
          ]}
          title="Liste des patients"
          filename="patients"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 sm:py-20">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        search ? (
          <EmptyState
            icon={SearchX}
            title="Aucun patient ne correspond"
            description={`Aucun résultat pour « ${search} ». Essayez un autre nom ou numéro de téléphone.`}
          />
        ) : (
          <EmptyState
            icon={Users}
            title="Votre fichier patients est vide"
            description="Enregistrez votre premier patient pour commencer à prendre des rendez-vous, créer des dossiers médicaux et facturer."
            tips={[
              "Renseignez au minimum le nom et le téléphone — le reste est modifiable plus tard.",
              "Le groupe sanguin et les allergies s'affichent en alerte dans la fiche patient.",
              "Vos patients sont privés à votre clinique et chiffrés côté serveur.",
            ]}
            action={<AddPatientDialog onAdd={handleAddPatient} />}
          />
        )
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="bg-card rounded-xl p-3 sm:p-5 shadow-card border border-border hover:shadow-elevated transition-shadow relative group">
              <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <AddPatientDialog
                  editData={{ name: p.name, phone: p.phone, email: p.email, sex: p.sex, dob: p.dob, bloodGroup: p.blood_group, allergies: p.allergies }}
                  onEdit={(form) => handleEditPatient(p.id, form)}
                  trigger={
                    <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground">
                      <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </Button>
                  }
                />
                <DeleteConfirmDialog
                  title={`Supprimer ${p.name} ?`}
                  description="Le patient et ses données seront supprimés définitivement."
                  onConfirm={() => deletePatient(p.id, p.name)}
                />
              </div>
              <Link to={`/patients/${p.id}`}>
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full gradient-hero flex items-center justify-center text-xs sm:text-sm font-bold text-primary-foreground">
                    {p.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm sm:text-base truncate">{p.name}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{p.sex === "M" ? "Homme" : "Femme"} — {p.blood_group}</p>
                  </div>
                </div>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                    <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="truncate">{p.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                    <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="truncate">{p.email}</span>
                  </div>
                </div>
                <div className="mt-3 sm:mt-4 flex items-center justify-between text-[10px] sm:text-xs">
                  <span className="text-muted-foreground truncate">Allergies: {p.allergies}</span>
                  <span className="text-muted-foreground">{p.last_visit || "—"}</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Patients;
