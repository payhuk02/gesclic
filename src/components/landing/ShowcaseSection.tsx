import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Video,
  Sparkles,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

import heroTeamImg from "@/assets/hero_medical_team.jpg";
import telemedicineImg from "@/assets/telemedicine_doctor.jpg";
import medicalAiImg from "@/assets/medical_ai_assistant.jpg";
import receptionPaymentImg from "@/assets/clinic_reception_payment.jpg";

interface ShowcaseTab {
  id: string;
  label: string;
  icon: React.ElementType;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  features: string[];
  metrics: { label: string; value: string };
}

const tabs: ShowcaseTab[] = [
  {
    id: "records",
    label: "Dossier Médical",
    icon: FileText,
    badge: "Dossier Médical Électronique (DME)",
    title: "Le dossier patient réinventé pour la pratique clinique africaine",
    subtitle: "Historique médical unifié, ordonnances PDF sécurisées et traçabilité totale.",
    description:
      "Accédez instantanément aux antécédents, constantes vitales, allergies, diagnostics antérieurs et comptes-rendus d'examens. Rédigez vos prescriptions en quelques clics et exportez-les avec signature électronique et QR code de vérification.",
    image: heroTeamImg,
    features: [
      "Timeline chronologique complète des consultations",
      "Éditeur d'ordonnances avec base de données médicamenteuse",
      "Export PDF certifié avec en-tête et logo de votre clinique",
      "Accès sécurisé pour chaque spécialité (générale, pédiatrie, cardio, gynéco...)",
    ],
    metrics: { label: "Temps gagné par consultation", value: "-12 min" },
  },
  {
    id: "telemedicine",
    label: "Télémédecine",
    icon: Video,
    badge: "Téléconsultation HD chiffrée",
    title: "Consultez vos patients partout, sans contrainte géographique",
    subtitle: "Vidéo haute définition, salle d'attente virtuelle et partage de documents sécurisé.",
    description:
      "Rapprochez la médecine des patients éloignés ou à mobilité réduite. Aucun téléchargement nécessaire pour le patient : un simple lien SMS ou WhatsApp lui permet de rejoindre la salle de consultation chiffrée.",
    image: telemedicineImg,
    features: [
      "Visioconférence fluide optimisée pour les réseaux mobiles africains",
      "Lien patient direct sans installation d'application",
      "Dossier patient accessible en écran partagé pendant l'appel",
      "Paiement préalable de la téléconsultation par Mobile Money",
    ],
    metrics: { label: "Patients distants désenclavés", value: "+40%" },
  },
  {
    id: "ai",
    label: "Gesclic AI",
    icon: Sparkles,
    badge: "Intelligence Artificielle Clinique",
    title: "L'assistance médicale de pointe au creux de votre main",
    subtitle: "Aide au diagnostic différentiel, alertes d'interactions et synthèse clinique instantanée.",
    description:
      "Notre modèle d'IA entraîné sur les référentiels de santé analyse en temps réel les symptômes décrits, signale les interactions médicamenteuses potentielles et génère une synthèse claire du dossier pour accélérer vos prises de décision.",
    image: medicalAiImg,
    features: [
      "Alerte automatique en cas d'incompatibilité de prescriptions",
      "Aide au diagnostic différentiel basé sur les recommandations OMS",
      "Transcription vocale des comptes-rendus de consultation",
      "Confidentialité absolue : vos données de santé ne servent pas à l'entraînement public",
    ],
    metrics: { label: "Réduction des erreurs de prescription", value: "99.4%" },
  },
  {
    id: "payments",
    label: "Paiements & Caisse",
    icon: Smartphone,
    badge: "Mobile Money & MoneyFusion",
    title: "Encaissements instantanés par Mobile Money et cartes bancaires",
    subtitle: "Orange Money, Wave, MTN, Moov, cartes Visa et facturation automatique intégrée.",
    description:
      "Fluidifiez le passage en caisse de votre établissement. Les patients règlent en quelques secondes via leur opérateur Mobile Money favori avec réconciliation bancaire et édition de factures normalisées.",
    image: receptionPaymentImg,
    features: [
      "Paiements directs Orange Money, Wave, MTN Moov et cartes",
      "Émission automatique de reçus et factures d'honoraires",
      "Clôture de caisse quotidienne en 1 clic sans écart de caisse",
      "Passerelle Moneyfusion.net agréée et sécurisée",
    ],
    metrics: { label: "Zéro impayé sur les actes", value: "100%" },
  },
];

const ShowcaseSection = () => {
  const [activeTab, setActiveTab] = useState<string>("records");

  const current = tabs.find((t) => t.id === activeTab) ?? tabs[0];
  const Icon = current.icon;

  return (
    <section id="showcase" className="py-16 sm:py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <Badge variant="outline" className="mb-3 px-3 py-1 text-primary border-primary/20 bg-primary/5">
            <Zap className="w-3.5 h-3.5 mr-1" /> Expérience Praticien & Patient
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground tracking-tight mb-4">
            Une suite clinique conçue pour l'excellence
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Découvrez comment Gesclic digitalise chaque étape du parcours de soin, de l'accueil du patient à la téléconsultation jusqu'à la facturation.
          </p>
        </div>

        {/* Tab selection buttons */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10 sm:mb-14 max-w-4xl mx-auto">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                    : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border"
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Interactive Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center bg-card rounded-3xl p-6 sm:p-8 lg:p-12 border border-border shadow-elevated"
          >
            {/* Left Column: Description & Highlights (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                <Icon className="w-3.5 h-3.5" />
                <span>{current.badge}</span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 leading-tight">
                  {current.title}
                </h3>
                <p className="text-sm sm:text-base font-medium text-muted-foreground mb-4">
                  {current.subtitle}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground/90 leading-relaxed">
                  {current.description}
                </p>
              </div>

              {/* Feature points */}
              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                {current.features.map((feat) => (
                  <div key={feat} className="flex items-start gap-2 text-xs sm:text-sm">
                    <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{feat}</span>
                  </div>
                ))}
              </div>

              {/* Key Metric & CTA */}
              <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                      {current.metrics.value}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {current.metrics.label}
                    </p>
                  </div>
                </div>

                <Button asChild className="gradient-hero border-0 text-white shadow-sm">
                  <Link to="/register">
                    Essayer ce module
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right Column: Visual Preview (5 cols) */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl group">
                <img
                  src={current.image}
                  alt={current.title}
                  className="w-full h-[320px] sm:h-[420px] object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                {/* Floating pill badge */}
                <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur-md rounded-xl p-3 border border-border/80 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
                    <span className="text-xs font-semibold text-foreground">
                      Module actif en temps réel
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    Gesclic v2.4
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default ShowcaseSection;
