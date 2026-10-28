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
      {/* Dynamic ambient background glow */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.12, 0.22, 0.12] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[450px] h-[450px] bg-primary rounded-full blur-3xl pointer-events-none"
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Image with floating AI HUD Badges (5 cols) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 relative order-2 lg:order-1"
          >
            <div className="relative rounded-3xl overflow-hidden border border-primary/25 shadow-elevated group">
              <img
                src={medicalAiImg}
                alt="Médecin utilisant l'IA Gesclic"
                className="w-full h-[360px] sm:h-[460px] object-cover object-center group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent pointer-events-none" />

              {/* Floating diagnostic badge with gentle levitation */}
              <motion.div
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-4 left-4 bg-card/95 backdrop-blur-md rounded-2xl p-3.5 border border-primary/40 shadow-xl max-w-[250px]"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">Assistant Gesclic AI</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight font-medium">
                  Constantes analysées : rythme sinusal régulier, aucun conflit médicamenteux détecté.
                </p>
              </motion.div>

              {/* Bottom security assurance */}
              <div className="absolute bottom-4 left-4 right-4 bg-card/95 backdrop-blur-md rounded-xl p-3 border border-border flex items-center gap-2.5 shadow-lg">
                <Lock className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-xs text-foreground font-semibold">
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

            {/* AI Capabilities Grid with Stagger & Hover Elevation */}
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              {aiCapabilities.map((cap, i) => (
                <motion.div
                  key={cap.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-border hover:border-primary/50 transition-all shadow-card hover:shadow-elevated group flex flex-col items-center text-center"
                >
                  <div className="text-primary mb-3 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <cap.icon className="w-8 h-8 text-primary" strokeWidth={1.75} />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm sm:text-base mb-1.5 text-center">{cap.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed text-center font-medium">{cap.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Button asChild size="lg" className="gradient-hero border-0 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <Link to="/register">
                  Découvrir l'IA Médicale
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground font-medium">
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
