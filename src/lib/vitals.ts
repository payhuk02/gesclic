/**
 * Module clinique de gestion des constantes vitales et calcul de l'IMC
 */

export interface VitalSigns {
  bp_systolic?: number; // Tension systolique mmHg
  bp_diastolic?: number; // Tension diastolique mmHg
  heart_rate?: number; // Pouls / fréquence cardiaque bpm
  temperature?: number; // Température °C
  spo2?: number; // Saturation O2 %
  weight?: number; // Poids kg
  height?: number; // Taille cm
  bmi?: number; // Indice de masse corporelle kg/m²
  bmi_category?: string;
}

export interface BMIEvaluation {
  bmi: number;
  category: string;
  color: string; // Tailwind color class
  description: string;
}

/**
 * Calcule l'Indice de Masse Corporelle (IMC) et retourne la classification OMS
 */
export function calculateBMI(weightKg?: number | null, heightCm?: number | null): BMIEvaluation | null {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) {
    return null;
  }

  const heightM = heightCm / 100;
  const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));

  if (bmi < 16.5) {
    return {
      bmi,
      category: "Dénutrition",
      color: "text-amber-600 bg-amber-500/10 border-amber-500/20",
      description: "Poids insuffisant sévère",
    };
  }
  if (bmi < 18.5) {
    return {
      bmi,
      category: "Maigreur",
      color: "text-yellow-600 bg-yellow-500/10 border-yellow-500/20",
      description: "Insuffisance pondérale",
    };
  }
  if (bmi < 25.0) {
    return {
      bmi,
      category: "Normal",
      color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
      description: "Corpulence normale",
    };
  }
  if (bmi < 30.0) {
    return {
      bmi,
      category: "Surpoids",
      color: "text-orange-600 bg-orange-500/10 border-orange-500/20",
      description: "Surcharge pondérale",
    };
  }
  if (bmi < 35.0) {
    return {
      bmi,
      category: "Obésité modérée",
      color: "text-rose-600 bg-rose-500/10 border-rose-500/20",
      description: "Obésité classe 1",
    };
  }
  return {
    bmi,
    category: "Obésité sévère",
    color: "text-destructive bg-destructive/10 border-destructive/20",
    description: "Obésité classe 2/3",
  };
}

const VITALS_HEADER = "--- CONSTANTES VITALES ---";
const VITALS_FOOTER = "--- FIN CONSTANTES ---";

/**
 * Encode les constantes vitales au début du champ notes de façon lisible et parseable
 */
export function encodeVitalsToNotes(vitals: VitalSigns, notes: string): string {
  const parts: string[] = [];

  if (vitals.bp_systolic && vitals.bp_diastolic) {
    parts.push(`TA: ${vitals.bp_systolic}/${vitals.bp_diastolic} mmHg`);
  }
  if (vitals.heart_rate) {
    parts.push(`FC: ${vitals.heart_rate} bpm`);
  }
  if (vitals.temperature) {
    parts.push(`T°: ${vitals.temperature} °C`);
  }
  if (vitals.spo2) {
    parts.push(`SpO2: ${vitals.spo2}%`);
  }
  if (vitals.weight) {
    parts.push(`Poids: ${vitals.weight} kg`);
  }
  if (vitals.height) {
    parts.push(`Taille: ${vitals.height} cm`);
  }

  const bmiEval = calculateBMI(vitals.weight, vitals.height);
  if (bmiEval) {
    parts.push(`IMC: ${bmiEval.bmi} kg/m² (${bmiEval.category})`);
  }

  if (parts.length === 0) {
    return notes.trim();
  }

  const rawJson = JSON.stringify({
    ...vitals,
    bmi: bmiEval?.bmi,
    bmi_category: bmiEval?.category,
  });

  const vitalsBlock = `${VITALS_HEADER}\n${parts.join(" · ")}\n<!--vitals:${rawJson}-->\n${VITALS_FOOTER}`;
  const cleanNotes = notes ? notes.trim() : "";

  return cleanNotes ? `${vitalsBlock}\n\n${cleanNotes}` : vitalsBlock;
}

/**
 * Extrait les constantes vitales et les notes cliniques d'un texte
 */
export function extractVitalsFromNotes(rawText: string | null | undefined): {
  vitals: VitalSigns | null;
  cleanNotes: string;
} {
  if (!rawText) {
    return { vitals: null, cleanNotes: "" };
  }

  const jsonMatch = rawText.match(/<!--vitals:(.*?)-->/);
  if (jsonMatch && jsonMatch[1]) {
    try {
      const parsed = JSON.parse(jsonMatch[1]) as VitalSigns;
      const cleanNotes = rawText
        .replace(new RegExp(`${VITALS_HEADER}[\\s\\S]*?${VITALS_FOOTER}\\n*`, "g"), "")
        .trim();
      return { vitals: parsed, cleanNotes };
    } catch {
      // Fallback
    }
  }

  return { vitals: null, cleanNotes: rawText.trim() };
}
