import { describe, it, expect } from "vitest";
import { calculateBMI, encodeVitalsToNotes, extractVitalsFromNotes } from "../vitals";

describe("Vitals & BMI calculation", () => {
  it("should calculate BMI correctly and return proper classification", () => {
    // 70 kg, 175 cm -> 70 / (1.75^2) = 22.86 -> 22.9 (Normal)
    const normal = calculateBMI(70, 175);
    expect(normal).not.toBeNull();
    expect(normal?.bmi).toBe(22.9);
    expect(normal?.category).toBe("Normal");

    // 90 kg, 170 cm -> 90 / (1.7^2) = 31.14 -> 31.1 (Obésité modérée)
    const obese = calculateBMI(90, 170);
    expect(obese?.category).toBe("Obésité modérée");

    // 45 kg, 170 cm -> 45 / (1.7^2) = 15.57 -> 15.6 (Dénutrition)
    const lean = calculateBMI(45, 170);
    expect(lean?.category).toBe("Dénutrition");
  });

  it("should return null when weight or height is invalid", () => {
    expect(calculateBMI(null, 170)).toBeNull();
    expect(calculateBMI(70, 0)).toBeNull();
    expect(calculateBMI(-50, 170)).toBeNull();
  });

  it("should encode and decode vitals transparently with clinical notes", () => {
    const vitals = {
      bp_systolic: 120,
      bp_diastolic: 80,
      heart_rate: 72,
      temperature: 37.1,
      spo2: 99,
      weight: 75,
      height: 180,
    };
    const clinicalNote = "Patient en bonne forme générale. Pas de toux ni de fièvre.";

    const encoded = encodeVitalsToNotes(vitals, clinicalNote);
    expect(encoded).toContain("TA: 120/80 mmHg");
    expect(encoded).toContain("IMC: 23.1 kg/m²");

    const decoded = extractVitalsFromNotes(encoded);
    expect(decoded.cleanNotes).toBe(clinicalNote);
    expect(decoded.vitals?.bp_systolic).toBe(120);
    expect(decoded.vitals?.bp_diastolic).toBe(80);
    expect(decoded.vitals?.heart_rate).toBe(72);
    expect(decoded.vitals?.bmi).toBe(23.1);
  });

  it("should handle raw notes without vitals gracefully", () => {
    const raw = "Simple observation médicale classique.";
    const decoded = extractVitalsFromNotes(raw);
    expect(decoded.vitals).toBeNull();
    expect(decoded.cleanNotes).toBe(raw);
  });
});
