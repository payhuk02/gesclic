import AppLayout from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import {
  Calendar, Users, TrendingUp, UserCheck, Clock,
  Activity, FlaskConical, Pill, Stethoscope, ChevronRight,
  AlertTriangle, CreditCard,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { usePatients } from "@/hooks/usePatients";
import { useAppointments } from "@/hooks/useAppointments";
import { usePayments } from "@/hooks/usePayments";
import { useDoctors } from "@/hooks/useDoctors";
import { useLabResults } from "@/hooks/useLabResults";
import { usePharmacyStock } from "@/hooks/usePharmacyStock";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];
const DAYS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

const Dashboard = () => {
  const { patients } = usePatients();
  const { appointments } = useAppointments();
  const { payments } = usePayments();
  const { doctors } = useDoctors();
  const { results: labResults } = useLabResults();
  const { items: pharmacyItems } = usePharmacyStock();

  const today = new Date().toISOString().split("T")[0];
  const totalRevenuePaid = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const pendingPayments = payments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0);
  const todayAppts = appointments.filter((a) => a.date === today);
  const pendingLabs = labResults.filter((l) => l.status === "pending" || l.status === "in_progress");
  const lowStockMeds = pharmacyItems.filter((m) => m.quantity <= m.threshold);

  // Build revenue per month from real payments
  const revenueData = (() => {
    const map = new Map<string, number>();
    payments.filter((p) => p.status === "paid").forEach((p) => {
      const d = new Date(p.date);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      map.set(key, (map.get(key) || 0) + p.amount);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, revenue]) => {
        const [, m] = key.split("-").map(Number);
        return { month: MONTHS[m], revenue };
      });
  })();

  // Weekly appointments (current week, Mon-Sat) from real appointments
  const weeklyAppointments = (() => {
    const base = new Date();
    const dow = base.getDay();
    const monday = new Date(base);
    monday.setDate(base.getDate() - (dow === 0 ? 6 : dow - 1));
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      return { day: DAYS_FR[d.getDay()], count: appointments.filter((a) => a.date === iso).length };
    });
  })();

  // Consultation types from real appointments
  const consultationTypes = (() => {
    const map = new Map<string, number>();
    appointments.forEach((a) => map.set(a.type, (map.get(a.type) || 0) + 1));
    const palette = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--destructive))", "hsl(var(--warning))", "hsl(var(--success))"];
    return Array.from(map.entries()).slice(0, 5).map(([name, value], i) => ({ name, value, color: palette[i % palette.length] }));
  })();

  const statCards = [
    { label: "RDV aujourd'hui", value: `${todayAppts.length}`, icon: Calendar, color: "text-primary bg-primary/10" },
    { label: "Patients actifs", value: `${patients.length}`, icon: Users, color: "text-accent-foreground bg-accent/10" },
    { label: "Revenus (payés)", value: `${(totalRevenuePaid / 1000).toFixed(0)}K`, icon: TrendingUp, color: "text-warning bg-warning/10" },
    { label: "Impayés", value: `${(pendingPayments / 1000).toFixed(0)}K`, icon: CreditCard, color: "text-destructive bg-destructive/10" },
  ];

  const upcomingAppts = appointments.filter((a) => a.status === "confirmed" || a.status === "pending").slice(0, 5);
  const alertCount = lowStockMeds.length + pendingLabs.length;
  const recentActivities = appointments.slice(0, 5).map((a) => ({
    icon: Calendar, text: `RDV — ${a.patient_name} avec ${a.doctor_name}`, time: a.date, color: "text-primary",
  }));

  return (
    <AppLayout title="Tableau de bord">
      {alertCount > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 bg-destructive/5 border border-destructive/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <h3 className="font-semibold text-foreground">{alertCount} alerte{alertCount > 1 ? "s" : ""} à traiter</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {lowStockMeds.length > 0 && (
              <Link to="/pharmacy" className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border hover:bg-secondary/50 transition-colors">
                <Pill className="w-4 h-4 text-destructive" /><span className="text-sm text-foreground">{lowStockMeds.length} produit{lowStockMeds.length > 1 ? "s" : ""} en rupture</span><ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
              </Link>
            )}
            {pendingLabs.length > 0 && (
              <Link to="/laboratory" className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border hover:bg-secondary/50 transition-colors">
                <FlaskConical className="w-4 h-4 text-warning" /><span className="text-sm text-foreground">{pendingLabs.length} analyse{pendingLabs.length > 1 ? "s" : ""} en attente</span><ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
              </Link>
            )}
          </div>
        </motion.div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-card rounded-xl p-5 shadow-card border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}><stat.icon className="w-5 h-5" /></div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-card rounded-xl p-6 shadow-card border border-border">
          <h3 className="font-semibold text-foreground mb-4">Revenus mensuels (paiements encaissés)</h3>
          {revenueData.length === 0 ? <p className="text-center py-12 text-muted-foreground">Aucun paiement encaissé</p> : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => [`${v.toLocaleString()} FCFA`, "Revenus"]} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-card rounded-xl p-6 shadow-card border border-border">
          <h3 className="font-semibold text-foreground mb-4">Types de consultations</h3>
          {consultationTypes.length === 0 ? <p className="text-center py-12 text-muted-foreground">Aucun rendez-vous</p> : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart><Pie data={consultationTypes} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>{consultationTypes.map((entry, i) => <Cell key={i} fill={entry.color} />)}</Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {consultationTypes.map((ct) => (
                  <div key={ct.name} className="flex items-center gap-2 text-xs"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ct.color }} /><span className="text-muted-foreground">{ct.name} ({ct.value})</span></div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card rounded-xl p-6 shadow-card border border-border">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Stethoscope className="w-5 h-5 text-primary" />Rendez-vous cette semaine</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyAppointments}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} name="RDV" /></BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card rounded-xl p-6 shadow-card border border-border">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Pill className="w-5 h-5 text-warning" />Stock pharmacie critique</h3>
          {pharmacyItems.length === 0 ? <p className="text-sm text-muted-foreground">Aucun produit enregistré</p> : lowStockMeds.length === 0 ? <p className="text-sm text-muted-foreground">Tous les stocks sont suffisants ✓</p> : (
            <div className="space-y-3">
              {lowStockMeds.slice(0, 6).map((med) => {
                const pct = Math.min((med.quantity / Math.max(med.threshold, 1)) * 100, 100);
                return (
                  <div key={med.id}><div className="flex items-center justify-between mb-1"><span className="text-sm text-foreground">{med.name}</span><span className="text-xs font-medium text-destructive">{med.quantity}/{med.threshold}</span></div><Progress value={pct} className="h-2 [&>div]:bg-destructive" /></div>
                );
              })}
            </div>
          )}
          <Link to="/pharmacy" className="inline-flex items-center gap-1 text-sm text-primary mt-4 hover:underline">Voir tout <ChevronRight className="w-4 h-4" /></Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card rounded-xl p-6 shadow-card border border-border">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-primary" />Activités récentes</h3>
          <div className="space-y-4">
            {recentActivities.length === 0 ? <p className="text-sm text-muted-foreground">Aucune activité récente</p> : recentActivities.map((act, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 ${act.color}`}><act.icon className="w-4 h-4" /></div>
                <div className="flex-1 min-w-0"><p className="text-sm text-foreground leading-tight">{act.text}</p><p className="text-xs text-muted-foreground mt-0.5">{act.time}</p></div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-xl p-6 shadow-card border border-border">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-primary" />Rendez-vous à venir</h3>
          <div className="space-y-3">
            {upcomingAppts.length === 0 ? <p className="text-sm text-muted-foreground">Aucun rendez-vous à venir</p> : upcomingAppts.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div><p className="text-sm font-medium text-foreground">{a.patient_name}</p><p className="text-xs text-muted-foreground">{a.doctor_name} — {a.type}</p></div>
                <div className="text-right"><p className="text-sm font-medium text-foreground">{a.time}</p><p className="text-xs text-muted-foreground">{a.date}</p></div>
              </div>
            ))}
          </div>
          <Link to="/appointments" className="inline-flex items-center gap-1 text-sm text-primary mt-4 hover:underline">Voir tout <ChevronRight className="w-4 h-4" /></Link>
        </div>
      </div>

      <div className="bg-card rounded-xl p-6 shadow-card border border-border">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><UserCheck className="w-5 h-5 text-accent-foreground" />Médecins ({doctors.length})</h3>
        {doctors.length === 0 ? <p className="text-sm text-muted-foreground">Aucun médecin enregistré. <Link to="/staff" className="text-primary hover:underline">Ajoutez-en un</Link>.</p> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {doctors.map((d) => {
              const initials = d.name.replace(/^Dr\.?\s*/i, "").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
              return (
                <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <div className="w-10 h-10 rounded-full gradient-hero flex items-center justify-center text-sm font-bold text-primary-foreground">{initials}</div>
                  <div className="flex-1"><p className="text-sm font-medium text-foreground">{d.name}</p><p className="text-xs text-muted-foreground">{d.specialty}</p></div>
                  <Badge variant="outline" className={d.status === "active" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}>{d.status === "active" ? "Actif" : "—"}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
