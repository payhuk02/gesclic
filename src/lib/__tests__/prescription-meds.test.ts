import { describe, expect, it } from "vitest";
import { formatFcfaDot, parsePrescriptionMeds, prescriptionTotal } from "../prescription-meds";

describe("parsePrescriptionMeds", () => {
  it("parses legacy comma-separated names", () => {
    const meds = parsePrescriptionMeds("Paracetamol, Amoxicilline");
    expect(meds).toHaveLength(2);
    expect(meds[0].name).toBe("Paracetamol");
    expect(meds[0].unitPrice).toBe(0);
  });

  it("parses structured JSON and totals", () => {
    const meds = parsePrescriptionMeds(
      JSON.stringify([
        { name: "Amox", dosage: "500mg", quantity: 2, unitPrice: 1500 },
        { name: "Para", quantity: 1, unitPrice: 500 },
      ]),
    );
    expect(prescriptionTotal(meds)).toBe(3500);
  });
});

describe("formatFcfaDot", () => {
  it("groups thousands with a dot", () => {
    expect(formatFcfaDot(1000)).toBe("1.000");
    expect(formatFcfaDot(1100)).toBe("1.100");
    expect(formatFcfaDot(100)).toBe("100");
  });
});
