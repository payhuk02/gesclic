import { describe, it, expect } from "vitest";
import {
  computeInsuranceSplit,
  encodeInsuranceDescription,
  extractInsuranceFromDescription,
} from "../insurance";

describe("Insurance / Tiers-Payant Engine", () => {
  it("should compute 80% coverage on 25 000 FCFA correctly", () => {
    const split = computeInsuranceSplit(25000, 80);
    expect(split.insuranceShare).toBe(20000);
    expect(split.patientShare).toBe(5000);
  });

  it("should handle 100% coverage (100% insurance, 0 patient)", () => {
    const split = computeInsuranceSplit(15000, 100);
    expect(split.insuranceShare).toBe(15000);
    expect(split.patientShare).toBe(0);
  });

  it("should handle 0% coverage (0 insurance, 100% patient)", () => {
    const split = computeInsuranceSplit(15000, 0);
    expect(split.insuranceShare).toBe(0);
    expect(split.patientShare).toBe(15000);
  });

  it("should encode and decode insurance tag in description transparently", () => {
    const baseDesc = "Consultation générale et ECG";
    const details = {
      insuranceName: "CNAM",
      policyNumber: "POL-99214",
      coveragePercentage: 70,
      insuranceShare: 14000,
      patientShare: 6000,
    };

    const encoded = encodeInsuranceDescription(baseDesc, details);
    expect(encoded).toContain("CNAM (70%)");
    expect(encoded).toMatch(/Part Assurance :\s*14[\s\u202f]000 FCFA/);
    expect(encoded).toMatch(/Part Patient :\s*6[\s\u202f]000 FCFA/);

    const decoded = extractInsuranceFromDescription(encoded);
    expect(decoded.cleanDescription).toBe(baseDesc);
    expect(decoded.insurance?.insuranceName).toBe("CNAM");
    expect(decoded.insurance?.policyNumber).toBe("POL-99214");
    expect(decoded.insurance?.coveragePercentage).toBe(70);
    expect(decoded.insurance?.insuranceShare).toBe(14000);
    expect(decoded.insurance?.patientShare).toBe(6000);
  });

  it("should handle regular descriptions without insurance tags", () => {
    const raw = "Paiement direct en espèces pour analyses sanguines";
    const decoded = extractInsuranceFromDescription(raw);
    expect(decoded.insurance).toBeNull();
    expect(decoded.cleanDescription).toBe(raw);
  });
});
