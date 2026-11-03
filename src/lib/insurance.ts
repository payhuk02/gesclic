/**
 * Gestion du Tiers-Payant, Assurances et Mutuelles de santé
 */

export interface InsuranceDetails {
  insuranceName: string;
  policyNumber?: string;
  coveragePercentage: number; // Ex: 80 pour 80%
  insuranceShare: number; // Part prise en charge par l'assurance (FCFA)
  patientShare: number; // Ticket modérateur à la charge du patient (FCFA)
}

/**
 * Calcule la répartition entre part assurance et ticket modérateur patient
 */
export function computeInsuranceSplit(
  totalAmount: number,
  coveragePercentage: number,
): { insuranceShare: number; patientShare: number } {
  const safeAmount = Math.max(0, totalAmount || 0);
  const safePercent = Math.max(0, Math.min(100, Number(coveragePercentage) || 0));

  const insuranceShare = Math.round((safeAmount * safePercent) / 100);
  const patientShare = Math.max(0, safeAmount - insuranceShare);

  return { insuranceShare, patientShare };
}

const INSURANCE_PREFIX = "[Prise en charge Assurance :";
const INSURANCE_TAG_REGEX = /\[Prise en charge Assurance : (.*?) \((\d+)%\)(?: - N° (.*?))? \| Part Assurance : ([\d\s]+) FCFA \| Part Patient : ([\d\s]+) FCFA\]/;

/**
 * Enregistre les détails de l'assurance dans la description du paiement de manière rétrocompatible
 */
export function encodeInsuranceDescription(
  baseDescription: string,
  details: {
    insuranceName: string;
    policyNumber?: string;
    coveragePercentage: number;
    insuranceShare: number;
    patientShare: number;
  },
): string {
  if (!details.insuranceName || details.coveragePercentage <= 0) {
    return baseDescription.trim();
  }

  const numPart = details.policyNumber ? ` - N° ${details.policyNumber.trim()}` : "";
  const tag = `[Prise en charge Assurance : ${details.insuranceName.trim()} (${details.coveragePercentage}%)${numPart} | Part Assurance : ${details.insuranceShare.toLocaleString()} FCFA | Part Patient : ${details.patientShare.toLocaleString()} FCFA]`;

  return baseDescription ? `${tag} ${baseDescription.trim()}` : tag;
}

/**
 * Décode les informations d'assurance depuis le champ description
 */
export function extractInsuranceFromDescription(description: string | null | undefined): {
  insurance: InsuranceDetails | null;
  cleanDescription: string;
} {
  if (!description) {
    return { insurance: null, cleanDescription: "" };
  }

  const match = description.match(INSURANCE_TAG_REGEX);
  if (!match) {
    return { insurance: null, cleanDescription: description.trim() };
  }

  const [fullMatch, name, percentStr, policyNum, insShareStr, patShareStr] = match;
  const cleanDescription = description.replace(fullMatch, "").trim();

  const parseNum = (str: string) => Number(str.replace(/\s/g, "")) || 0;

  return {
    insurance: {
      insuranceName: name,
      policyNumber: policyNum ? policyNum.trim() : undefined,
      coveragePercentage: Number(percentStr) || 0,
      insuranceShare: parseNum(insShareStr),
      patientShare: parseNum(patShareStr),
    },
    cleanDescription,
  };
}
