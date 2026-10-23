import { motion } from "framer-motion";
import { Building2, Users, Clock, ShieldCheck, Smartphone } from "lucide-react";

const stats = [
  {
    icon: Building2,
    value: "+500",
    label: "Établissements partenaires",
    desc: "Cliniques, cabinets & centres médicaux en Afrique",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Users,
    value: "+350 000",
    label: "Patients suivis",
    desc: "Dossiers médicaux digitalisés et sécurisés",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: Clock,
    value: "-45%",
    label: "Temps administratif",
    desc: "Moins de paperasse pour vos équipes soignantes",
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    icon: ShieldCheck,
    value: "99.9%",
    label: "Disponibilité garantie",
    desc: "Fonctionne même hors-ligne grâce à la PWA",
    color: "text-warning",
    bg: "bg-warning/10",
  },
  {
    icon: Smartphone,
    value: "100%",
    label: "Mobile Money & Carte",
    desc: "Orange Money, Wave, MTN, Moov & Visa/Mastercard",
    color: "text-primary",
    bg: "bg-primary/10",
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
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
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
              className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight mb-1 tabular-nums">
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
