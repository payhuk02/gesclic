import AppLayout from "@/components/layout/AppLayout";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { usePatients } from "@/hooks/usePatients";
import { useAppointments } from "@/hooks/useAppointments";
import { usePayments } from "@/hooks/usePayments";
import { useDoctors } from "@/hooks/useDoctors";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Users, Calendar, CreditCard, Activity } from "lucide-react";
import ExportButtons from "@/components/ExportButtons";

const COLORS = [
  "hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--destructive))",
  "hsl(var(--warning))", "hsl(210, 70%, 50%)", "hsl(150, 60%, 45%)",
];
const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];

const statusLabels: Record<string, string> = {
  confirmed: "Confirmé", pending: "En attente", completed: "Terminé", cancelled: "Annulé",
};

const Reports = () => {
  const [period, setPeriod] = useState("all");
  const { patients } = usePatients();
  const { appointments } = useAppointments();
  const { payments } = usePayments();
  const { doctors } = useDoctors();

  const revenueByMonth = (() => {
    const map = new Map<string, number>();
    payments.filter((p) => p.status === "paid").forEach((p) => {
      const d = new Date(p.date);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      map.set(key, (map.get(key) || 0) + p.amount);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([key, revenue]) => {
      const m = parseInt(key.split("-")[1], 10);
      return { month: MONTHS[m], revenue };
    });
  })();

  const paymentsByMethod = Object.entries(
    payments.reduce((acc, p) => { acc[p.method] = (acc[p.method] || 0) + p.amount; return acc; }, {} as Record<string, number>)
  ).map(([method, amount]) => ({ method, amount }));

  const appointmentsByType = Object.entries(
    appointments.reduce((acc, a) => { acc[a.type] = (acc[a.type] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([type, count]) => ({ type, count }));

  const appointmentsByDoctor = doctors.map((d) => ({
    name: d.name.replace(/^Dr\.?\s*/i, ""),
    rdv: appointments.filter((a) => a.doctor_name === d.name).length,
  }));

  const appointmentsByStatus = Object.entries(
    appointments.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([status, count]) => ({ status, count }));

  const patientsByBloodGroup = Object.entries(
    patients.reduce((acc, p) => { acc[p.blood_group || "—"] = (acc[p.blood_group || "—"] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([group, count]) => ({ group, count }));

  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);
  const paidRevenue = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const avgPerPatient = patients.length > 0 ? Math.round(paidRevenue / patients.length) : 0;

  const stats = [
    { label: "Revenus totaux", value: `${(totalRevenue / 1000).toFixed(0)}K FCFA`, icon: TrendingUp, color: "text-primary bg-primary/10" },
    { label: "Patients", value: patients.length, icon: Users, color: "text-accent-foreground bg-accent/10" },
    { label: "Rendez-vous", value: appointments.length, icon: Calendar, color: "text-warning bg-warning/10" },
    { label: "Moyenne/patient", value: `${(avgPerPatient / 1000).toFixed(0)}K`, icon: CreditCard, color: "text-destructive bg-destructive/10" },
  ];

  return (
    <AppLayout title="Rapports & Statistiques">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /><h2 className="text-lg font-semibold">Tableau analytique</h2></div>
          <div className="flex gap-3 items-center">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toute période</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="quarter">Ce trimestre</SelectItem>
              </SelectContent>
            </Select>
            <ExportButtons data={payments.map(p => ({ ...p, patientName: p.patient_name })) as unknown as Record<string, unknown>[]} columns={[{ header: "Patient", key: "patientName" },{ header: "Montant", key: "amount" },{ header: "Méthode", key: "method" },{ header: "Statut", key: "status" },{ header: "Date", key: "date" }]} title="Rapport financier" filename="rapport-financier" />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-3"><div className={`p-2 rounded-lg ${s.color}`}><s.icon className="w-5 h-5" /></div><div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></div></div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold mb-4">Évolution des revenus</h3>
            {revenueByMonth.length === 0 ? <p className="text-center py-12 text-muted-foreground">Aucune donnée</p> : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={revenueByMonth}><CartesianGrid strokeDasharray="3 3" className="opacity-30" /><XAxis dataKey="month" fontSize={12} /><YAxis fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} /><Tooltip formatter={(v: number) => `${v.toLocaleString()} FCFA`} /><Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} /></AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold mb-4">Paiements par méthode</h3>
            {paymentsByMethod.length === 0 ? <p className="text-center py-12 text-muted-foreground">Aucune donnée</p> : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart><Pie data={paymentsByMethod} dataKey="amount" nameKey="method" cx="50%" cy="50%" outerRadius={90} label={({ method, percent }) => `${method} ${(percent * 100).toFixed(0)}%`} labelLine={false}>{paymentsByMethod.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(v: number) => `${v.toLocaleString()} FCFA`} /></PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold mb-4">RDV par médecin</h3>
            {appointmentsByDoctor.length === 0 ? <p className="text-center py-12 text-muted-foreground">Aucun médecin enregistré</p> : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={appointmentsByDoctor} layout="vertical"><CartesianGrid strokeDasharray="3 3" className="opacity-30" /><XAxis type="number" fontSize={12} allowDecimals={false} /><YAxis dataKey="name" type="category" fontSize={11} width={100} /><Tooltip /><Bar dataKey="rdv" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="RDV" /></BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold mb-4">Types de consultations</h3>
            {appointmentsByType.length === 0 ? <p className="text-center py-12 text-muted-foreground">Aucune donnée</p> : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={appointmentsByType}><CartesianGrid strokeDasharray="3 3" className="opacity-30" /><XAxis dataKey="type" fontSize={11} /><YAxis fontSize={12} allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Nombre" /></BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold mb-4">Statut des rendez-vous</h3>
            {appointmentsByStatus.length === 0 ? <p className="text-center py-12 text-muted-foreground">Aucune donnée</p> : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart><Pie data={appointmentsByStatus.map((s) => ({ ...s, label: statusLabels[s.status] || s.status }))} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={90} label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`} labelLine={false}>{appointmentsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold mb-4">Répartition groupes sanguins</h3>
            {patientsByBloodGroup.length === 0 ? <p className="text-center py-12 text-muted-foreground">Aucune donnée</p> : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={patientsByBloodGroup}><CartesianGrid strokeDasharray="3 3" className="opacity-30" /><XAxis dataKey="group" fontSize={12} /><YAxis fontSize={12} allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} name="Patients" /></BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-4">Top patients (nombre de RDV)</h3>
          {patients.length === 0 ? <p className="text-center py-8 text-muted-foreground">Aucune donnée</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border"><th className="text-left py-2 text-muted-foreground font-medium">Patient</th><th className="text-left py-2 text-muted-foreground font-medium">RDV</th><th className="text-left py-2 text-muted-foreground font-medium">Groupe sanguin</th><th className="text-left py-2 text-muted-foreground font-medium">Dernière visite</th></tr></thead>
                <tbody>
                  {patients.map((p) => ({ ...p, rdvCount: appointments.filter((a) => a.patient_name === p.name).length })).sort((a, b) => b.rdvCount - a.rdvCount).slice(0, 5).map((p) => (
                    <tr key={p.id} className="border-b border-border/50"><td className="py-2 font-medium">{p.name}</td><td className="py-2">{p.rdvCount}</td><td className="py-2">{p.blood_group}</td><td className="py-2">{p.last_visit || "—"}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Reports;
