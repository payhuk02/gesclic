import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  { name: "Dr. Marie Konaté", role: "Directrice — Clinique Santé Plus, Abidjan", text: "Gesclic a transformé notre gestion. Nous avons réduit les rendez-vous manqués de 60% grâce aux rappels SMS.", rating: 5 },
  { name: "Ibrahima Sow", role: "Administrateur — Centre Médical Dakar", text: "L'interface est tellement simple que même notre personnel le moins tech-savvy l'utilise sans problème. Excellent !", rating: 5 },
  { name: "Dr. Ama Owusu", role: "Dentiste — Smile Clinic, Accra", text: "Les paiements Mobile Money intégrés ont changé la donne. Nos patients adorent payer via Wave ou Orange Money.", rating: 5 },
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-16 sm:py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Ils nous font confiance
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            Plus de 500 établissements de santé utilisent Gesclic en Afrique.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-xl p-4 sm:p-6 shadow-card border border-border"
            >
              <div className="flex gap-1 mb-3 sm:mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-3 h-3 sm:w-4 sm:h-4 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-foreground text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4">"{t.text}"</p>
              <div>
                <p className="font-semibold text-foreground text-xs sm:text-sm">{t.name}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
