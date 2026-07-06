import { motion } from "framer-motion";
import {
  Calendar, Users, FileText, CreditCard, Bell, Video,
  FlaskConical, Pill, Building2, BarChart3, Shield, Smartphone,
} from "lucide-react";

const features = [
  { icon: Calendar, title: "Rendez-vous", desc: "Calendrier intelligent avec réservation en ligne et rappels automatiques." },
  { icon: Users, title: "Patients", desc: "Dossiers complets avec historique médical, allergies et contacts d'urgence." },
  { icon: FileText, title: "Dossiers médicaux", desc: "Dossier médical électronique avec timeline, diagnostics et documents." },
  { icon: CreditCard, title: "Paiements", desc: "Orange Money, MTN, Wave, espèces. Factures et reçus automatiques." },
  { icon: Bell, title: "Rappels SMS/WhatsApp", desc: "Notifications automatiques de rendez-vous par SMS et WhatsApp." },
  { icon: Video, title: "Téléconsultation", desc: "Consultations vidéo sécurisées avec partage de documents." },
  { icon: FlaskConical, title: "Laboratoire", desc: "Gestion des analyses, résultats et validation par le médecin." },
  { icon: Pill, title: "Pharmacie", desc: "Stock, ventes, alertes de rupture et liaison ordonnances." },
  { icon: Building2, title: "Multi-clinique", desc: "Architecture multi-tenant. Chaque clinique a son propre espace." },
  { icon: BarChart3, title: "Statistiques", desc: "Graphiques de revenus, fréquentation et performance en temps réel." },
  { icon: Shield, title: "Sécurité", desc: "Données chiffrées, rôles et permissions granulaires." },
  { icon: Smartphone, title: "Mobile", desc: "Interface responsive parfaitement adaptée aux smartphones." },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-16 sm:py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Tout ce dont votre clinique a besoin
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Une suite complète d'outils pour gérer votre établissement de santé efficacement.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-xl p-4 sm:p-6 shadow-card hover:shadow-elevated transition-shadow border border-border group text-center"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 mx-auto">
                <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">{feature.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
