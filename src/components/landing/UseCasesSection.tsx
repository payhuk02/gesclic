import { motion } from "framer-motion";
import {
  Stethoscope,
  Building2,
  HeartPulse,
  FlaskConical,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const useCases = [
  {
    icon: Stethoscope,
    category: "Cabinets & Praticiens Spécialistes",
    desc: "Généralistes, pédiatres, gynécologues, cardiologues, dentistes et ophtalmologues.",
    benefits: [
      "Prise de rendez-vous en ligne avec rappels SMS et WhatsApp",
      "Dossier patient accessible en 1 clic sur mobile ou ordinateur",
      "Génération et signature d'ordonnances aux normes",
      "Encaissements Mobile Money sans terminal bancaire coûteux",
    ],
    highlight: "Idéal pour 1 à 5 praticiens",
    tagColor: "bg-primary/10 text-primary border-primary/20",
  },
  {
    icon: Building2,
    category: "Polycliniques & Cliniques Privées",
    desc: "Établissements pluridisciplinaires avec hospitalisation, chirurgie et urgences.",
    benefits: [
      "Gestion multi-spécialités avec droits d'accès étanches par service",
      "Coordination soignante : infirmiers, médecins de garde, secrétariat",
      "Multi-caisses avec réconciliation journalière automatisée",
      "Rapports financiers, taux d'occupation et statistiques en temps réel",
    ],
    highlight: "Équipes complètes & multi-sites",
    tagColor: "bg-accent/10 text-accent border-accent/20",
  },
  {
    icon: HeartPulse,
    category: "Centres de Santé & Dispensaires",
    desc: "Structures de soins de proximité et centres médico-sociaux.",
    benefits: [
      "Prise en charge rapide avec gestion simplifiée de file d'attente",
      "Mode hors-ligne PWA : continue de fonctionner sans connexion internet",
      "Tarification accessible et adaptée au contexte local",
      "Suivi épidémiologique et exports statistiques pour les tutelles",
    ],
    highlight: "Résilience réseau & flux rapides",
    tagColor: "bg-success/10 text-success border-success/20",
  },
  {
    icon: FlaskConical,
    category: "Laboratoires & Pharmacies Intégrées",
    desc: "Gestionnaires d'officines, d'analyses biomédicales et imagerie.",
    benefits: [
      "Gestion fine des stocks de médicaments avec alertes de péremption",
      "Saisie, validation et transmission instantanée des résultats d'analyses",
      "Liaison automatique entre l'ordonnance médicale et la dispensation",
      "Réduction des pertes et ruptures de stock critiques",
    ],
    highlight: "Gestion de stocks & résultats",
    tagColor: "bg-warning/10 text-warning border-warning/20",
  },
];

const UseCasesSection = () => {
  return (
    <section id="use-cases" className="py-16 sm:py-24 bg-muted/30 relative">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <Badge variant="outline" className="mb-3 px-3 py-1 text-primary border-primary/20 bg-primary/5">
            Solutions adaptées
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight mb-4">
            Une solution pensée pour chaque profil d'établissement
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Que vous exerciez en cabinet individuel ou que vous dirigiez un hôpital privé de 100 lits, Gesclic s'adapte à vos processus sans lourdeur d'installation.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {useCases.map((uc, i) => (
            <motion.div
              key={uc.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-card hover:shadow-elevated transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <uc.icon className="w-6 h-6" />
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${uc.tagColor}`}>
                    {uc.highlight}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                  {uc.category}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-5 leading-relaxed">
                  {uc.desc}
                </p>

                <div className="space-y-2.5 mb-6">
                  {uc.benefits.map((b) => (
                    <div key={b} className="flex items-start gap-2.5 text-xs sm:text-sm">
                      <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-foreground/90">{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <Button asChild variant="ghost" className="p-0 h-auto text-primary hover:text-primary/80 font-semibold text-xs sm:text-sm flex items-center gap-1.5 group">
                  <Link to="/register">
                    Découvrir l'offre adaptée
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
