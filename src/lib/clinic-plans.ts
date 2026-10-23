export type ClinicPlanId = 'essentiel' | 'pro' | 'premium' | 'custom';

/** Billing commitment in months */
export type BillingPeriodMonths = 1 | 3 | 6 | 12;

export interface ClinicPlanDefinition {
  id: ClinicPlanId;
  name: string;
  /** Monthly list price in FCFA (null = custom quote) */
  monthlyPrice: number | null;
  description: string;
  features: string[];
  limitations: string[];
  popular?: boolean;
  contactSales?: boolean;
}

/** Discount applied when paying N months upfront */
export const BILLING_PERIODS: {
  months: BillingPeriodMonths;
  label: string;
  discountPercent: number;
}[] = [
  { months: 1, label: '1 mois', discountPercent: 0 },
  { months: 3, label: '3 mois', discountPercent: 10 },
  { months: 6, label: '6 mois', discountPercent: 20 },
  { months: 12, label: '12 mois', discountPercent: 30 },
];

export const CLINIC_PLANS: ClinicPlanDefinition[] = [
  {
    id: 'essentiel',
    name: 'Essentiel',
    monthlyPrice: 5900,
    description: 'Idéal pour démarrer un cabinet',
    features: [
      '2 utilisateurs',
      '200 patients',
      'Rendez-vous & dossiers',
      'Ordonnances + export PDF',
      'Support email',
    ],
    limitations: ['Pas de télémédecine', 'Pas d’API'],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 7500,
    description: 'Pour les cliniques en croissance',
    features: [
      '10 utilisateurs',
      'Patients illimités',
      'Labo, pharmacie & paiements',
      'Télémédecine',
      'Rappels & rapports',
      'Multi-rôles',
      'Support prioritaire',
    ],
    limitations: [],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    monthlyPrice: 12500,
    description: 'Pour les centres multi-spécialités',
    features: [
      'Utilisateurs illimités',
      'Tout le plan Pro',
      'API, webhooks & workflows',
      'Analytics avancés',
      'Multi-cliniques (limité)',
      'SLA & onboarding assisté',
    ],
    limitations: [],
  },
  {
    id: 'custom',
    name: 'Sur mesure',
    monthlyPrice: null,
    description: 'Réseaux de cliniques & besoins spécifiques',
    features: [
      'Volume illimité',
      'SSO / intégrations custom',
      'Formation sur site',
      'Account manager dédié',
      'Conformité renforcée',
    ],
    limitations: [],
    contactSales: true,
  },
];

/** Legacy DB values mapped to current plan ids */
const LEGACY_PLAN_MAP: Record<string, ClinicPlanId> = {
  free: 'essentiel',
  gratuit: 'essentiel',
  standard: 'essentiel',
  basique: 'essentiel',
  enterprise: 'custom',
  entreprise: 'custom',
};

export function normalizeClinicPlanId(value: string | null | undefined): ClinicPlanId {
  if (!value) return 'essentiel';
  if (isClinicPlanId(value)) return value;
  return LEGACY_PLAN_MAP[value] ?? 'essentiel';
}

export function isClinicPlanId(value: string): value is ClinicPlanId {
  return value === 'essentiel' || value === 'pro' || value === 'premium' || value === 'custom';
}

export function getClinicPlan(planId: string | null | undefined): ClinicPlanDefinition {
  const id = normalizeClinicPlanId(planId);
  return CLINIC_PLANS.find((p) => p.id === id) ?? CLINIC_PLANS[0];
}

export function getBillingPeriod(months: BillingPeriodMonths) {
  return BILLING_PERIODS.find((p) => p.months === months) ?? BILLING_PERIODS[0];
}

export function formatFcfa(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount));
}

/**
 * Total to pay for a plan over `months`, with upfront discount.
 * Returns null for custom / quote plans.
 */
export function computePlanTotal(
  monthlyPrice: number | null,
  months: BillingPeriodMonths,
): { total: number; monthlyEquivalent: number; discountPercent: number; savings: number } | null {
  if (monthlyPrice == null) return null;
  const { discountPercent } = getBillingPeriod(months);
  const listTotal = monthlyPrice * months;
  const total = Math.round(listTotal * (1 - discountPercent / 100));
  const monthlyEquivalent = Math.round(total / months);
  const savings = listTotal - total;
  return { total, monthlyEquivalent, discountPercent, savings };
}
