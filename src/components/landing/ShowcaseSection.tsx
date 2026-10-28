import { motion } from "framer-motion";
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

interface ShowcaseItem {
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

const showcaseItems: ShowcaseItem[] = [
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
      "Accès sécurisé pour chaque spécialité médicale",
    ],
    metrics: { label: "Temps gagné par consultation", value: "-12 min" },
  },
  {
    id: "telemedicine",
    label: "Télémédecine",
    icon: Video,
    badge: "Téléconsultation HD chiffrée",
    title: "Consultez vos patients partout, sans contrainte géographique",
    subtitle: "Vidéo haute définition, salle d'attente virtuelle et partage sécurisé.",
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
    subtitle: "Aide au diagnostic différentiel, alertes et synthèse clinique instantanée.",
    description:
      "Notre modèle d'IA entraîné sur les référentiels de santé analyse en temps réel les symptômes décrits, signale les interactions médicamenteuses potentielles et génère une synthèse claire du dossier pour accélérer vos prises de décision.",
    image: medicalAiImg,
    features: [
      "Alerte automatique en cas d'incompatibilité de prescriptions",
      "Aide au diagnostic différentiel basé sur les recommandations OMS",
      "Transcription vocale des comptes-rendus de consultation",
      "Confidentialité absolue : données souveraines et chiffrées",
    ],
    metrics: { label: "Réduction des erreurs de prescription", value: "99.4%" },
  },
  {
    id: "payments",
    label: "Paiements & Caisse",
    icon: Smartphone,
    badge: "Mobile Money & MoneyFusion",
    title: "Encaissements instantanés par Mobile Money et cartes bancaires",
    subtitle: "Orange Money, Wave, MTN, Moov, cartes Visa et facturation automatique.",
    description:
      "Fluidifiez le passage en caisse de votre établissement. Les patients règlent en quelques secondes via leur opérateur Mobile Money favori avec réconciliation bancaire et édition de factures normalisées.",
    image: receptionPaymentImg,
    features: [
      "Paiements directs Orange Money, Wave, MTN Moov et cartes",
      "Émission automatique de reçus et factures d'honoraires",
      "Clôture de caisse quotidienne en 1 clic sans écart de caisse",
      "Passerelle agréée et réconciliation temps réel",
    ],
    metrics: { label: "Zéro impayé sur les actes", value: "100%" },
  },
];

const ShowcaseSection = () => {
  return (
    <section id="showcase" className="py-16 sm:py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-12 sm:mb-16"
        >
          <Badge variant="outline" className="mb-3 px-3.5 py-1 text-primary border-primary/20 bg-primary/5">
            <Zap className="w-3.5 h-3.5 mr-1.5" /> Expérience Praticien & Patient
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground tracking-tight mb-4">
            Une suite clinique conçue pour l'excellence
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Découvrez comment Gesclic digitalise chaque étape du parcours de soin, de l'accueil du patient à la téléconsultation jusqu'à la facturation.
          </p>
        </motion.div>

        {/* Unpacked Modules Grid: all 4 modules clearly and openly displayed */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {showcaseItems.map((item, i) => {
            const ItemIcon = item.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.1, duration: 0.55 }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="bg-card rounded-3xl border border-border shadow-card hover:shadow-elevated hover:border-primary/40 transition-all duration-300 flex flex-col justify-between overflow-hidden group"
              >
                {/* Visual Preview Banner */}
                <div className="relative h-56 sm:h-64 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />

                  {/* Top category label & icon */}
                  <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-md">
                    <ItemIcon className="w-3.5 h-3.5 text-sky-300" strokeWidth={2} />
                    <span>{item.badge}</span>
                  </div>

                  {/* Metric chip */}
                  <div className="absolute bottom-3 right-4 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-lg border border-white/15 text-right shadow-md">
                    <span className="text-base font-bold text-sky-300 tabular-nums">{item.metrics.value}</span>
                    <span className="text-[10px] text-slate-300 block font-medium">{item.metrics.label}</span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 sm:p-7 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2 font-heading leading-tight group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-primary/90 mb-3">
                      {item.subtitle}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-5 font-medium">
                      {item.description}
                    </p>

                    {/* Features list with checkmarks */}
                    <div className="space-y-2.5 mb-6">
                      {item.features.map((feat) => (
                        <div key={feat} className="flex items-start gap-2 text-xs sm:text-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
                          <span className="text-foreground/90 font-medium">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Action footer */}
                  <div className="pt-4 border-t border-border/80 flex items-center justify-between">
                    <Button asChild size="sm" className="gradient-hero border-0 text-white shadow-sm hover:shadow-md transition-all font-bold">
                      <Link to="/register">
                        Découvrir ce module
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Link>
                    </Button>
                    <span className="text-xs text-muted-foreground font-semibold">Inclus dans l'essai 7j</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ShowcaseSection;
