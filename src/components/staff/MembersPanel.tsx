import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Mail, MoreVertical, RotateCcw, Shield, UserMinus, UserPlus, Users } from "lucide-react";
import { useInvitations, buildInvitationUrl, buildInvitationMailto } from "@/hooks/useInvitations";
import { useClinicMembers } from "@/hooks/useClinicMembers";
import { useClinic, type AppRole } from "@/contexts/ClinicContext";
import { useAuth } from "@/contexts/AuthContext";
import InviteMemberDialog from "@/components/dialogs/InviteMemberDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrateur",
  medecin: "Médecin",
  secretaire: "Secrétaire",
  infirmier: "Infirmier(ère)",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  accepted: "bg-success/10 text-success border-success/20",
  revoked: "bg-muted text-muted-foreground",
  expired: "bg-destructive/10 text-destructive border-destructive/20",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  accepted: "Accepté",
  revoked: "Révoqué",
  expired: "Expiré",
};

const MembersPanel = () => {
  const { user } = useAuth();
  const { activeRole, activeClinic } = useClinic();
  const { members, loading: loadingMembers, updateRole, deactivateMember, reactivateMember } = useClinicMembers();
  const { invitations, loading: loadingInvites, revokeInvitation } = useInvitations();
  const [tab, setTab] = useState<"members" | "invitations">("members");

  const isAdmin = activeRole === "admin";
  const pendingCount = useMemo(
    () => invitations.filter((i) => i.status === "pending" && new Date(i.expires_at) > new Date()).length,
    [invitations],
  );

  const memberName = (m: (typeof members)[number]) => {
    const p = m.profile;
    if (!p) return "Utilisateur";
    const full = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
    return full || "Utilisateur";
  };

  const copyLink = async (token: string) => {
    try {
      await navigator.clipboard.writeText(buildInvitationUrl(token));
      toast.success("Lien copié");
    } catch {
      toast.error("Impossible de copier");
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-border">
        <div>
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Membres de la plateforme
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Utilisateurs pouvant se connecter à {activeClinic?.name ?? "cette clinique"}.
          </p>
        </div>
        {isAdmin && <InviteMemberDialog />}
      </div>

      <div className="flex border-b border-border">
        <button
          onClick={() => setTab("members")}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === "members" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Membres actifs ({members.filter((m) => m.is_active).length})
        </button>
        <button
          onClick={() => setTab("invitations")}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === "invitations" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Invitations {pendingCount > 0 && <Badge variant="outline" className="ml-1.5">{pendingCount}</Badge>}
        </button>
      </div>

      {tab === "members" ? (
        <div className="divide-y divide-border">
          {loadingMembers ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Chargement...</div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Aucun membre.</div>
          ) : (
            members.map((m) => {
              const isSelf = m.user_id === user?.id;
              const initials = memberName(m).split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
              return (
                <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-9 h-9 rounded-full gradient-hero flex items-center justify-center text-xs font-semibold text-primary-foreground">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{memberName(m)}</span>
                      {isSelf && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Vous</Badge>}
                      {!m.is_active && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">Désactivé</Badge>}
                    </div>
                  </div>
                  {isAdmin && !isSelf ? (
                    <Select value={m.role} onValueChange={(v) => updateRole(m.id, v as AppRole)}>
                      <SelectTrigger className="w-40 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(ROLE_LABELS) as AppRole[]).map((r) => (
                          <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <Shield className="w-3 h-3" />
                      {ROLE_LABELS[m.role]}
                    </Badge>
                  )}
                  {isAdmin && !isSelf && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {m.is_active ? (
                          <DropdownMenuItem onClick={() => deactivateMember(m.id)} className="text-destructive">
                            <UserMinus className="w-4 h-4 mr-2" /> Désactiver
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => reactivateMember(m.id)}>
                            <RotateCcw className="w-4 h-4 mr-2" /> Réactiver
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {loadingInvites ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Chargement...</div>
          ) : invitations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground mb-3">Aucune invitation.</p>
              {isAdmin && (
                <InviteMemberDialog
                  trigger={
                    <Button variant="outline" size="sm" className="gap-2">
                      <UserPlus className="w-4 h-4" /> Inviter un membre
                    </Button>
                  }
                />
              )}
            </div>
          ) : (
            invitations.map((i) => {
              const isExpired = i.status === "pending" && new Date(i.expires_at) < new Date();
              const status = isExpired ? "expired" : i.status;
              return (
                <div key={i.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{i.email}</div>
                    <div className="text-xs text-muted-foreground">
                      {ROLE_LABELS[i.role]} · Expire le {new Date(i.expires_at).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <Badge variant="outline" className={STATUS_STYLES[status] ?? ""}>
                    {STATUS_LABELS[status] ?? status}
                  </Badge>
                  {i.status === "pending" && !isExpired && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => copyLink(i.token)}>
                          <Copy className="w-4 h-4 mr-2" /> Copier le lien
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={buildInvitationMailto(i.email, activeClinic?.name ?? "Gesclic", buildInvitationUrl(i.token))}>
                            <Mail className="w-4 h-4 mr-2" /> Envoyer par email
                          </a>
                        </DropdownMenuItem>
                        {isAdmin && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => revokeInvitation(i.id)} className="text-destructive">
                              Révoquer
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default MembersPanel;