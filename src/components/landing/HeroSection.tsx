import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Play,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import heroImage1 from "@/assets/hero_medical_team.jpg";
import heroImage2 from "@/assets/hero_carousel_tech.jpg";
import heroImage3 from "@/assets/hero_carousel_care.jpg";

interface HeroSlide {
  id: number;
  image: string;
  alt: string;
  titlePrefix: string;
  titleHighlight: string;
  highlightGradient: string;
  description: string;
  shortLabel: string;
}

const SLIDE_DURATION = 6500; // 6.5s per slide

const heroSlides: HeroSlide[] = [
  {
    id: 1,
    image: heroImage1,
    alt: "Équipe médicale Gesclic en polyclinique moderne",
    titlePrefix: "La gestion médicale ",
    titleHighlight: "unifiée & intelligente",
    highlightGradient: "from-sky-300 via-cyan-200 to-teal-300",
    description: "Dossiers patients, téléconsultation, ordonnances sécurisées et encaissements en temps réel.",
    shortLabel: "Gestion Clinique",
  },
  {
    id: 2,
    image: heroImage2,
    alt: "Centre cardiologique et copilote d'aide au diagnostic IA",
    titlePrefix: "Diagnostics assistés & ",
    titleHighlight: "synthèses médicales IA",
    highlightGradient: "from-teal-300 via-emerald-200 to-cyan-300",
    description: "Aide au diagnostic différentiel et détection instantanée des contre-indications médicamenteuses.",
    shortLabel: "Assistant IA",
  },
  {
    id: 3,
    image: heroImage3,
    alt: "Consultation moderne et télémédecine patient",
    titlePrefix: "Consultez partout avec ",
    titleHighlight: "Mobile Money direct",
    highlightGradient: "from-sky-300 via-indigo-200 to-cyan-300",
    description: "Téléconsultations chiffrées sans installation et paiements directs Wave, Orange Money et MTN.",
    shortLabel: "Télémédecine",
  },
];

const HeroSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(1);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % heroSlides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  }, []);

  const goToSlide = (idx: number) => {
    setDirection(idx > currentIndex ? 1 : -1);
    setCurrentIndex(idx);
  };

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide, currentIndex]);

  const activeSlide = heroSlides[currentIndex];

  return (
    <section
      className="relative min-h-[100vh] sm:min-h-[105vh] lg:min-h-[110vh] flex items-center justify-center overflow-hidden bg-slate-950 pt-28 sm:pt-36 pb-20 sm:pb-28 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Présentation Gesclic"
    >
      {/* Background Carousel with vibrant image visibility (no heavy opaque bottom shadow) */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <AnimatePresence mode="sync" custom={direction}>
          <motion.div
            key={activeSlide.id}
            custom={direction}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{
              duration: 1.1,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="absolute inset-0 w-full h-full"
          >
            <img
              src={activeSlide.image}
              alt={activeSlide.alt}
              className="w-full h-full object-cover object-center transform-gpu brightness-[0.92]"
              loading="eager"
            />
          </motion.div>
        </AnimatePresence>

        {/* Soft, light overlay for image clarity without black shadows */}
        <div className="absolute inset-0 bg-black/25 pointer-events-none" />
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        aria-label="Diapositive précédente"
        className="absolute left-3 sm:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full bg-black/30 hover:bg-black/60 border border-white/20 text-white backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg group focus:outline-none"
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2} />
      </button>

      <button
        onClick={nextSlide}
        aria-label="Diapositive suivante"
        className="absolute right-3 sm:right-6 lg:right-8 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full bg-black/30 hover:bg-black/60 border border-white/20 text-white backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg group focus:outline-none"
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
      </button>

      {/* Clean, un-cluttered Hero Content Area */}
      <div className="container relative z-20 mx-auto px-4 flex flex-col items-center text-center max-w-3xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center"
          >
            {/* Short & impactful headline */}
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold tracking-tight text-white leading-tight mb-6 sm:mb-8 drop-shadow-[0_2px_14px_rgba(0,0,0,0.9)] max-w-3xl"
            >
              {activeSlide.titlePrefix}
              <span className={`font-serif italic bg-gradient-to-r ${activeSlide.highlightGradient} bg-clip-text text-transparent`}>
                {activeSlide.titleHighlight}
              </span>
            </motion.h1>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto"
            >
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-sky-500 via-sky-600 to-teal-500 hover:from-sky-400 hover:to-teal-400 border-0 text-sm sm:text-base px-7 shadow-xl shadow-sky-500/25 text-white font-bold w-full sm:w-auto h-11 rounded-xl group transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Link to="/register" className="flex items-center justify-center">
                  Démarrer gratuitement
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="bg-black/35 hover:bg-black/60 border-white/30 text-white backdrop-blur-md text-sm sm:text-base px-6 w-full sm:w-auto h-11 rounded-xl font-semibold transition-all duration-200 hover:border-white/50 active:scale-[0.98]"
              >
                <Link to="/login" className="flex items-center justify-center">
                  <Play className="mr-2 w-4 h-4 text-sky-300" />
                  Espace Praticien
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Top Discrete Progress Bar Pills */}
      <div className="absolute top-20 sm:top-24 left-0 right-0 z-20 flex items-center justify-center px-4">
        <div className="flex items-center gap-2 sm:gap-2.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 shadow-lg">
          {heroSlides.map((slide, idx) => {
            const isActive = currentIndex === idx;
            return (
              <button
                key={slide.id}
                onClick={() => goToSlide(idx)}
                aria-label={`Afficher la diapositive ${slide.shortLabel}`}
                className={`group flex items-center gap-2 px-2.5 py-1 rounded-full transition-all duration-200 ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <div className="relative w-6 sm:w-8 h-1 rounded-full bg-white/25 overflow-hidden">
                  {isActive && (
                    <motion.div
                      key={`progress-${idx}-${currentIndex}`}
                      initial={{ width: "0%" }}
                      animate={{ width: isPaused ? undefined : "100%" }}
                      transition={{
                        duration: SLIDE_DURATION / 1000,
                        ease: "linear",
                      }}
                      className="absolute left-0 top-0 bottom-0 bg-sky-400 rounded-full"
                    />
                  )}
                </div>
                <span className="text-xs font-semibold whitespace-nowrap hidden sm:inline-block">
                  {slide.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
