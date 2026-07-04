import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  { name: "Dr. Marie Konaté", role: "Directrice — Clinique Santé Plus, Abidjan", text: "Gesclic a transformé notre gestion. Nous avons réduit les rendez-vous manqués de 60% grâce aux rappels SMS.", rating: 5 },
  { name: "Ibrahima Sow", role: "Administrateur — Centre Médical Dakar", text: "L'interface est tellement simple que même notre personnel le moins tech-savvy l'utilise sans problème. Excellent !", rating: 5 },
  { name: "Dr. Ama Owusu", role: "Dentiste — Smile Clinic, Accra", text: "Les paiements Mobile Money intégrés ont changé la donne. Nos patients adorent payer via Wave ou Orange Money.", rating: 5 },
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Ils nous font confiance
          </h2>
          <p className="text-muted-foreground text-lg">
            Plus de 500 établissements de santé utilisent Gesclic en Afrique.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-xl p-6 shadow-card border border-border"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-foreground text-sm leading-relaxed mb-4">"{t.text}"</p>
              <div>
                <p className="font-semibold text-foreground text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
