import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Play, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => (
  <section className="py-16 sm:py-24 bg-background relative overflow-hidden">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="gradient-hero rounded-3xl p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden shadow-hero"
      >
        {/* Subtle architectural ambient light with dynamic pulse */}
        <motion.div
          animate={{ opacity: [0.15, 0.28, 0.15], scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_60%)] pointer-events-none"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

        {/* Enterprise status badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs sm:text-sm font-semibold mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <ShieldCheck className="w-4 h-4 text-sky-200" strokeWidth={1.8} />
          <span>Déploiement en 5 minutes • Essai 7 jours sans carte bancaire</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-4 relative max-w-3xl mx-auto leading-tight drop-shadow-sm">
          Prêt à élever les standards de gestion de votre établissement ?
        </h2>

        <p className="text-base sm:text-lg text-white/95 mb-8 sm:mb-10 max-w-2xl mx-auto relative px-4 leading-relaxed font-medium">
          Rejoignez les directeurs de cliniques et professionnels de santé d'Afrique francophone qui font confiance à Gesclic pour digitaliser leurs soins et encaissements.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 relative">
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="text-base font-bold px-8 h-12 shadow-xl hover:shadow-2xl transition-all duration-300 w-full sm:w-auto rounded-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            <Link to="/register" className="flex items-center justify-center">
              Démarrer l'essai gratuit
              <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="bg-white/10 hover:bg-white/20 border-white/30 text-white backdrop-blur-md text-base px-6 h-12 rounded-xl transition-all font-semibold w-full sm:w-auto hover:scale-[1.02] active:scale-[0.98]"
          >
            <Link to="/login" className="flex items-center justify-center">
              <Play className="mr-2 w-4 h-4 text-sky-200" strokeWidth={2} />
              Accéder à l'espace praticien
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  </section>
);

export default CTASection;
