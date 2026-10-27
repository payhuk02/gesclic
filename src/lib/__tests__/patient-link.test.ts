import { describe, expect, it } from "vitest";
import { belongsToPatient, nameForPatientId } from "../patient-link";

const patients = [
  { id: "uuid-1", name: "Awa Traore" },
  { id: "uuid-2", name: "Awa Traore" },
];

describe("patient-link", () => {
  it("prefers UUID over homonym names", () => {
    expect(belongsToPatient({ patient_id: "uuid-2", patient_name: "Awa Traore" }, patients[0])).toBe(false);
    expect(belongsToPatient({ patient_id: "uuid-2", patient_name: "Awa Traore" }, patients[1])).toBe(true);
  });

  it("falls back to name when UUID is missing", () => {
    expect(belongsToPatient({ patient_id: null, patient_name: "Awa Traore" }, patients[0])).toBe(true);
  });

  it("resolves display name from id", () => {
    expect(nameForPatientId(patients, "uuid-1", "x")).toBe("Awa Traore");
    expect(nameForPatientId(patients, null, "x")).toBe("x");
  });
});
