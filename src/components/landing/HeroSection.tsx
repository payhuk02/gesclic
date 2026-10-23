import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Play,
  Shield,
  Clock,
  Users,
  Smartphone,
  Sparkles,
  Lock,
  ChevronLeft,
  ChevronRight,
  CalendarCheck,
  CheckCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";
import heroImage1 from "@/assets/hero_medical_team.jpg";
import heroImage2 from "@/assets/hero_carousel_tech.jpg";
import heroImage3 from "@/assets/hero_carousel_care.jpg";

const heroSlides = [
  {
    id: 1,
    image: heroImage1,
    alt: "Équipe médicale Gesclic en polyclinique moderne",
    clinic: "Clinique Santé Plus • Abidjan",
    specialty: "Équipe médicale pluridisciplinaire",
    tag: "01 • Équipe Médicale",
    badge: "14 RDV confirmés aujourd'hui",
  },
  {
    id: 2,
    image: heroImage2,
    alt: "Centre cardiologique et copilote d'aide au diagnostic IA",
    clinic: "Centre Cardiologique & Innovation • Dakar",
    specialty: "Diagnostic assisté par IA & Imagerie 3D",
    tag: "02 • Intelligence Artificielle",
    badge: "Gesclic AI : Aide au diagnostic",
  },
  {
    id: 3,
    image: heroImage3,
    alt: "Consultation moderne et télémédecine patient",
    clinic: "Cabinet Médical d'Excellence • Lomé / Cotonou",
    specialty: "Consultation connectée & Relation patient",
    tag: "03 • Consultation & Soins",
    badge: "Paiement Mobile Money validé",
  },
];

const HeroSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-play carousel every 6 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  return (
    <section
      className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-slate-950 pt-20 pb-16 lg:pt-28 lg:pb-20"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Carousel Images Filling Hero with Ken Burns & Fade */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 w-full h-full"
          >
            <img
              src={heroSlides[currentIndex].image}
              alt={heroSlides[currentIndex].alt}
              className="w-full h-full object-cover object-center"
            />
          </motion.div>
        </AnimatePresence>

        {/* Multi-tier Cinematic Overlays for Optimal Contrast & Text Pop */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/70 to-slate-950/95" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/80" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-500/20 via-transparent to-transparent pointer-events-none" />

        {/* Ambient Animated Glows */}
        <motion.div
          className="absolute -top-32 left-1/4 w-[450px] h-[450px] rounded-full bg-sky-500/15 blur-[120px] pointer-events-none"
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-32 right-1/4 w-[450px] h-[450px] rounded-full bg-teal-500/15 blur-[120px] pointer-events-none"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Floating Side Badges on Desktop */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="absolute left-6 xl:left-12 top-1/3 z-20 hidden 2xl:block"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center gap-3 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/15 shadow-2xl p-3.5 max-w-[240px]"
        >
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white">Mobile Money</div>
            <div className="text-[11px] text-slate-300">Orange • Wave • MTN • Moov</div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className="absolute right-6 xl:right-12 top-1/3 z-20 hidden 2xl:block"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center gap-3 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/15 shadow-2xl p-3.5 max-w-[240px]"
        >
          <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white">Copilote IA Médical</div>
            <div className="text-[11px] text-slate-300">Aide au diagnostic en temps réel</div>
          </div>
        </motion.div>
      </motion.div>

      {/* Main Centered Content */}
      <div className="container relative z-20 mx-auto px-4 flex flex-col items-center text-center">
        {/* Animated Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 px-4 py-1.5 text-xs sm:text-sm font-semibold text-white mb-6 sm:mb-8 shadow-lg transition-all"
        >
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <Shield className="w-4 h-4 text-sky-400" />
          <span>Plateforme médicale nouvelle génération certifiée pour l'Afrique</span>
        </motion.div>

        {/* Animated Centered Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.15] max-w-5xl mb-6 sm:mb-8"
        >
          La gestion médicale{" "}
          <span className="bg-gradient-to-r from-sky-300 via-cyan-200 to-teal-300 bg-clip-text text-transparent">
            intelligente & unifiée
          </span>{" "}
          pour votre clinique
        </motion.h1>

        {/* Animated Centered Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-base sm:text-lg md:text-xl text-slate-200/90 leading-relaxed max-w-3xl mb-8 sm:mb-10 font-normal"
        >
          Dossiers médicaux électroniques, téléconsultation HD, IA d'aide au diagnostic, pharmacie, laboratoire et encaissements Mobile Money instantanés. Conçu pour simplifier le quotidien des praticiens et directeurs de cliniques.
        </motion.p>

        {/* Animated Centered CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 w-full sm:w-auto mb-10 sm:mb-12"
        >
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-sky-500 via-sky-600 to-teal-500 hover:from-sky-400 hover:to-teal-400 border-0 text-base sm:text-lg px-8 shadow-hero hover:shadow-sky-500/30 transition-all duration-300 text-white font-bold w-full sm:w-auto h-13 rounded-xl group"
          >
            <Link to="/register" className="flex items-center justify-center">
              Démarrer gratuitement
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="bg-white/10 hover:bg-white/20 border-white/25 text-white backdrop-blur-md text-base sm:text-lg px-7 w-full sm:w-auto h-13 rounded-xl transition-all font-semibold"
          >
            <Link to="/login" className="flex items-center justify-center">
              <Play className="mr-2 w-4 h-4 text-sky-300" />
              Espace Praticien
            </Link>
          </Button>
        </motion.div>

        {/* Animated Centered Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-xs sm:text-sm text-slate-300 mb-10"
        >
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15">
            <Clock className="w-4 h-4 text-sky-400" />
            <span>Déploiement en 5 min</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>+500 cliniques partenaires</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15">
            <Smartphone className="w-4 h-4 text-amber-400" />
            <span>100% Mobile Money</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15">
            <Lock className="w-4 h-4 text-cyan-300" />
            <span>Chiffré AES-256</span>
          </div>
        </motion.div>

        {/* Premium Carousel Navigation Dock */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.75 }}
          className="w-full max-w-4xl pt-6 border-t border-white/15 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          {/* Active Slide Info */}
          <div className="flex items-center gap-2.5 text-xs text-slate-300 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/15">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">
              {heroSlides[currentIndex].clinic}
            </span>
            <span className="text-slate-400 hidden sm:inline">
              — {heroSlides[currentIndex].specialty}
            </span>
          </div>

          {/* Slide Selector Buttons */}
          <div className="flex items-center gap-2">
            {heroSlides.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => setCurrentIndex(idx)}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all duration-300 ${
                  currentIndex === idx
                    ? "bg-white/20 text-white font-semibold border border-white/30 shadow-md"
                    : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-transparent"
                }`}
              >
                <span>{slide.tag}</span>
                {currentIndex === idx && (
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                )}
              </button>
            ))}
          </div>

          {/* Carousel Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={prevSlide}
              aria-label="Image précédente"
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 text-white transition-all backdrop-blur-md hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextSlide}
              aria-label="Image suivante"
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 text-white transition-all backdrop-blur-md hover:scale-105 active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Bottom fade transition to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
};

export default HeroSection;
