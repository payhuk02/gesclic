import { describe, it, expect } from "vitest";
import { checkAllergyConflict } from "../allergy-checker";

describe("Allergy Checker", () => {
  it("should return no conflict when patient has no allergies", () => {
    expect(checkAllergyConflict("Aucune", "Amoxicilline 500mg").hasConflict).toBe(false);
    expect(checkAllergyConflict("", "Paracétamol").hasConflict).toBe(false);
    expect(checkAllergyConflict(null, "Aspirine").hasConflict).toBe(false);
  });

  it("should detect direct cross-allergy between penicillin and amoxicillin", () => {
    const res = checkAllergyConflict("Pénicilline", "Amoxicilline 1g");
    expect(res.hasConflict).toBe(true);
    expect(res.severity).toBe("critical");
    expect(res.matchedAllergy).toContain("Pénicillines");
  });

  it("should detect Augmentin conflict with penicillin allergy", () => {
    const res = checkAllergyConflict("Allergique à la pénicilline", "Augmentin comprimés");
    expect(res.hasConflict).toBe(true);
    expect(res.severity).toBe("critical");
  });

  it("should detect NSAID / Aspirin conflict", () => {
    const res1 = checkAllergyConflict("Aspirine", "Kardégic 75mg");
    expect(res1.hasConflict).toBe(true);

    const res2 = checkAllergyConflict("AINS", "Ibuprofène 400mg");
    expect(res2.hasConflict).toBe(true);
  });

  it("should detect Sulfamide conflict with Bactrim", () => {
    const res = checkAllergyConflict("Sulfamides", "Bactrim Forte");
    expect(res.hasConflict).toBe(true);
  });

  it("should not flag conflict for safe unrelated medications", () => {
    const res = checkAllergyConflict("Pénicilline", "Paracétamol 1g");
    expect(res.hasConflict).toBe(false);
  });
});
