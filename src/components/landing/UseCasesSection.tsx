import { motion } from "framer-motion";
import {
  Stethoscope,
  Building2,
  HeartPulse,
  FlaskConical,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
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
    tagColor: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
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
    tagColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
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
    tagColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
];

const UseCasesSection = () => {
  return (
    <section id="use-cases" className="py-16 sm:py-24 bg-muted/30 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-12 sm:mb-16"
        >
          <Badge variant="outline" className="mb-3 px-3.5 py-1 text-primary border-primary/20 bg-primary/5">
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Solutions adaptées
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground tracking-tight mb-4">
            Une solution pensée pour chaque profil d'établissement
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Que vous exerciez en cabinet individuel ou que vous dirigiez un hôpital privé de 100 lits, Gesclic s'adapte à vos processus sans lourdeur d'installation.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {useCases.map((uc, i) => (
            <motion.div
              key={uc.category}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.55 }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className="bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-card hover:shadow-elevated hover:border-primary/40 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="text-primary group-hover:scale-110 transition-transform duration-300">
                    <uc.icon className="w-8 h-8 text-primary" strokeWidth={1.75} />
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${uc.tagColor}`}>
                    {uc.highlight}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2.5 font-heading">
                  {uc.category}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-6 leading-relaxed font-medium">
                  {uc.desc}
                </p>

                <div className="space-y-3 mb-6">
                  {uc.benefits.map((b) => (
                    <div key={b} className="flex items-start gap-2.5 text-xs sm:text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
                      <span className="text-foreground/90 font-medium">{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border/80">
                <Button asChild variant="ghost" className="p-0 h-auto text-primary hover:text-primary/80 font-bold text-xs sm:text-sm flex items-center gap-1.5 group/btn">
                  <Link to="/register">
                    Découvrir l'offre adaptée
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1.5 transition-transform" />
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
