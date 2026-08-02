export type ClinicPlanId = 'free' | 'pro' | 'enterprise';

export interface ClinicPlanDefinition {
  id: ClinicPlanId;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  limitations: string[];
  popular?: boolean;
}

export const CLINIC_PLANS: ClinicPlanDefinition[] = [
  {
    id: 'free',
    name: 'Gratuit',
    price: '0',
    period: 'pour toujours',
    description: 'Idéal pour tester la plateforme',
    features: ['1 médecin', '50 patients max', 'Rendez-vous basiques', 'Tableau de bord simple', 'Support email'],
    limitations: ['Pas de SMS/WhatsApp', 'Pas de vidéo', 'Pas d\'export PDF'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '29 900',
    period: '/ mois',
    description: 'Pour les cliniques en croissance',
    features: [
      'Médecins illimités',
      'Patients illimités',
      'Téléconsultation vidéo',
      'Rappels automatiques',
      'Rapports avancés',
      'Multi-utilisateurs',
      'API Access',
      'Support dédié',
    ],
    limitations: [],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Entreprise',
    price: 'Sur devis',
    period: '',
    description: 'Pour les grands centres de santé',
    features: [
      'Multi-cliniques',
      'SSO / LDAP',
      'Intégrations sur mesure',
      'Formation sur site',
      'SLA garanti',
      'Conformité RGPD+',
      'Account manager',
    ],
    limitations: [],
  },
];

export function getClinicPlan(planId: string | null | undefined): ClinicPlanDefinition {
  return CLINIC_PLANS.find((p) => p.id === planId) ?? CLINIC_PLANS[0];
}

export function isClinicPlanId(value: string): value is ClinicPlanId {
  return value === 'free' || value === 'pro' || value === 'enterprise';
}
