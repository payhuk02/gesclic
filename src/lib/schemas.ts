import { z } from "zod";

// Patient schema
export const patientSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().min(10, "Numéro de téléphone invalide").max(20),
  sex: z.enum(["M", "F", "Autre"], { required_error: "Le sexe est requis" }),
  dob: z.string().refine((val: string) => !isNaN(Date.parse(val)), "Date de naissance invalide"),
  blood_group: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], {
    required_error: "Le groupe sanguin est requis",
  }),
  allergies: z.string().max(500).optional().or(z.literal("")),
});

export type PatientFormData = z.infer<typeof patientSchema>;

// Appointment schema
export const appointmentSchema = z.object({
  patient_name: z.string().min(2, "Le nom du patient est requis"),
  doctor_name: z.string().min(2, "Le nom du médecin est requis"),
  date: z.string().refine((val: string) => !isNaN(Date.parse(val)), "Date invalide"),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Heure invalide (format HH:MM)"),
  type: z.enum(["consultation", "suivi", "urgence", "examen"], {
    required_error: "Le type de rendez-vous est requis",
  }),
  status: z.enum(["planifié", "confirmé", "annulé", "terminé"]).default("planifié"),
});

export type AppointmentFormData = z.infer<typeof appointmentSchema>;

// Payment schema
export const paymentSchema = z.object({
  patient_name: z.string().min(2, "Le nom du patient est requis"),
  amount: z.number().positive("Le montant doit être positif"),
  currency: z.string().default("EUR"),
  method: z.enum(["espèces", "carte", "virement", "chèque"], {
    required_error: "La méthode de paiement est requise",
  }),
  date: z.string().refine((val: string) => !isNaN(Date.parse(val)), "Date invalide"),
  description: z.string().min(5, "La description doit contenir au moins 5 caractères").max(500),
  status: z.enum(["en_attente", "payé", "annulé"]).default("en_attente"),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;

// Medical Record schema
export const medicalRecordSchema = z.object({
  patient_name: z.string().min(2, "Le nom du patient est requis"),
  date: z.string().refine((val: string) => !isNaN(Date.parse(val)), "Date invalide"),
  diagnosis: z.string().min(5, "Le diagnostic doit contenir au moins 5 caractères").max(1000),
  treatment: z.string().min(5, "Le traitement doit contenir au moins 5 caractères").max(1000),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type MedicalRecordFormData = z.infer<typeof medicalRecordSchema>;

// Prescription schema
export const prescriptionSchema = z.object({
  patient_name: z.string().min(2, "Le nom du patient est requis"),
  doctor_name: z.string().min(2, "Le nom du médecin est requis"),
  date: z.string().refine((val: string) => !isNaN(Date.parse(val)), "Date invalide"),
  medications: z.string().min(10, "Les médicaments doivent être détaillés").max(2000),
  notes: z.string().max(1000).optional().or(z.literal("")),
  status: z.enum(["en_cours", "terminé", "annulé"]).default("en_cours"),
});

export type PrescriptionFormData = z.infer<typeof prescriptionSchema>;

// Clinic schema
export const clinicSchema = z.object({
  name: z.string().min(2, "Le nom de la clinique est requis").max(100),
  slug: z.string().min(3, "Le slug doit contenir au moins 3 caractères").max(50)
    .regex(/^[a-z0-9-]+$/, "Le slug ne peut contenir que des lettres minuscules, chiffres et tirets"),
  plan: z.enum(["gratuit", "basique", "pro", "entreprise"]).default("gratuit"),
  status: z.enum(["actif", "inactif", "suspensu"]).default("actif"),
});

export type ClinicFormData = z.infer<typeof clinicSchema>;

// Doctor schema
export const doctorSchema = z.object({
  name: z.string().min(2, "Le nom est requis").max(100),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Numéro de téléphone invalide").max(20),
  specialty: z.string().min(2, "La spécialité est requise").max(100),
  status: z.enum(["actif", "inactif"]).default("actif"),
});

export type DoctorFormData = z.infer<typeof doctorSchema>;

// Pharmacy Stock schema
export const pharmacyStockSchema = z.object({
  name: z.string().min(2, "Le nom est requis").max(100),
  category: z.string().min(2, "La catégorie est requise").max(50),
  quantity: z.number().int().min(0, "La quantité doit être positive"),
  price: z.number().positive("Le prix doit être positif"),
  threshold: z.number().int().min(0, "Le seuil doit être positif").default(10),
});

export type PharmacyStockFormData = z.infer<typeof pharmacyStockSchema>;

// Lab Result schema
export const labResultSchema = z.object({
  patient_name: z.string().min(2, "Le nom du patient est requis"),
  analysis_type: z.string().min(2, "Le type d'analyse est requis").max(100),
  date: z.string().refine((val: string) => !isNaN(Date.parse(val)), "Date invalide"),
  result: z.string().min(5, "Le résultat doit être détaillé").max(2000),
  status: z.enum(["en_cours", "terminé", "anormal"]).default("en_cours"),
});

export type LabResultFormData = z.infer<typeof labResultSchema>;

// Helper function to validate form data
export const validateFormData = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
};

// Helper to extract error messages from Zod error
export const getZodErrors = (error: z.ZodError): Record<string, string> => {
  const errors: Record<string, string> = {};
  error.errors.forEach((err: z.ZodIssue) => {
    const path = err.path.join(".");
    errors[path] = err.message;
  });
  return errors;
};
