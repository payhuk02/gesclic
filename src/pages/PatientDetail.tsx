import AppLayout from "@/components/layout/AppLayout";
import { useParams, Link } from "react-router-dom";
import { usePatients } from "@/hooks/usePatients";
import { useAppointments } from "@/hooks/useAppointments";
import { usePayments } from "@/hooks/usePayments";
import { usePrescriptions } from "@/hooks/usePrescriptions";
import { useMedicalRecords } from "@/hooks/useMedicalRecords";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Phone, Mail, Calendar, Droplets,
  AlertTriangle, User, FileText, CreditCard, Pill,
  Clock, Loader2,
} from "lucide-react";

const PatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { patients, loading } = usePatients();
  const { appointments } = useAppointments();
  const { payments } = usePayments();
  const { prescriptions } = usePrescriptions();
  const { records } = useMedicalRecords();

  if (loading) {
    return <AppLayout title="Chargement..."><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AppLayout>;
  }

  const patient = patients.find((p) => p.id === id);

  if (!patient) {
    return (
      <AppLayout title="Patient introuvable">
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">Ce patient n'existe pas.</p>
          <Link to="/patients"><Button variant="outline">Retour aux patients</Button></Link>
        </div>
      </AppLayout>
    );
  }

  const patientAppointments = appointments.filter((a) => a.patient_name === patient.name);
  const patientPayments = payments.filter((p) => p.patient_name === patient.name);
  const patientPrescriptions = prescriptions.filter((p) => p.patient_name === patient.name);
  const patientRecords = records.filter((r) => r.patient_name === patient.name);

  const age = patient.dob ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : 0;

  return (
    <AppLayout title="Fiche patient">
      <Link to="/patients" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" />Retour
      </Link>

      <div className="bg-card rounded-2xl p-6 border border-border shadow-card mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="w-20 h-20 rounded-2xl gradient-hero flex items-center justify-center text-2xl font-bold text-primary-foreground flex-shrink-0">
            {patient.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">{patient.name}</h2>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{patient.sex === "M" ? "Homme" : "Femme"} · {age} ans</span>
              <span className="flex items-center gap-1"><Droplets className="w-3.5 h-3.5" />{patient.blood_group}</span>
              {patient.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{patient.phone}</span>}
              {patient.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{patient.email}</span>}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {patient.allergies && patient.allergies !== "Aucune" && (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                  <AlertTriangle className="w-3 h-3 mr-1" />Allergie: {patient.allergies}
                </Badge>
              )}
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Dernière visite: {patient.last_visit || "—"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { icon: Calendar, label: "Rendez-vous", value: patientAppointments.length, color: "text-primary bg-primary/10" },
          { icon: FileText, label: "Dossiers", value: patientRecords.length, color: "text-accent-foreground bg-accent/10" },
          { icon: Pill, label: "Ordonnances", value: patientPrescriptions.length, color: "text-warning bg-warning/10" },
          { icon: CreditCard, label: "Paiements", value: patientPayments.length, color: "text-success bg-success/10" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl p-4 border border-border text-center">
            <s.icon className={`w-6 h-6 mx-auto mb-2 ${s.color.split(" ")[0]}`} />
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="timeline"><Clock className="w-4 h-4 mr-1" />Dossiers</TabsTrigger>
          <TabsTrigger value="appointments"><Calendar className="w-4 h-4 mr-1" />Rendez-vous</TabsTrigger>
          <TabsTrigger value="prescriptions"><Pill className="w-4 h-4 mr-1" />Ordonnances</TabsTrigger>
          <TabsTrigger value="payments"><CreditCard className="w-4 h-4 mr-1" />Paiements</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <div className="space-y-3">
            {patientRecords.length === 0 && <p className="text-center text-muted-foreground py-12">Aucun dossier médical</p>}
            {patientRecords.map((rec) => (
              <div key={rec.id} className="bg-card rounded-xl p-5 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Dossier</Badge>
                  <span className="text-xs text-muted-foreground">{rec.date}</span>
                </div>
                <p className="text-sm text-foreground"><strong>Diagnostic:</strong> {rec.diagnosis}</p>
                {rec.treatment && <p className="text-sm text-muted-foreground"><strong>Traitement:</strong> {rec.treatment}</p>}
                {rec.notes && <p className="text-xs text-muted-foreground mt-2 italic">{rec.notes}</p>}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="appointments">
          <div className="space-y-3">
            {patientAppointments.length === 0 && <p className="text-center text-muted-foreground py-12">Aucun rendez-vous</p>}
            {patientAppointments.map((a) => (
              <div key={a.id} className="bg-card rounded-xl p-4 border border-border flex items-center justify-between">
                <div><p className="text-sm font-medium text-foreground">{a.date} à {a.time}</p><p className="text-xs text-muted-foreground">{a.doctor_name} — {a.type}</p></div>
                <Badge variant="outline" className={a.status === "confirmed" ? "bg-success/10 text-success border-success/20" : a.status === "pending" ? "bg-warning/10 text-warning border-warning/20" : a.status === "completed" ? "bg-primary/10 text-primary border-primary/20" : "bg-destructive/10 text-destructive border-destructive/20"}>
                  {a.status === "confirmed" ? "Confirmé" : a.status === "pending" ? "En attente" : a.status === "completed" ? "Terminé" : "Annulé"}
                </Badge>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="prescriptions">
          <div className="space-y-3">
            {patientPrescriptions.length === 0 && <p className="text-center text-muted-foreground py-12">Aucune ordonnance</p>}
            {patientPrescriptions.map((rx) => (
              <div key={rx.id} className="bg-card rounded-xl p-4 border border-border">
                <div className="flex items-center justify-between mb-2"><p className="text-sm font-medium text-foreground">{rx.doctor_name}</p><span className="text-xs text-muted-foreground">{rx.date}</span></div>
                <div className="flex flex-wrap gap-2">{rx.medications.map((m) => <span key={m} className="text-xs bg-secondary px-3 py-1 rounded-full text-foreground">{m}</span>)}</div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="payments">
          <div className="space-y-3">
            {patientPayments.length === 0 && <p className="text-center text-muted-foreground py-12">Aucun paiement</p>}
            {patientPayments.map((p) => (
              <div key={p.id} className="bg-card rounded-xl p-4 border border-border flex items-center justify-between">
                <div><p className="text-sm font-medium text-foreground">{p.description}</p><p className="text-xs text-muted-foreground">{p.date} — {p.method}</p></div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{p.amount.toLocaleString("fr-FR")} {p.currency}</p>
                  <Badge variant="outline" className={p.status === "paid" ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"}>{p.status === "paid" ? "Payé" : "En attente"}</Badge>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default PatientDetail;
