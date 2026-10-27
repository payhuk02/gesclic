import { useState, useEffect } from "react";
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
      className="relative min-h-[100svh] h-[100svh] flex items-end justify-center overflow-hidden bg-slate-950 pt-16 pb-20"
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

        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/25 pointer-events-none" />
      </div>

      {/* Navigation Arrows on Screen Edges */}
      <button
        onClick={prevSlide}
        aria-label="Image précédente"
        className="absolute left-3 sm:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full bg-black/30 hover:bg-black/60 border border-white/20 text-white backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg"
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.75} />
      </button>

      <button
        onClick={nextSlide}
        aria-label="Image suivante"
        className="absolute right-3 sm:right-6 lg:right-8 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full bg-black/30 hover:bg-black/60 border border-white/20 text-white backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg"
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.75} />
      </button>

      <div className="container relative z-20 mx-auto px-4 flex flex-col items-center text-center pb-8 sm:pb-10">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold tracking-tight text-white leading-tight max-w-3xl mb-3 drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]"
        >
          La gestion médicale{" "}
          <span className="font-serif italic bg-gradient-to-r from-sky-300 via-cyan-200 to-teal-300 bg-clip-text text-transparent">
            unifiée
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-sm sm:text-base text-white/90 font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] max-w-xl mb-5"
        >
          Dossiers, téléconsultation, IA, pharmacie et Mobile Money — essai Pro 7 jours.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto"
        >
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-sky-500 via-sky-600 to-teal-500 hover:from-sky-400 hover:to-teal-400 border-0 text-sm sm:text-base px-6 shadow-xl text-white font-bold w-full sm:w-auto h-11 rounded-xl group"
          >
            <Link to="/register" className="flex items-center justify-center">
              Démarrer gratuitement
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="bg-slate-950/50 hover:bg-slate-950/70 border-white/30 text-white backdrop-blur-md text-sm sm:text-base px-5 w-full sm:w-auto h-11 rounded-xl font-semibold"
          >
            <Link to="/login" className="flex items-center justify-center">
              <Play className="mr-2 w-4 h-4 text-sky-300" />
              Espace Praticien
            </Link>
          </Button>
        </motion.div>
      </div>

      <div className="absolute top-24 left-0 right-0 z-20 flex items-center justify-center gap-2.5 pointer-events-auto">
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
