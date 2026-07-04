import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Heart,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic, type AppRole } from "@/contexts/ClinicContext";
import { useInvitations } from "@/hooks/useInvitations";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type StepId = "welcome" | "clinic" | "team" | "plan";

const STEPS: { id: StepId; label: string }[] = [
  { id: "welcome", label: "Bienvenue" },
  { id: "clinic", label: "Votre clinique" },
  { id: "team", label: "Votre équipe" },
  { id: "plan", label: "Choix du plan" },
];

const ROLES: { value: AppRole; label: string }[] = [
  { value: "admin", label: "Administrateur" },
  { value: "medecin", label: "Médecin" },
  { value: "secretaire", label: "Secrétaire" },
  { value: "infirmier", label: "Infirmier(ère)" },
];

interface Plan {
  id: string;
  name: string;
  price: string;
  priceSuffix: string;
  description: string;
  features: string[];
  highlight?: boolean;
  cta: "select" | "contact";
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Découverte",
    price: "0€",
    priceSuffix: "/mois",
    description: "Pour tester la plateforme sans engagement.",
    features: ["Jusqu'à 2 utilisateurs", "50 patients", "Rendez-vous et dossiers de base", "Support communautaire"],
    cta: "select",
  },
  {
    id: "pro",
    name: "Pro",
    price: "49€",
    priceSuffix: "/utilisateur/mois",
    description: "Pour les cliniques en croissance.",
    features: [
      "Utilisateurs et patients illimités",
      "Ordonnances, laboratoire, pharmacie",
      "Assistant IA médical",
      "Rapports et exports",
      "Support prioritaire",
    ],
    highlight: true,
    cta: "select",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Sur devis",
    priceSuffix: "",
    description: "Groupes hospitaliers, multi-sites, conformité renforcée.",
    features: ["Instance dédiée", "SSO/SAML, MFA obligatoire", "Audit RGPD/HDS", "SLA 99.9%", "CSM dédié"],
    cta: "contact",
  },
];

interface InviteDraft { id: string; email: string; role: AppRole }

