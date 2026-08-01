import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Shield, Clock, Users, Heart, Stethoscope, CalendarCheck, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-medical.png";

const floatingItems = [
  { icon: Heart, label: "Suivi vital", x: "right-0", y: "top-8", delay: 0.8, color: "text-destructive bg-destructive/10" },
  { icon: Stethoscope, label: "Consultations", x: "right-12", y: "bottom-24", delay: 1.0, color: "text-primary bg-primary/10" },
  { icon: CalendarCheck, label: "RDV du jour: 12", x: "-left-4", y: "top-1/3", delay: 1.2, color: "text-accent bg-accent/10" },
  { icon: FileText, label: "Dossiers", x: "left-8", y: "bottom-16", delay: 1.4, color: "text-warning bg-warning/10" },
];

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-background pt-16 pb-12 sm:pt-20 sm:pb-16 lg:pt-28 lg:pb-24">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] rounded-full bg-primary/5 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] rounded-full bg-accent/5 blur-3xl"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.6, 0.4, 0.6] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="container relative mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Text */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full bg-medical-light px-3 py-1.5 sm:px-4 text-xs sm:text-sm font-medium text-primary mb-4 sm:mb-6"
            >
              <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Plateforme certifiée pour la santé en Afrique</span>
              <span className="sm:hidden">Certifié santé Afrique</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-4 sm:mb-6"
            >
              La gestion médicale{" "}
              <span className="gradient-hero-text">
                simplifiée
              </span>{" "}
              pour l'Afrique
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6 sm:mb-8 max-w-lg"
            >
              Gérez vos rendez-vous, patients, dossiers médicaux et paiements
              depuis une seule plateforme. Conçu pour les cliniques, cabinets et
              centres de santé africains.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="flex flex-col sm:flex-wrap sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-12"
            >
              <Button asChild size="lg" className="gradient-hero border-0 text-base sm:text-lg px-6 sm:px-8 shadow-hero hover:opacity-90 transition-opacity w-full sm:w-auto">
                <Link to="/register">
                  Commencer gratuitement
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto">
                <Link to="/login">
                  <Play className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                  Voir la démo
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex items-center gap-4 sm:gap-8 text-xs sm:text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                <span>Mise en place en 5 min</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
                <span>+500 cliniques</span>
              </div>
            </motion.div>
          </div>

          {/* Right: Illustration + floating cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative flex items-center justify-center lg:flex"
          >
            {/* Glow behind image */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-60 h-60 sm:w-80 sm:h-80 rounded-full bg-primary/10 blur-[60px] sm:blur-[80px]" />
            </div>

            <img
              src={heroImage}
              alt="Infirmière professionnelle utilisant une tablette pour la gestion médicale"
              width={1024}
              height={1024}
              className="relative z-10 w-full max-w-[320px] sm:max-w-[420px] h-auto drop-shadow-2xl rounded-2xl object-cover"
              loading="lazy"
            />

            {/* Floating cards - hidden on mobile, visible on lg screens */}
            {floatingItems.map((item) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: item.delay, type: "spring", stiffness: 200 }}
                className={`absolute ${item.x} ${item.y} z-20 hidden lg:block`}
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, ease: "easeInOut" }}
                  className="flex items-center gap-2 rounded-xl bg-card border border-border shadow-elevated px-3 py-2"
                >
                  <div className={`p-1.5 rounded-lg ${item.color}`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-foreground whitespace-nowrap">{item.label}</span>
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
