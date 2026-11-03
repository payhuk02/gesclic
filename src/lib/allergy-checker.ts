/**
 * Moteur de détection croisée des allergies et contre-indications pharmacologiques
 */

export interface AllergyConflictResult {
  hasConflict: boolean;
  severity: "critical" | "warning";
  matchedAllergy?: string;
  matchedMedication?: string;
  message?: string;
}

interface AllergyGroup {
  name: string;
  allergyKeywords: string[];
  medicationKeywords: string[];
}

const ALLERGY_GROUPS: AllergyGroup[] = [
  {
    name: "Pénicillines / Bêtalactamines",
    allergyKeywords: ["penicilline", "penicillin", "betalactamine", "amoxicilline", "ampicilline", "augmentin"],
    medicationKeywords: [
      "penicilline",
      "penicillin",
      "amoxicilline",
      "amox",
      "ampicilline",
      "augmentin",
      "clamoxyl",
      "oxacilline",
      "cloxacilline",
      "ceftriaxone",
      "cephalosporine",
      "cefixime",
      "cefuroxime",
      "rocephine",
      "oracilline",
    ],
  },
  {
    name: "Aspirine & AINS (Anti-inflammatoires)",
    allergyKeywords: ["aspirine", "aspirin", "ains", "ibuprofene", "anti-inflammatoire", "diclofenac", "ketoprofene"],
    medicationKeywords: [
      "aspirine",
      "aspirin",
      "acide acetylsalicylique",
      "aspegic",
      "kardegic",
      "ibuprofene",
      "ibuprofen",
      "advil",
      "nurofen",
      "ketoprofene",
      "bi-profenid",
      "diclofenac",
      "voltarene",
      "naproxene",
      "celecoxib",
      "piroxicam",
      "indometacine",
    ],
  },
  {
    name: "Sulfamides & Cotrimoxazole",
    allergyKeywords: ["sulfamide", "sulfonamide", "sulfa", "bactrim", "cotrimoxazole"],
    medicationKeywords: ["bactrim", "cotrimoxazole", "sulfamethoxazole", "sulfadiazine", "sulfasalazine", "cotrim"],
  },
  {
    name: "Macrolides",
    allergyKeywords: ["macrolide", "erythromycine", "azithromycine", "clarithromycine"],
    medicationKeywords: ["azithromycine", "zithromax", "clarithromycine", "zeclar", "erythromycine", "josamycine"],
  },
  {
    name: "Fluoroquinolones",
    allergyKeywords: ["quinolone", "fluoroquinolone", "ciprofloxacine", "ofloxacine"],
    medicationKeywords: ["ciprofloxacine", "ciflox", "ofloxacine", "oflocet", "levofloxacine", "tavanic", "norfloxacine"],
  },
  {
    name: "Paracétamol",
    allergyKeywords: ["paracetamol", "acetaminophen", "doliprane", "efferalgan"],
    medicationKeywords: ["paracetamol", "doliprane", "efferalgan", "dafalgan", "perfalgan"],
  },
  {
    name: "Iode & Dérivés",
    allergyKeywords: ["iode", "iodé", "betadine"],
    medicationKeywords: ["betadine", "polyvidone iodee", "amiodarone", "cordarone"],
  },
];

const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .trim();
};

/**
 * Analyse si un médicament présente un conflit avec les allergies déclarées du patient
 */
export function checkAllergyConflict(
  patientAllergies: string | null | undefined,
  medicationName: string,
): AllergyConflictResult {
  if (!patientAllergies || !medicationName) {
    return { hasConflict: false, severity: "warning" };
  }

  const cleanAllergies = normalizeText(patientAllergies);
  if (!cleanAllergies || cleanAllergies === "aucune" || cleanAllergies === "neant" || cleanAllergies === "ras") {
    return { hasConflict: false, severity: "warning" };
  }

  const cleanMed = normalizeText(medicationName);
  if (!cleanMed) {
    return { hasConflict: false, severity: "warning" };
  }

  // 1. Détection directe si le nom de l'allergie apparaît dans le nom du médicament
  const allergyTokens = cleanAllergies.split(/\s+/).filter((t) => t.length >= 3);
  for (const token of allergyTokens) {
    if (cleanMed.includes(token)) {
      return {
        hasConflict: true,
        severity: "critical",
        matchedAllergy: token,
        matchedMedication: medicationName,
        message: `Alerte majeure : Le médicament « ${medicationName} » correspond directement à l'allergie déclarée « ${token} ».`,
      };
    }
  }

  // 2. Détection par groupe pharmacologique et classes croisées
  for (const group of ALLERGY_GROUPS) {
    const hasGroupAllergy = group.allergyKeywords.some((kw) =>
      cleanAllergies.includes(normalizeText(kw)),
    );

    if (hasGroupAllergy) {
      const medMatchesGroup = group.medicationKeywords.some((kw) =>
        cleanMed.includes(normalizeText(kw)),
      );

      if (medMatchesGroup) {
        return {
          hasConflict: true,
          severity: "critical",
          matchedAllergy: group.name,
          matchedMedication: medicationName,
          message: `Contre-indication : « ${medicationName} » appartient à la famille [${group.name}], signalée dans les allergies du patient (${patientAllergies}).`,
        };
      }
    }
  }

  return { hasConflict: false, severity: "warning" };
}
