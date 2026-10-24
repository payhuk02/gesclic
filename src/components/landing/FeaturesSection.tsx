import { motion } from "framer-motion";
import {
  Calendar,
  Users,
  FileText,
  CreditCard,
  Bell,
  Video,
  FlaskConical,
  Pill,
  Building2,
  BarChart3,
  Shield,
  Smartphone,
  Layers,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FeatureItem {
  icon: React.ElementType;
  title: string;
  desc: string;
  category: string;
}

const features: FeatureItem[] = [
  {
    icon: FileText,
    title: "Dossiers médicaux électroniques",
    desc: "Timeline clinique unifiée, antécédents, constantes vitales et archivage sécurisé conforme.",
    category: "Clinique",
  },
  {
    icon: Calendar,
    title: "Agendas & Rendez-vous intelligents",
    desc: "Planification multi-praticiens, gestion des disponibilités et synchronisation temps réel.",
    category: "Organisation",
  },
  {
    icon: Video,
    title: "Télémédecine HD intégrée",
    desc: "Consultations vidéo sécurisées en un clic avec partage d'ordonnances et de documents.",
    category: "Clinique",
  },
  {
    icon: CreditCard,
    title: "Encaissements & Mobile Money",
    desc: "Intégration directe Wave, Orange Money, MTN, Moov et cartes bancaires avec reçus instantanés.",
    category: "Finance",
  },
  {
    icon: Bell,
    title: "Rappels SMS & WhatsApp automatisés",
    desc: "Réduction prouvée de 60% du taux de non-présentation grâce aux relances multicanales.",
    category: "Organisation",
  },
  {
    icon: Users,
    title: "Gestion Patients 360°",
    desc: "Fiches complètes, personnes de confiance, allergies et historique des passages en clinique.",
    category: "Organisation",
  },
  {
    icon: Pill,
    title: "Pharmacie & Traçabilité des stocks",
    desc: "Gestion fine des dispensations, alertes péremption et liaison directe avec l'ordonnance.",
    category: "Logistique",
  },
  {
    icon: FlaskConical,
    title: "Laboratoire & Analyses biomédicales",
    desc: "Saisie, validation médicale par le biologiste et transmission sécurisée des résultats.",
    category: "Clinique",
  },
  {
    icon: BarChart3,
    title: "Business Intelligence & Rapports",
    desc: "Tableaux de bord analytiques de revenus, taux d'occupation et métriques de fréquentation.",
    category: "Finance",
  },
  {
    icon: Building2,
    title: "Architecture Multi-Clinique",
    desc: "Gestion multi-sites avec cloisonnement strict des données et administration centralisée.",
    category: "Infrastructure",
  },
  {
    icon: Shield,
    title: "Sécurité & Chiffrement AES-256",
    desc: "Protection bancaire des données de santé, contrôle d'accès granulaire RBAC et double facteur.",
    category: "Infrastructure",
  },
  {
    icon: Smartphone,
    title: "Résilience Hors-Ligne & PWA",
    desc: "Application progressive fonctionnant même sans connexion avec resynchronisation automatique.",
    category: "Infrastructure",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-16 sm:py-24 bg-muted/30 border-y border-border/50 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-14 sm:mb-18"
        >
          <Badge variant="outline" className="mb-3 px-3 py-1 text-primary border-primary/20 bg-primary/5">
            <Layers className="w-3.5 h-3.5 mr-1.5" /> Écosystème Médical Complet
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4 tracking-tight">
            Une architecture modulaire conçue pour les standards hospitaliers
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Chaque module s'intègre nativement pour supprimer les silos d'information et optimiser le temps des équipes soignantes.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, duration: 0.4 }}
                className="bg-card rounded-2xl p-5 border border-border/80 hover:border-primary/40 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-300" strokeWidth={1.75} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground group-hover:text-primary transition-colors">
                      {feature.category}
                    </span>
                  </div>

                  <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base leading-snug group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
