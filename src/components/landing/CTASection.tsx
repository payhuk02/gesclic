import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Play } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => (
  <section className="py-16 sm:py-24 bg-background relative overflow-hidden">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="gradient-hero rounded-3xl p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden shadow-hero"
      >
        {/* Subtle architectural ambient light */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

        {/* Enterprise status badge replacing the generic AI heart icon */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <ShieldCheck className="w-3.5 h-3.5 text-sky-200" strokeWidth={1.75} />
          <span>Déploiement en 5 minutes • Essai 14 jours sans carte bancaire</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-4 relative max-w-3xl mx-auto leading-tight drop-shadow-sm">
          Prêt à élever les standards de gestion de votre établissement ?
        </h2>

        <p className="text-base sm:text-lg text-white/90 mb-8 sm:mb-10 max-w-2xl mx-auto relative px-4 leading-relaxed font-normal">
          Rejoignez les directeurs de cliniques et professionnels de santé d'Afrique francophone qui font confiance à Gesclic pour digitaliser leurs soins et encaissements.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 relative">
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="text-base font-bold px-8 h-12 shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto rounded-xl"
          >
            <Link to="/register" className="flex items-center justify-center">
              Démarrer l'essai gratuit
              <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.75} />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="bg-white/10 hover:bg-white/20 border-white/30 text-white backdrop-blur-md text-base px-6 h-12 rounded-xl transition-all font-semibold w-full sm:w-auto"
          >
            <Link to="/login" className="flex items-center justify-center">
              <Play className="mr-2 w-4 h-4 text-sky-200" strokeWidth={1.75} />
              Accéder à l'espace praticien
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  </section>
);

export default CTASection;
