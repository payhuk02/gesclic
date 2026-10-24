import { motion } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  WifiOff,
  KeyRound,
  DatabaseBackup,
  UserCheck,
  CheckCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const securityFeatures = [
  {
    icon: Lock,
    title: "Chiffrement AES-256 de bout en bout",
    desc: "Les données de santé et dossiers patients sont chiffrés au repos et en transit avec les protocoles cryptographiques les plus stricts.",
  },
  {
    icon: WifiOff,
    title: "Résilience réseau & Mode Hors-ligne PWA",
    desc: "L'application reste opérationnelle même lors de coupures internet et synchronise automatiquement vos données dès le rétablissement du réseau.",
  },
  {
    icon: KeyRound,
    title: "Double Authentification (MFA / 2FA)",
    desc: "Accès protégé par mot de passe robuste et code temporaire à usage unique pour empêcher toute intrusion non autorisée.",
  },
  {
    icon: UserCheck,
    title: "Gestion des accès basée sur les rôles (RBAC)",
    desc: "Cloisonnement étanche : le médecin accède aux diagnostics, la secrétaire gère les rendez-vous, le caissier valide les paiements.",
  },
  {
    icon: DatabaseBackup,
    title: "Sauvegardes automatisées quotidiennes",
    desc: "Sauvegardes chiffrées automatiques chaque nuit avec réplication multirégionale et point de restauration instantané.",
  },
  {
    icon: ShieldCheck,
    title: "Isolation totale des données (Multi-Tenant)",
    desc: "Chaque clinique dispose de son propre périmètre sécurisé, sans risque de fuite ou de croisement de données entre établissements.",
  },
];

const SecurityComplianceSection = () => {
  return (
    <section id="security" className="py-16 sm:py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
          <Badge variant="outline" className="mb-3 px-3.5 py-1 text-success border-success/30 bg-success/5">
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Sécurité & Conformité Données de Santé
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground tracking-tight mb-4">
            La sécurité de vos données médicales est notre priorité absolue
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Nous appliquons les standards internationaux les plus rigoureux pour garantir le secret médical et la continuité de service de votre clinique.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {securityFeatures.map((sec, i) => (
            <motion.div
              key={sec.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="bg-card rounded-2xl p-6 border border-border hover:border-primary/30 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between items-center text-center group"
            >
              <div className="flex flex-col items-center w-full">
                <div className="mb-4 text-emerald-600 dark:text-emerald-400 flex justify-center">
                  <sec.icon className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.75} />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground mb-2 text-center">
                  {sec.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-center">
                  {sec.desc}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-border flex items-center justify-center gap-1.5 text-xs font-medium text-success w-full">
                <CheckCircle className="w-4 h-4" />
                <span>Norme active & vérifiée</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SecurityComplianceSection;
