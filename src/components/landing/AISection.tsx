import { motion } from "framer-motion";
import {
  Sparkles,
  Activity,
  AlertTriangle,
  FileCheck2,
  Lock,
  ArrowRight,
  BrainCircuit,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import medicalAiImg from "@/assets/medical_ai_assistant.jpg";

const aiCapabilities = [
  {
    icon: Activity,
    title: "Aide au diagnostic différentiel",
    desc: "Analyse en temps réel des symptômes et signes cliniques avec suggestions hiérarchisées basées sur les protocoles médicaux internationaux.",
  },
  {
    icon: AlertTriangle,
    title: "Détection des interactions médicamenteuses",
    desc: "Alerte instantanée en cas de contre-indications, d'allergies croisées ou de posologies inadaptées avant même l'impression de l'ordonnance.",
  },
  {
    icon: FileCheck2,
    title: "Synthèse clinique automatisée",
    desc: "Générez un résumé structuré du dossier patient en un clic pour vos comptes-rendus d'hospitalisation ou courriers de confrères.",
  },
  {
    icon: BrainCircuit,
    title: "Transcription vocale médicale",
    desc: "Dictez vos observations et diagnostics : le système transcrit et classe automatiquement les informations dans le dossier.",
  },
];

const AISection = () => {
  return (
    <section id="ai" className="py-16 sm:py-24 bg-gradient-to-b from-background via-primary/[0.03] to-background relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Image with floating AI HUD Badges (5 cols) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 relative order-2 lg:order-1"
          >
            <div className="relative rounded-3xl overflow-hidden border border-primary/20 shadow-elevated">
              <img
                src={medicalAiImg}
                alt="Médecin utilisant l'IA Gesclic"
                className="w-full h-[360px] sm:h-[460px] object-cover object-center"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />

              {/* Floating diagnostic badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="absolute top-4 left-4 bg-card/90 backdrop-blur-md rounded-2xl p-3 border border-primary/30 shadow-lg max-w-[240px]"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">Assistant Gesclic AI</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Constantes analysées : rythme sinusal régulier, aucun conflit médicamenteux détecté.
                </p>
              </motion.div>

              {/* Bottom security assurance */}
              <div className="absolute bottom-4 left-4 right-4 bg-card/95 backdrop-blur-md rounded-xl p-3 border border-border flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-success flex-shrink-0" />
                <span className="text-xs text-foreground font-medium">
                  Données médicales chiffrées & modèle IA souverain
                </span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Content & Capabilities (7 cols) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-6 order-1 lg:order-2"
          >
            <Badge variant="outline" className="px-3.5 py-1 text-primary border-primary/30 bg-primary/10">
              <BrainCircuit className="w-3.5 h-3.5 mr-1.5" /> Intelligence Artificielle Médicale
            </Badge>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground tracking-tight leading-tight">
              L'IA au service de votre jugement clinique, pas à sa place
            </h2>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Gesclic intègre un copilote médical conçu spécifiquement pour assister les médecins, infirmiers et pharmaciens dans leur pratique quotidienne. Gagnez un temps précieux et sécurisez chaque prise de décision.
            </p>

            {/* AI Capabilities Grid */}
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              {aiCapabilities.map((cap) => (
                <div
                  key={cap.title}
                  className="bg-card/70 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-border hover:border-primary/40 transition-all shadow-sm group flex flex-col items-center text-center"
                >
                  <div className="text-primary mb-3 flex justify-center">
                    <cap.icon className="w-7 h-7 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.75} />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm sm:text-base mb-1.5 text-center">{cap.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed text-center">{cap.desc}</p>
                </div>
              ))}
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Button asChild size="lg" className="gradient-hero border-0 text-white shadow-md">
                <Link to="/register">
                  Découvrir l'IA Médicale
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Stethoscope className="w-4 h-4 text-primary" />
                <span>Recommandé par plus de 500 praticiens</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AISection;
