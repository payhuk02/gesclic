import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Play,
  Shield,
  ChevronLeft,
  ChevronRight,
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
  },
  {
    id: 2,
    image: heroImage2,
    alt: "Centre cardiologique et copilote d'aide au diagnostic IA",
  },
  {
    id: 3,
    image: heroImage3,
    alt: "Consultation moderne et télémédecine patient",
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
      className="relative min-h-[90vh] lg:min-h-[94vh] flex items-center justify-center overflow-hidden bg-slate-950 pt-20 pb-16 lg:pt-28 lg:pb-20"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Carousel Images Filling Hero with Ken Burns & Fade */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 w-full h-full"
          >
            <img
              src={heroSlides[currentIndex].image}
              alt={heroSlides[currentIndex].alt}
              className="w-full h-full object-cover object-center"
            />
          </motion.div>
        </AnimatePresence>

        {/* Subtle, Light Overlay: Keeps images bright, crisp, and clearly visible */}
        <div className="absolute inset-0 bg-black/25 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/50 pointer-events-none" />
      </div>

      {/* Navigation Arrows on Screen Edges */}
      <button
        onClick={prevSlide}
        aria-label="Image précédente"
        className="absolute left-3 sm:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full bg-black/30 hover:bg-black/60 border border-white/20 text-white backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg"
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      <button
        onClick={nextSlide}
        aria-label="Image suivante"
        className="absolute right-3 sm:right-6 lg:right-8 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full bg-black/30 hover:bg-black/60 border border-white/20 text-white backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg"
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Main Centered Content */}
      <div className="container relative z-20 mx-auto px-4 flex flex-col items-center text-center">
        {/* Animated Accréditation Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full bg-slate-950/60 hover:bg-slate-950/75 backdrop-blur-md border border-white/25 px-4 py-1.5 text-xs sm:text-sm font-semibold text-white mb-6 sm:mb-8 shadow-xl transition-all"
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
          className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.15] max-w-5xl mb-6 sm:mb-8 drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)]"
        >
          La gestion médicale{" "}
          <span className="bg-gradient-to-r from-sky-300 via-cyan-200 to-teal-300 bg-clip-text text-transparent drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
            intelligente & unifiée
          </span>{" "}
          pour votre clinique
        </motion.h1>

        {/* Animated Centered Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-base sm:text-lg md:text-xl text-white font-medium drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)] leading-relaxed max-w-3xl mb-8 sm:mb-10"
        >
          Dossiers médicaux électroniques, téléconsultation HD, IA d'aide au diagnostic, pharmacie, laboratoire et encaissements Mobile Money instantanés. Conçu pour simplifier le quotidien des praticiens et directeurs de cliniques.
        </motion.p>

        {/* Animated Centered CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 w-full sm:w-auto"
        >
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-sky-500 via-sky-600 to-teal-500 hover:from-sky-400 hover:to-teal-400 border-0 text-base sm:text-lg px-8 shadow-2xl hover:shadow-sky-500/40 transition-all duration-300 text-white font-bold w-full sm:w-auto h-13 rounded-xl group"
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
            className="bg-slate-950/60 hover:bg-slate-950/80 border-white/30 text-white backdrop-blur-md text-base sm:text-lg px-7 w-full sm:w-auto h-13 rounded-xl transition-all font-semibold shadow-2xl"
          >
            <Link to="/login" className="flex items-center justify-center">
              <Play className="mr-2 w-4 h-4 text-sky-300" />
              Espace Praticien
            </Link>
          </Button>
        </motion.div>
      </div>

      {/* Discreet Minimalist Carousel Slide Indicators at bottom */}
      <div className="absolute bottom-6 left-0 right-0 z-20 flex items-center justify-center gap-2.5 pointer-events-auto">
        {heroSlides.map((slide, idx) => (
          <button
            key={slide.id}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Afficher l'image ${idx + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              currentIndex === idx
                ? "w-8 bg-sky-400 shadow-md shadow-sky-400/50"
                : "w-2 bg-white/40 hover:bg-white/75 hover:w-4"
            }`}
          />
        ))}
      </div>

      {/* Subtle bottom transition to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background/60 to-transparent pointer-events-none" />
    </section>
  );
};

export default HeroSection;
