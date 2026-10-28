import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Dr. Marie Konaté",
    role: "Directrice — Clinique Santé Plus, Ouagadougou",
    text: "Gesclic a transformé notre gestion. Nous avons réduit les rendez-vous manqués de 60% grâce aux rappels SMS et la réconciliation financière est désormais automatisée.",
    rating: 5,
  },
  {
    name: "Ibrahima Sow",
    role: "Administrateur — Centre Médical de Ouaga",
    text: "L'interface est tellement simple que même notre personnel le moins habitué à l'informatique l'utilise sans problème. Le mode hors-ligne nous a sauvé à plusieurs reprises.",
    rating: 5,
  },
  {
    name: "Dr. Ama Ouédraogo",
    role: "Dentiste — Smile Clinic, Bobo-Dioulasso",
    text: "Les paiements Mobile Money intégrés ont changé la donne. Nos patients adorent payer via Wave ou Orange Money et reçoivent instantanément leur reçu.",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-16 sm:py-24 bg-muted/40 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-3">
            <Star className="w-3.5 h-3.5 fill-primary" />
            <span>Retours d'expérience soignants</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-3 sm:mb-4">
            Ils nous font confiance au quotidien
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground font-medium">
            Plus de 500 établissements de santé et praticiens utilisent Gesclic en Afrique.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className="bg-card rounded-2xl p-5 sm:p-6 shadow-card hover:shadow-elevated border border-border/80 hover:border-primary/40 transition-all flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="absolute top-4 right-4 text-primary/10 group-hover:text-primary/20 transition-colors pointer-events-none">
                <Quote className="w-10 h-10" />
              </div>

              <div>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400 group-hover:scale-110 transition-transform" />
                  ))}
                </div>
                <p className="text-foreground font-serif italic text-sm sm:text-base leading-relaxed mb-6">
                  "{t.text}"
                </p>
              </div>

              <div className="pt-4 border-t border-border/70 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs">
                  {t.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="font-bold text-foreground text-xs sm:text-sm">{t.name}</p>
                  <p className="text-[11px] text-muted-foreground font-medium">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
