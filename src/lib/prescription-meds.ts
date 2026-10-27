export interface PrescriptionMedication {
  name: string;
  dosage: string;
  quantity: number;
  unitPrice: number;
}

export function parsePrescriptionMeds(raw: unknown): PrescriptionMedication[] {
  if (raw == null || raw === "") return [];
  let value: unknown = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((name) => ({ name, dosage: "", quantity: 1, unitPrice: 0 }));
    }
  }
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (typeof item === "string") {
      return { name: item, dosage: "", quantity: 1, unitPrice: 0 };
    }
    const row = item as Partial<PrescriptionMedication>;
    const quantity = Math.max(1, Number(row.quantity) || 1);
    const unitPrice = Math.max(0, Number(row.unitPrice) || 0);
    return {
      name: String(row.name ?? "").trim(),
      dosage: String(row.dosage ?? "").trim(),
      quantity,
      unitPrice,
    };
  }).filter((m) => m.name);
}

export function medicationLineTotal(m: PrescriptionMedication) {
  return m.quantity * m.unitPrice;
}

export function prescriptionTotal(meds: PrescriptionMedication[]) {
  return meds.reduce((sum, m) => sum + medicationLineTotal(m), 0);
}

export function medicationLabel(m: PrescriptionMedication | string) {
  if (typeof m === "string") return m;
  return m.dosage ? `${m.name} (${m.dosage})` : m.name;
}

/** Thousands separator with a dot (1.000) — jsPDF cannot print fr-FR narrow spaces. */
export function formatFcfaDot(amount: number) {
  const n = Math.round(Number(amount) || 0);
  const negative = n < 0;
  const digits = String(Math.abs(n));
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return negative ? `-${grouped}` : grouped;
}
