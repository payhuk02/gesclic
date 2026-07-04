import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => (
  <section className="py-16 sm:py-20 bg-background">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="gradient-hero rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-16 text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
        <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-primary-foreground/30 fill-primary-foreground/10 mx-auto mb-4 sm:mb-6" />
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-foreground mb-3 sm:mb-4 relative">
          Prêt à moderniser votre clinique ?
        </h2>
        <p className="text-base sm:text-lg text-primary-foreground/80 mb-6 sm:mb-8 max-w-2xl mx-auto relative px-4">
          Rejoignez des centaines de professionnels de santé qui font confiance à Gesclic pour gérer leur établissement au quotidien.
        </p>
        <Button asChild size="lg" variant="secondary" className="text-base sm:text-lg px-6 sm:px-8 relative w-full sm:w-auto">
          <Link to="/register">
            Commencer gratuitement
            <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
        </Button>
      </motion.div>
    </div>
  </section>
);

export default CTASection;
