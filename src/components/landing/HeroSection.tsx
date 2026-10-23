import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Play,
  Shield,
  Clock,
  Users,
  Smartphone,
  Sparkles,
  CalendarCheck,
  FileCheck2,
  Lock,
} from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero_medical_team.jpg";

const floatingItems = [
  {
    icon: Smartphone,
    label: "Paiement Mobile Money validé",
    x: "-right-4 sm:-right-8",
    y: "top-8",
    delay: 0.8,
    color: "text-success bg-success/10",
  },
  {
    icon: Sparkles,
    label: "Gesclic AI : Aide au diagnostic",
    x: "right-4",
    y: "bottom-12",
    delay: 1.0,
    color: "text-primary bg-primary/10",
  },
  {
    icon: CalendarCheck,
    label: "14 RDV confirmés aujourd'hui",
    x: "-left-6 sm:-left-10",
    y: "top-1/4",
    delay: 1.2,
    color: "text-accent bg-accent/10",
  },
  {
    icon: Lock,
    label: "Dossier chiffré AES-256",
    x: "-left-4",
    y: "bottom-16",
    delay: 1.4,
    color: "text-warning bg-warning/10",
  },
];

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-background pt-20 pb-12 sm:pt-24 sm:pb-16 lg:pt-32 lg:pb-24">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-[350px] h-[350px] sm:w-[600px] sm:h-[600px] rounded-full bg-primary/10 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-[350px] h-[350px] sm:w-[600px] sm:h-[600px] rounded-full bg-accent/10 blur-3xl"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.6, 0.4, 0.6] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="container relative mx-auto px-4">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left: Text & CTA (7 cols) */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-primary mb-4 sm:mb-6 shadow-sm"
            >
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              <span>Plateforme médicale nouvelle génération certifiée pour l'Afrique</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight text-foreground leading-[1.1] mb-5 sm:mb-6"
            >
              La gestion médicale{" "}
              <span className="gradient-hero-text">
                intelligente & unifiée
              </span>{" "}
              pour votre clinique
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6 sm:mb-8 max-w-xl"
            >
              Dossiers médicaux électroniques, téléconsultation HD, IA d'aide au diagnostic, pharmacie, laboratoire et encaissements Mobile Money instantanés. Conçu pour simplifier le quotidien des praticiens et directeurs de cliniques.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-10"
            >
              <Button asChild size="lg" className="gradient-hero border-0 text-base sm:text-lg px-8 shadow-hero hover:opacity-95 transition-all text-white font-semibold w-full sm:w-auto h-12">
                <Link to="/register">
                  Démarrer gratuitement
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base sm:text-lg px-6 w-full sm:w-auto h-12 border-border hover:bg-muted">
                <Link to="/login">
                  <Play className="mr-2 w-4 h-4 text-primary" />
                  Espace Praticien
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap items-center gap-6 sm:gap-8 text-xs sm:text-sm text-muted-foreground pt-2 border-t border-border/60"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>Déploiement en 5 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                <span>+500 cliniques partenaires</span>
              </div>
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-success" />
                <span>Sans engagement</span>
              </div>
            </motion.div>
          </div>

          {/* Right: Realistic Medical Visual + Floating Interactive Badges (5 cols) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-5 relative flex items-center justify-center"
          >
            {/* Glow behind image */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-primary/15 blur-[80px]" />
            </div>

            <div className="relative z-10 w-full max-w-[480px] rounded-3xl overflow-hidden border-2 border-border shadow-2xl group">
              <img
                src={heroImage}
                alt="Équipe médicale Gesclic en clinique moderne"
                width={1200}
                height={800}
                className="w-full h-[340px] sm:h-[440px] object-cover object-center group-hover:scale-102 transition-transform duration-500"
                priority="true"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

              {/* Bottom tag on image */}
              <div className="absolute bottom-3 left-3 right-3 bg-background/90 backdrop-blur-md rounded-xl p-2.5 border border-border/80 flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  Clinique Santé Plus • Abidjan
                </span>
                <span className="text-[11px] font-mono text-primary font-bold">
                  En ligne
                </span>
              </div>
            </div>

            {/* Floating badges */}
            {floatingItems.map((item) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: item.delay, type: "spring", stiffness: 220 }}
                className={`absolute ${item.x} ${item.y} z-20 hidden md:block`}
              >
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3.5 + Math.random() * 2, repeat: Infinity, ease: "easeInOut" }}
                  className="flex items-center gap-2 rounded-xl bg-card/95 backdrop-blur-md border border-border/90 shadow-elevated px-3 py-2"
                >
                  <div className={`p-1.5 rounded-lg ${item.color}`}>
                    <item.icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-foreground whitespace-nowrap">
                    {item.label}
                  </span>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
