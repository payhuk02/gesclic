import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Comment fonctionne l'essai gratuit ?",
    a: "Vous pouvez tester Gesclic gratuitement pendant 7 jours avec toutes les fonctionnalités du plan Pro. Aucune carte bancaire n'est requise. À la fin de l'essai, vous pouvez choisir le plan qui vous convient ou rester sur le plan Essentiel.",
  },
  {
    q: "Quels moyens de paiement sont acceptés ?",
    a: "Nous acceptons Orange Money, MTN Mobile Money, Moov Money, Wave, les cartes bancaires (Visa, Mastercard) et les virements bancaires. Les paiements se font en FCFA.",
  },
  {
    q: "Mes données médicales sont-elles sécurisées ?",
    a: "Absolument. Toutes les données sont chiffrées en transit et au repos. Nous respectons les normes internationales de protection des données de santé. Chaque clinique a son propre espace isolé.",
  },
  {
    q: "Puis-je utiliser Gesclic sur mobile ?",
    a: "Oui, Gesclic est entièrement responsive et fonctionne parfaitement sur smartphone, tablette et ordinateur. Pas besoin d'installer d'application, tout fonctionne depuis votre navigateur.",
  },
  {
    q: "Comment fonctionnent les rappels SMS et WhatsApp ?",
    a: "Gesclic envoie automatiquement des rappels de rendez-vous à vos patients par SMS ou WhatsApp. Vous pouvez configurer les délais (24h avant, 1h avant) et personnaliser les messages.",
  },
  {
    q: "Est-ce que Gesclic fonctionne hors connexion ?",
    a: "Oui ! Grâce à notre technologie Progressive Web App (PWA) et au stockage local sécurisé, Gesclic continue de fonctionner même en cas de coupure internet. Vous pouvez consulter les dossiers et saisir des actes, qui sont automatiquement synchronisés dès le rétablissement de la connexion.",
  },
  {
    q: "Comment fonctionne l'IA Médicale Gesclic ?",
    a: "Gesclic AI agit comme un copilote clinique d'aide à la décision. Elle analyse les symptômes saisis, vérifie automatiquement les interactions médicamenteuses avant impression d'ordonnance et génère des synthèses. Elle ne remplace jamais le médecin, qui garde l'entière autorité et la validation de chaque décision.",
  },
  {
    q: "Puis-je gérer plusieurs cliniques ?",
    a: "Oui, avec les plans Pro, Premium ou Sur mesure, vous pouvez administrer plusieurs établissements depuis un compte unique avec cloisonnement étanche des données, de la caisse et des équipes.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-16 sm:py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 sm:mb-14"
        >
          <Badge variant="outline" className="mb-3 px-3.5 py-1 text-primary border-primary/20 bg-primary/5">
            <HelpCircle className="w-3.5 h-3.5 mr-1.5" /> Centre d'aide & Réponses
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-3 sm:mb-4">
            Questions fréquentes
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground font-medium">
            Tout ce que vous devez savoir pour démarrer sereinement avec Gesclic.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-2.5 sm:space-y-3.5">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
              >
                <AccordionItem
                  value={`item-${i}`}
                  className="bg-card rounded-2xl border border-border/80 px-4 sm:px-6 shadow-card hover:shadow-elevated hover:border-primary/40 transition-all duration-200"
                >
                  <AccordionTrigger className="text-left text-foreground font-semibold text-sm sm:text-base hover:no-underline py-4">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed text-xs sm:text-sm font-medium pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