const emailOk = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.trim());

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, profile, refetchProfile, loading: authLoading } = useAuth();
  const { activeClinic, activeClinicId, loading: clinicLoading, refetch: refetchClinics } = useClinic();
  const { createInvitation } = useInvitations();

  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [clinicName, setClinicName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [invites, setInvites] = useState<InviteDraft[]>([
    { id: crypto.randomUUID(), email: "", role: "medecin" },
  ]);
  const [selectedPlan, setSelectedPlan] = useState<string>("free");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeClinic) {
      setClinicName(activeClinic.name ?? "");
      setLogoUrl(activeClinic.logo_url ?? null);
      setSelectedPlan(activeClinic.plan ?? "free");
    }
  }, [activeClinic]);

  // Guard: if onboarding already done, bounce out
  useEffect(() => {
    if (!authLoading && profile?.onboarding_completed_at) {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, profile, navigate]);

  const step = STEPS[stepIndex];
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const firstName = profile?.first_name || user?.email?.split("@")[0] || "";

  const canNext = useMemo(() => {
    if (step.id === "clinic") return clinicName.trim().length >= 2;
    return true;
  }, [step, clinicName]);

  const goNext = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  const goPrev = () => setStepIndex((i) => Math.max(i - 1, 0));

  const handleLogoUpload = async (file: File) => {
    if (!activeClinicId) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Fichier image requis");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image max 2 Mo");
      return;
    }
    setUploadingLogo(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${activeClinicId}/logo-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("clinic-logos")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      console.error(upErr);
      toast.error("Erreur upload du logo");
      setUploadingLogo(false);
      return;
    }
    const { data: signed, error: signErr } = await supabase.storage
      .from("clinic-logos")
      .createSignedUrl(path, 60 * 60 * 24 * 365);
    if (signErr || !signed) {
      toast.error("Logo uploadé mais URL non générée");
      setUploadingLogo(false);
      return;
    }
    setLogoUrl(signed.signedUrl);
    setUploadingLogo(false);
    toast.success("Logo mis à jour");
  };

  const saveClinic = async () => {
    if (!activeClinicId) return true;
    const { error } = await supabase
      .from("clinics")
      .update({ name: clinicName.trim(), logo_url: logoUrl })
      .eq("id", activeClinicId);
    if (error) {
      toast.error("Erreur enregistrement clinique");
      return false;
    }
    return true;
  };

  const sendInvites = async () => {
    const valid = invites.filter((i) => emailOk(i.email));
    if (valid.length === 0) return { sent: 0, skipped: invites.length };
    let sent = 0;
    for (const inv of valid) {
      const res = await createInvitation(inv.email, inv.role);
      if (res) sent++;
    }
    return { sent, skipped: invites.length - valid.length };
  };

  const savePlan = async () => {
    if (!activeClinicId) return true;
    // Enterprise stays on current plan (contact sales)
    const planToSave = selectedPlan === "enterprise" ? activeClinic?.plan ?? "free" : selectedPlan;
    const { error } = await supabase.from("clinics").update({ plan: planToSave }).eq("id", activeClinicId);
    if (error) {
      toast.error("Erreur enregistrement du plan");
      return false;
    }
    return true;
  };

  const handlePrimary = async () => {
    setSaving(true);
    try {
      if (step.id === "clinic") {
        const ok = await saveClinic();
        if (!ok) return;
        await refetchClinics();
        goNext();
      } else if (step.id === "team") {
        const { sent, skipped } = await sendInvites();
        if (sent > 0) toast.success(`${sent} invitation${sent > 1 ? "s" : ""} envoyée${sent > 1 ? "s" : ""}`);
        if (skipped > 0 && sent === 0) toast.info("Étape passée — vous pourrez inviter plus tard.");
        goNext();
      } else if (step.id === "plan") {
        const ok = await savePlan();
        if (!ok) return;
        // mark onboarding done
        if (user) {
          const { error } = await supabase
            .from("profiles")
            .update({ onboarding_completed_at: new Date().toISOString() })
            .eq("user_id", user.id);
          if (error) {
            toast.error("Erreur finalisation onboarding");
            return;
          }
          await refetchProfile();
          await refetchClinics();
        }
        toast.success("Configuration terminée !");
        navigate("/dashboard", { replace: true });
      } else {
        goNext();
      }
    } finally {
      setSaving(false);
    }
  };

  const skipToEnd = async () => {
    if (!user) return;
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq("user_id", user.id);
    await refetchProfile();
    setSaving(false);
    navigate("/dashboard", { replace: true });
  };

  const initials = (clinicName || activeClinic?.name || "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (authLoading || clinicLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Heart className="w-5 h-5 text-primary fill-primary" />
            <span>Gesclic</span>
          </div>
          <button
            onClick={skipToEnd}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            disabled={saving}
          >
            Passer et explorer
          </button>
        </div>
        {/* Progress bar */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span className="font-medium text-foreground">
              Étape {stepIndex + 1} sur {STEPS.length} · {step.label}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="hidden sm:flex items-center justify-between mt-3">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold transition-colors",
                    i < stepIndex && "bg-primary text-primary-foreground",
                    i === stepIndex && "bg-primary/20 text-primary border-2 border-primary",
                    i > stepIndex && "bg-muted text-muted-foreground",
                  )}
                >
                  {i < stepIndex ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-xs",
                    i === stepIndex ? "text-foreground font-medium" : "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center p-4 sm:p-8">
        <div className="w-full max-w-2xl">
          <div className="bg-card border border-border rounded-2xl shadow-card p-6 sm:p-10">
            {step.id === "welcome" && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl gradient-hero mx-auto mb-5 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary-foreground" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-3">
                  Bienvenue{firstName && `, ${firstName}`} 👋
                </h1>
                <p className="text-muted-foreground max-w-md mx-auto mb-8">
                  Configurons ensemble votre clinique en moins de 2 minutes. Vous pourrez tout modifier plus tard depuis les paramètres.
                </p>
                <div className="grid sm:grid-cols-3 gap-3 mb-8 text-left">
                  {[
                    { icon: Building2, label: "Votre clinique", desc: "Nom et logo" },
                    { icon: UserPlus, label: "Votre équipe", desc: "Invitez vos collaborateurs" },
                    { icon: Sparkles, label: "Votre plan", desc: "Choisissez ce qui vous convient" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-border p-3">
                      <item.icon className="w-4 h-4 text-primary mb-2" />
                      <div className="font-medium text-sm">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step.id === "clinic" && (
              <div>
                <h1 className="text-2xl font-bold mb-2">Parlez-nous de votre clinique</h1>
                <p className="text-muted-foreground mb-6">
                  Ces informations apparaîtront dans le header, sur les ordonnances et sur les emails envoyés.
                </p>
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="clinic-name">Nom de la clinique *</Label>
                    <Input
                      id="clinic-name"
                      className="mt-1"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      placeholder="Ex: Clinique du Parc"
                      maxLength={80}
                    />
                  </div>
                  <div>
                    <Label>Logo (optionnel)</Label>
                    <div className="mt-2 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        {logoUrl ? (
                          <img src={logoUrl} alt="Logo clinique" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold text-muted-foreground">{initials}</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleLogoUpload(f);
                            e.target.value = "";
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingLogo}
                          className="gap-2"
                        >
                          {uploadingLogo ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ImageIcon className="w-4 h-4" />
                          )}
                          {logoUrl ? "Changer le logo" : "Ajouter un logo"}
                        </Button>
                        <p className="text-xs text-muted-foreground">PNG, JPG ou SVG · 2 Mo max</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step.id === "team" && (
              <div>
                <h1 className="text-2xl font-bold mb-2">Invitez votre équipe</h1>
                <p className="text-muted-foreground mb-6">
                  Ajoutez les emails de vos collaborateurs. Ils recevront un lien pour rejoindre votre clinique avec le rôle attribué. Vous pouvez ignorer cette étape et inviter plus tard.
                </p>
                <div className="space-y-3">
                  {invites.map((inv, i) => (
                    <div key={inv.id} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <Input
                          type="email"
                          placeholder="collegue@example.com"
                          value={inv.email}
                          onChange={(e) =>
                            setInvites((prev) =>
                              prev.map((p) => (p.id === inv.id ? { ...p, email: e.target.value } : p)),
                            )
                          }
                        />
                      </div>
                      <Select
                        value={inv.role}
                        onValueChange={(v) =>
                          setInvites((prev) =>
                            prev.map((p) => (p.id === inv.id ? { ...p, role: v as AppRole } : p)),
                          )
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setInvites((prev) => (prev.length === 1 ? prev : prev.filter((p) => p.id !== inv.id)))
                        }
                        disabled={invites.length === 1}
                        aria-label="Supprimer"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-3 gap-2"
                  onClick={() =>
                    setInvites((prev) => [...prev, { id: crypto.randomUUID(), email: "", role: "medecin" }])
                  }
                >
                  <UserPlus className="w-4 h-4" /> Ajouter un autre membre
                </Button>
              </div>
            )}

            {step.id === "plan" && (
              <div>
                <h1 className="text-2xl font-bold mb-2">Choisissez votre plan</h1>
                <p className="text-muted-foreground mb-6">
                  Vous pouvez changer de plan à tout moment depuis les paramètres. Aucun paiement n'est requis maintenant.
                </p>
                <div className="grid gap-3">
                  {PLANS.map((p) => {
                    const isSelected = selectedPlan === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPlan(p.id)}
                        className={cn(
                          "text-left rounded-xl border p-4 transition-all",
                          isSelected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-border hover:border-primary/50 hover:bg-secondary/50",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{p.name}</h3>
                            {p.highlight && (
                              <Badge className="bg-primary/10 text-primary border-0 text-[10px]">
                                Recommandé
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{p.price}</div>
                            {p.priceSuffix && (
                              <div className="text-xs text-muted-foreground">{p.priceSuffix}</div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{p.description}</p>
                        <ul className="space-y-1">
                          {p.features.map((f) => (
                            <li key={f} className="flex items-start gap-2 text-sm">
                              <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                        {p.cta === "contact" && isSelected && (
                          <a
                            href="mailto:sales@mediflow.app?subject=Demande%20plan%20Enterprise"
                            className="inline-flex mt-3 text-sm text-primary font-medium hover:underline"
                          >
                            Contacter l'équipe commerciale →
                          </a>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="ghost"
              onClick={goPrev}
              disabled={stepIndex === 0 || saving}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </Button>
            <div className="flex items-center gap-2">
              {step.id === "team" && (
                <Button variant="ghost" onClick={goNext} disabled={saving}>
                  Ignorer
                </Button>
              )}
              <Button onClick={handlePrimary} disabled={!canNext || saving} className="gap-2">
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : step.id === "plan" ? (
                  <>
                    Terminer <CheckCircle2 className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Continuer <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Onboarding;