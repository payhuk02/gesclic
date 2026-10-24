import { motion } from "framer-motion";
import { Building2, Users, Clock, ShieldCheck, Smartphone } from "lucide-react";

const stats = [
  {
    icon: Building2,
    value: "+500",
    label: "Établissements partenaires",
    desc: "Cliniques, cabinets & centres médicaux en Afrique",
  },
  {
    icon: Users,
    value: "+350 000",
    label: "Patients suivis",
    desc: "Dossiers médicaux digitalisés et sécurisés",
  },
  {
    icon: Clock,
    value: "-45%",
    label: "Temps administratif",
    desc: "Moins de paperasse pour vos équipes soignantes",
  },
  {
    icon: ShieldCheck,
    value: "99.9%",
    label: "Disponibilité garantie",
    desc: "Fonctionne même hors-ligne grâce à la PWA",
  },
  {
    icon: Smartphone,
    value: "100%",
    label: "Mobile Money & Carte",
    desc: "Orange Money, Wave, MTN, Moov & CB",
  },
];

const StatsSection = () => {
  return (
    <section className="py-12 sm:py-16 bg-muted/40 border-y border-border/60 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-12"
        >
          <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-primary mb-2 block">
            Impact clinique mesuré
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground">
            La référence technologique de la santé en Afrique
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="flex items-center gap-3 mb-3">
                {/* Unified Enterprise Medical Icon Container */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-primary/15 to-primary/5 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm">
                  <stat.icon className="w-5 h-5" strokeWidth={1.75} />
                </div>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground tracking-tight mb-1 tabular-nums">
                  {stat.value}
                </p>
                <p className="text-xs sm:text-sm font-semibold text-foreground mb-1 leading-snug">
                  {stat.label}
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {stat.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
