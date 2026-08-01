import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Copy, Mail, Share2, UserPlus } from "lucide-react";
import { useInvitations, buildInvitationUrl, buildInvitationMailto, type ClinicInvitation } from "@/hooks/useInvitations";
import { useClinic, type AppRole } from "@/contexts/ClinicContext";
import { toast } from "sonner";

const ROLES: { value: AppRole; label: string; description: string }[] = [
  { value: "admin", label: "Administrateur", description: "Accès complet, gestion des membres et facturation" },
  { value: "medecin", label: "Médecin", description: "Consultations, prescriptions, dossiers médicaux" },
  { value: "secretaire", label: "Secrétaire", description: "Rendez-vous, patients, paiements" },
  { value: "infirmier", label: "Infirmier(ère)", description: "Laboratoire, pharmacie, soins" },
];

interface Props {
  trigger?: React.ReactNode;
  onInvited?: () => void;
}

const InviteMemberDialog = ({ trigger, onInvited }: Props) => {
  const { activeClinic } = useClinic();
  const { createInvitation } = useInvitations();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("medecin");
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<ClinicInvitation | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setEmail("");
    setRole("medecin");
    setCreated(null);
    setCopied(false);
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) setTimeout(reset, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const invitation = await createInvitation(email, role);
    setSubmitting(false);
    if (invitation) {
      setCreated(invitation);
      onInvited?.();
    }
  };

  const invitationUrl = created ? buildInvitationUrl(created.token) : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(invitationUrl);
      setCopied(true);
      toast.success("Lien copié");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier");
    }
  };

  const handleShare = async () => {
    if (!navigator.share) {
      handleCopy();
      return;
    }
    try {
      await navigator.share({
        title: `Invitation à ${activeClinic?.name ?? "la clinique"}`,
        text: `Rejoignez ${activeClinic?.name ?? "notre clinique"} sur Gesclic`,
        url: invitationUrl,
      });
    } catch {
      // user cancelled — silent
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-2">
            <UserPlus className="w-4 h-4" />
            Inviter un membre
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        {!created ? (
          <>
            <DialogHeader>
              <DialogTitle>Inviter un membre</DialogTitle>
              <DialogDescription>
                L'invité recevra un lien pour rejoindre <strong>{activeClinic?.name ?? "votre clinique"}</strong> avec le rôle choisi. Le lien expire dans 7 jours.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="invite-email">Email *</Label>
                <Input
                  id="invite-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="collegue@example.com"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  L'utilisateur devra s'inscrire ou se connecter avec cet email exact.
                </p>
              </div>
              <div>
                <Label>Rôle *</Label>
                <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{r.label}</span>
                          <span className="text-xs text-muted-foreground">{r.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Création..." : "Créer l'invitation"}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Invitation créée ✓</DialogTitle>
              <DialogDescription>
                Partagez ce lien avec <strong>{created.email}</strong> pour qu'il/elle rejoigne la clinique.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input readOnly value={invitationUrl} className="font-mono text-xs" />
                <Button type="button" variant="outline" size="icon" onClick={handleCopy} aria-label="Copier">
                  {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline" className="gap-2">
                  <a href={buildInvitationMailto(created.email, activeClinic?.name ?? "Gesclic", invitationUrl)}>
                    <Mail className="w-4 h-4" /> Envoyer par email
                  </a>
                </Button>
                <Button type="button" variant="outline" className="gap-2" onClick={handleShare}>
                  <Share2 className="w-4 h-4" /> Partager
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Expire le {new Date(created.expires_at).toLocaleDateString("fr-FR")}.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={reset}>Nouvelle invitation</Button>
                <Button onClick={() => handleOpenChange(false)}>Terminé</Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InviteMemberDialog;