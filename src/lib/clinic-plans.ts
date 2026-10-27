export type ClinicPlanId = 'essentiel' | 'pro' | 'premium' | 'custom';

/** Self-serve Pro trial length (must match SQL handle_new_user). */
export const TRIAL_DAYS = 7;

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

export interface PlanPricingBreakdown {
  /** Base monthly catalogue price */
  monthlyPrice: number;
  months: BillingPeriodMonths;
  /** monthlyPrice × months (before discount) */
  listTotal: number;
  /** Amount to pay after discount */
  total: number;
  /** total / months (effective monthly rate) */
  monthlyEquivalent: number;
  discountPercent: number;
  savings: number;
}

/** Discount applied when paying N months upfront */
export const BILLING_PERIODS: {
  months: BillingPeriodMonths;
  label: string;
  shortLabel: string;
  discountPercent: number;
}[] = [
  { months: 1, label: 'Mensuel', shortLabel: 'Mensuel', discountPercent: 0 },
  { months: 3, label: 'Trimestriel', shortLabel: 'Trimestriel', discountPercent: 10 },
  { months: 6, label: 'Semestriel', shortLabel: 'Semestriel', discountPercent: 20 },
  { months: 12, label: 'Annuel', shortLabel: 'Annuel', discountPercent: 30 },
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

export function getTrialDaysRemaining(trialEndsAt: string | null | undefined): number | null {
  if (!trialEndsAt) return null;
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  if (ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export function isTrialActive(trialEndsAt: string | null | undefined): boolean {
  const days = getTrialDaysRemaining(trialEndsAt);
  return days !== null && days > 0;
}

export function isPaidSubscriptionActive(subscriptionEndsAt: string | null | undefined): boolean {
  if (!subscriptionEndsAt) return false;
  const t = new Date(subscriptionEndsAt).getTime();
  return !Number.isNaN(t) && t > Date.now();
}

/** Plan actually granted: Pro during trial, stored plan while paid, Essentiel after expiry. */
export function effectiveClinicPlan(clinic: {
  plan?: string | null;
  trial_ends_at?: string | null;
  subscription_ends_at?: string | null;
}): ClinicPlanId {
  if (isPaidSubscriptionActive(clinic.subscription_ends_at)) {
    return normalizeClinicPlanId(clinic.plan);
  }
  if (isTrialActive(clinic.trial_ends_at)) return 'pro';
  if (clinic.trial_ends_at || clinic.subscription_ends_at) return 'essentiel';
  return normalizeClinicPlanId(clinic.plan);
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
 * Automatic plan pricing (Acoschool-style):
 * listTotal = monthly × months
 * total = listTotal × (1 − discount%)
 * monthlyEquivalent = total / months
 */
export function computePlanTotal(
  monthlyPrice: number | null,
  months: BillingPeriodMonths,
): PlanPricingBreakdown | null {
  if (monthlyPrice == null) return null;
  const { discountPercent } = getBillingPeriod(months);
  const listTotal = monthlyPrice * months;
  const total = Math.round(listTotal * (1 - discountPercent / 100));
  const monthlyEquivalent = Math.round(total / months);
  const savings = listTotal - total;
  return {
    monthlyPrice,
    months,
    listTotal,
    total,
    monthlyEquivalent,
    discountPercent,
    savings,
  };
}

/** Display helper for cards: headline + supporting lines */
export function formatPlanPriceLines(pricing: PlanPricingBreakdown, periodLabel: string) {
  if (pricing.months === 1) {
    return {
      headline: formatFcfa(pricing.monthlyPrice),
      strike: null as string | null,
      detail: `${formatFcfa(pricing.monthlyPrice)} FCFA / mois`,
    };
  }
  return {
    headline: formatFcfa(pricing.total),
    strike: `${formatFcfa(pricing.listTotal)} FCFA`,
    detail: `soit ~${formatFcfa(pricing.monthlyEquivalent)} FCFA / mois · ${periodLabel} (−${pricing.discountPercent} %)`,
  };
}
