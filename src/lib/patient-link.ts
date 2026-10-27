export type LinkedPatient = { id: string; name: string };

export function nameForPatientId(patients: LinkedPatient[], patientId: string | null | undefined, fallback = "") {
  if (!patientId) return fallback;
  return patients.find((p) => p.id === patientId)?.name ?? fallback;
}

export function belongsToPatient(
  row: { patient_id?: string | null; patient_name: string },
  patient: LinkedPatient,
) {
  if (row.patient_id) return row.patient_id === patient.id;
  return row.patient_name === patient.name;
}
