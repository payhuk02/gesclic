import { motion } from "framer-motion";
import { Building2, Users, Clock, ShieldCheck, Smartphone, Sparkles } from "lucide-react";

const stats = [
  {
    icon: Building2,
    value: "+500",
    label: "Établissements partenaires",
    desc: "Cliniques, cabinets & centres médicaux en Afrique",
    badge: "Réseau actif",
  },
  {
    icon: Users,
    value: "+350 000",
    label: "Patients suivis",
    desc: "Dossiers médicaux digitalisés et sécurisés",
    badge: "Volume mensuel",
  },
  {
    icon: Clock,
    value: "-45%",
    label: "Temps administratif",
    desc: "Moins de paperasse pour vos équipes soignantes",
    badge: "Gain soignant",
  },
  {
    icon: ShieldCheck,
    value: "99.9%",
    label: "Disponibilité garantie",
    desc: "Fonctionne même hors-ligne grâce à la PWA",
    badge: "Haute tolérance",
  },
  {
    icon: Smartphone,
    value: "100%",
    label: "Mobile Money & Carte",
    desc: "Orange Money, Wave, MTN, Moov & CB",
    badge: "Multi-opérateurs",
  },
];

const StatsSection = () => {
  return (
    <section className="py-14 sm:py-20 bg-muted/30 border-y border-border/60 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-14"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 text-primary text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Impact clinique mesuré en production</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground tracking-tight">
            La référence technologique de la santé en Afrique
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className="bg-card rounded-2xl p-4 sm:p-6 border border-border/80 shadow-card hover:shadow-elevated hover:border-primary/50 transition-all duration-300 flex flex-col items-center text-center justify-between group"
            >
              {/* Direct icon without any background wrapper */}
              <div className="flex items-center justify-center mb-3 sm:mb-4 text-primary">
                <stat.icon className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-300" strokeWidth={1.75} />
              </div>

              <div className="flex flex-col items-center w-full">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground tracking-tight mb-1.5 tabular-nums group-hover:text-primary transition-colors">
                  {stat.value}
                </span>
                <p className="text-xs sm:text-sm font-semibold text-foreground mb-1 leading-snug">
                  {stat.label}
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed hidden sm:block">
                  {stat.desc}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-border/40 w-full flex items-center justify-center">
                <span className="text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wider">
                  {stat.badge}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
