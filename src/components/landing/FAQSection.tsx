import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Comment fonctionne l'essai gratuit ?",
    a: "Vous pouvez tester Gesclic gratuitement pendant 14 jours avec toutes les fonctionnalités du plan Pro. Aucune carte bancaire n'est requise. À la fin de l'essai, vous pouvez choisir le plan qui vous convient ou rester sur le plan gratuit.",
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
    a: "Les fonctionnalités essentielles comme la consultation de fiches patients et la prise de rendez-vous fonctionnent avec une connexion internet minimale. Nous travaillons sur un mode hors ligne complet.",
  },
  {
    q: "Puis-je gérer plusieurs cliniques ?",
    a: "Oui, avec le plan Pro ou Entreprise, vous pouvez gérer plusieurs établissements depuis un seul compte. Chaque clinique a son propre espace avec ses données, son personnel et son branding.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Questions fréquentes
          </h2>
          <p className="text-muted-foreground text-lg">
            Tout ce que vous devez savoir sur Gesclic.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="bg-card rounded-xl border border-border px-6 shadow-card">
                <AccordionTrigger className="text-left text-foreground font-medium hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
