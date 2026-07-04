import { motion } from "framer-motion";
import {
  Calendar, Users, FileText, CreditCard, Bell, Video,
  FlaskConical, Pill, Building2, BarChart3, Shield, Smartphone,
} from "lucide-react";

const features = [
  { icon: Calendar, title: "Rendez-vous", desc: "Calendrier intelligent avec réservation en ligne et rappels automatiques.", color: "text-primary bg-primary/10" },
  { icon: Users, title: "Patients", desc: "Dossiers complets avec historique médical, allergies et contacts d'urgence.", color: "text-accent bg-accent/10" },
  { icon: FileText, title: "Dossiers médicaux", desc: "Dossier médical électronique avec timeline, diagnostics et documents.", color: "text-primary bg-primary/10" },
  { icon: CreditCard, title: "Paiements", desc: "Orange Money, MTN, Wave, espèces. Factures et reçus automatiques.", color: "text-warning bg-warning/10" },
  { icon: Bell, title: "Rappels SMS/WhatsApp", desc: "Notifications automatiques de rendez-vous par SMS et WhatsApp.", color: "text-accent bg-accent/10" },
  { icon: Video, title: "Téléconsultation", desc: "Consultations vidéo sécurisées avec partage de documents.", color: "text-primary bg-primary/10" },
  { icon: FlaskConical, title: "Laboratoire", desc: "Gestion des analyses, résultats et validation par le médecin.", color: "text-destructive bg-destructive/10" },
  { icon: Pill, title: "Pharmacie", desc: "Stock, ventes, alertes de rupture et liaison ordonnances.", color: "text-accent bg-accent/10" },
  { icon: Building2, title: "Multi-clinique", desc: "Architecture multi-tenant. Chaque clinique a son propre espace.", color: "text-primary bg-primary/10" },
  { icon: BarChart3, title: "Statistiques", desc: "Graphiques de revenus, fréquentation et performance en temps réel.", color: "text-warning bg-warning/10" },
  { icon: Shield, title: "Sécurité", desc: "Données chiffrées, rôles et permissions granulaires.", color: "text-accent bg-accent/10" },
  { icon: Smartphone, title: "Mobile", desc: "Interface responsive parfaitement adaptée aux smartphones.", color: "text-primary bg-primary/10" },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Tout ce dont votre clinique a besoin
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Une suite complète d'outils pour gérer votre établissement de santé efficacement.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-xl p-6 shadow-card hover:shadow-elevated transition-shadow border border-border group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.color} group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
