export const GENERAL_SITE_DEFAULTS = {
  platformName: "Gesclic",
  platformUrl: "https://gesclic.com",
  supportEmail: "support@gesclic.com",
  phone: "",
  address: "Ouagadougou, Burkina Faso",
  tagline: "La plateforme de gestion médicale conçue pour l'Afrique.",
  footerNote: "Tous droits réservés.",
  maintenanceMode: false,
  registrationEnabled: true,
  requireEmailVerification: true,
  defaultPlan: "essentiel",
};

export type GeneralSiteSettings = typeof GENERAL_SITE_DEFAULTS;

export const LEGAL_SITE_DEFAULTS = {
  privacyTitle: "Politique de confidentialité",
  privacyBody: `Gesclic traite les données de santé et d'identité des patients pour le compte des cliniques clientes, en qualité de sous-traitant.

**Données collectées** — comptes utilisateurs, journaux de connexion, données cliniques saisies par l'établissement, paiements d'abonnement.

**Finalités** — fourniture du service SaaS, sécurité, facturation, support.

**Conservation** — pendant la durée du contrat, puis selon les obligations légales applicables.

**Droits** — accès, rectification, suppression et portabilité. Contactez le DPO de votre clinique ou écrivez à l'adresse support indiquée en pied de page.

**Transferts** — hébergement cloud (Union européenne). Aucune revente des données patients.`,
  termsTitle: "Conditions générales d'utilisation",
  termsBody: `L'accès à Gesclic implique l'acceptation des présentes CGU.

**Compte** — l'administrateur de clinique est responsable des utilisateurs qu'il invite et des données saisies.

**Essai** — 7 jours d'essai Pro, sans carte bancaire. À l'issue, le plan Essentiel s'applique sauf abonnement payé.

**Disponibilité** — service fourni en l'état, avec maintenance éventuelle. Gesclic n'est pas un dispositif médical de diagnostic autonome : l'IA assiste le praticien, qui reste responsable des décisions cliniques.

**Résiliation** — l'abonnement peut être interrompu ; les données restent exportables selon le contrat.

**Droit applicable** — Burkina Faso, sous réserve des règles impératives du pays d'établissement.`,
  rgpdTitle: "Protection des données (RGPD / données de santé)",
  rgpdBody: `Gesclic s'aligne sur les principes du RGPD (licéité, minimisation, sécurité, droits des personnes) et sur les exigences de confidentialité des données de santé.

**Mesures** — chiffrement en transit, contrôle d'accès par rôles, journal d'audit, authentification (dont 2FA).

**Sous-traitance** — chaque clinique reste responsable de traitement pour son dossier patient. Gesclic agit sur instruction.

**Incidents** — notification selon la procédure interne et, le cas échéant, aux autorités compétentes.

Pour exercer un droit ou signaler un incident, utilisez la page Contact.`,
  docsTitle: "Documentation",
  docsBody: `**Démarrage**
1. Créez un compte et votre clinique (essai Pro 7 jours).
2. Invitez médecins, secrétaires et infirmiers.
3. Ajoutez des patients, planifiez des rendez-vous, rédigez dossiers et ordonnances.

**Modules**
- Patients, rendez-vous, dossiers médicaux, laboratoire, pharmacie
- Télémédecine, paiements, rapports
- Abonnements (Orange Money, Wave, MTN, Moov, carte)

**Sécurité**
Activez la 2FA depuis Sécurité. Les rôles limitent l'accès aux données.

**Aide**
Consultez la FAQ sur la page d'accueil ou contactez le support.`,
  contactTitle: "Contact",
  contactBody: `Pour toute question commerciale, technique ou relative aux données personnelles, écrivez-nous.

Un administrateur de clinique peut aussi ouvrir un ticket depuis l'espace connecté (support).`,
};

export type LegalSiteSettings = typeof LEGAL_SITE_DEFAULTS;

export const LEGAL_PAGES = [
  { slug: "confidentialite", path: "/confidentialite", titleKey: "privacyTitle", bodyKey: "privacyBody", nav: "Confidentialité" },
  { slug: "cgu", path: "/cgu", titleKey: "termsTitle", bodyKey: "termsBody", nav: "CGU" },
  { slug: "rgpd", path: "/rgpd", titleKey: "rgpdTitle", bodyKey: "rgpdBody", nav: "RGPD" },
  { slug: "documentation", path: "/documentation", titleKey: "docsTitle", bodyKey: "docsBody", nav: "Documentation" },
  { slug: "contact", path: "/contact", titleKey: "contactTitle", bodyKey: "contactBody", nav: "Contact" },
] as const;

export type LegalSlug = (typeof LEGAL_PAGES)[number]["slug"];
