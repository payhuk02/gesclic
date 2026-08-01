import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import {
  Users, Calendar, FileEdit, CreditCard, LayoutDashboard,
  FlaskConical, Pill, UserCog, Settings, BarChart3, Crown, FileText,
} from "lucide-react";
import { usePatients } from "@/hooks/usePatients";
import { useAppointments } from "@/hooks/useAppointments";
import { usePayments } from "@/hooks/usePayments";
import { useDoctors } from "@/hooks/useDoctors";
import { usePrescriptions } from "@/hooks/usePrescriptions";

interface SearchResult {
  id: string; label: string; description?: string; icon: typeof Users; path: string; category: string;
}

const pages: SearchResult[] = [
  { id: "nav-dashboard", label: "Tableau de bord", icon: LayoutDashboard, path: "/dashboard", category: "Pages" },
  { id: "nav-appointments", label: "Rendez-vous", icon: Calendar, path: "/appointments", category: "Pages" },
  { id: "nav-patients", label: "Patients", icon: Users, path: "/patients", category: "Pages" },
  { id: "nav-records", label: "Dossiers médicaux", icon: FileText, path: "/medical-records", category: "Pages" },
  { id: "nav-prescriptions", label: "Ordonnances", icon: FileEdit, path: "/prescriptions", category: "Pages" },
  { id: "nav-payments", label: "Paiements", icon: CreditCard, path: "/payments", category: "Pages" },
  { id: "nav-lab", label: "Laboratoire", icon: FlaskConical, path: "/laboratory", category: "Pages" },
  { id: "nav-pharmacy", label: "Pharmacie", icon: Pill, path: "/pharmacy", category: "Pages" },
  { id: "nav-reports", label: "Rapports", icon: BarChart3, path: "/reports", category: "Pages" },
  { id: "nav-staff", label: "Personnel", icon: UserCog, path: "/staff", category: "Pages" },
  { id: "nav-subscriptions", label: "Abonnements", icon: Crown, path: "/subscriptions", category: "Pages" },
  { id: "nav-settings", label: "Paramètres", icon: Settings, path: "/settings", category: "Pages" },
];

const GlobalSearch = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const navigate = useNavigate();
  const { patients } = usePatients();
  const { appointments } = useAppointments();
  const { payments } = usePayments();
  const { doctors } = useDoctors();
  const { prescriptions } = usePrescriptions();

  const dataResults = useMemo<SearchResult[]>(() => {
    const results: SearchResult[] = [];
    patients.forEach((p) => results.push({ id: p.id, label: p.name, description: `${p.phone} · ${p.blood_group}`, icon: Users, path: `/patients/${p.id}`, category: "Patients" }));
    doctors.forEach((d) => results.push({ id: d.id, label: d.name, description: d.specialty, icon: UserCog, path: "/staff", category: "Médecins" }));
    appointments.slice(0, 20).forEach((a) => results.push({ id: a.id, label: `${a.patient_name} — ${a.type}`, description: `${a.date} ${a.time} · ${a.doctor_name}`, icon: Calendar, path: "/appointments", category: "Rendez-vous" }));
    prescriptions.slice(0, 20).forEach((rx) => results.push({ id: rx.id, label: rx.patient_name, description: `${rx.medications.join(", ")} · ${rx.doctor_name}`, icon: FileEdit, path: "/prescriptions", category: "Ordonnances" }));
    payments.slice(0, 20).forEach((pay) => results.push({ id: pay.id, label: `${pay.patient_name} — ${pay.amount.toLocaleString()} FCFA`, description: `${pay.method} · ${pay.date}`, icon: CreditCard, path: "/payments", category: "Paiements" }));
    return results;
  }, [patients, doctors, appointments, prescriptions, payments]);

  const handleSelect = (path: string) => { onOpenChange(false); navigate(path); };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Rechercher patients, rendez-vous, pages..." />
      <CommandList>
        <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
        <CommandGroup heading="Pages">
          {pages.map((p) => (
            <CommandItem key={p.id} onSelect={() => handleSelect(p.path)} className="gap-3"><p.icon className="w-4 h-4 text-muted-foreground" /><span>{p.label}</span></CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        {["Patients", "Médecins", "Rendez-vous", "Ordonnances", "Paiements"].map((cat) => {
          const items = dataResults.filter((r) => r.category === cat);
          if (items.length === 0) return null;
          return (
            <CommandGroup key={cat} heading={cat}>
              {items.map((item) => (
                <CommandItem key={item.id} onSelect={() => handleSelect(item.path)} className="gap-3">
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                  <div className="flex flex-col"><span>{item.label}</span>{item.description && <span className="text-xs text-muted-foreground">{item.description}</span>}</div>
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
};

export default GlobalSearch;
