import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { useClinic } from "@/contexts/ClinicContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const roleLabels: Record<string, string> = {
  admin: "Administrateur",
  medecin: "Médecin",
  secretaire: "Secrétaire",
  infirmier: "Infirmier",
};

const ClinicSwitcher = () => {
  const { memberships, activeClinicId, activeClinic, activeRole, setActiveClinicId, loading } = useClinic();

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-secondary/50 text-sm text-muted-foreground">
        <Building2 className="w-4 h-4" />
        <span className="hidden sm:inline">Chargement...</span>
      </div>
    );
  }

  if (!activeClinic) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        <Building2 className="w-4 h-4" />
        <span className="hidden sm:inline">Aucune clinique</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-secondary/50 hover:bg-secondary transition-colors text-sm">
          {activeClinic.logo_url ? (
            <img src={activeClinic.logo_url} alt="" className="w-5 h-5 rounded object-cover" />
          ) : (
            <Building2 className="w-4 h-4 text-primary" />
          )}
          <span className="hidden sm:inline font-medium max-w-[160px] truncate">{activeClinic.name}</span>
          {activeRole && (
            <Badge variant="outline" className="hidden md:inline-flex text-[10px] px-1.5 py-0">
              {roleLabels[activeRole] ?? activeRole}
            </Badge>
          )}
          <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Vos cliniques ({memberships.length})
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {memberships.map((m) => (
          <DropdownMenuItem
            key={m.clinic_id}
            onClick={() => setActiveClinicId(m.clinic_id)}
            className="flex items-start gap-3 py-2 cursor-pointer"
          >
            {m.clinic.logo_url ? (
              <img src={m.clinic.logo_url} alt="" className="w-5 h-5 mt-0.5 rounded object-cover shrink-0" />
            ) : (
              <Building2 className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{m.clinic.name}</div>
              <div className="text-xs text-muted-foreground">
                {roleLabels[m.role] ?? m.role} · Plan {m.clinic.plan}
              </div>
            </div>
            {m.clinic_id === activeClinicId && <Check className="w-4 h-4 text-primary shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ClinicSwitcher;
