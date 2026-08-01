import { useEffect, useState } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import {
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  Calendar,
  CreditCard,
  Download,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { usePlatformStats, formatFCFA, PlatformPeriod } from "@/hooks/usePlatformStats";
import { exportToExcel } from "@/utils/exportUtils";

interface ClinicRow {
  name: string;
  plan: string;
  members: number;
  appointments: number;
  revenue: number;
}

const SuperAdminAnalytics = () => {
  const [period, setPeriod] = useState<PlatformPeriod>("30d");
  const { stats, loading } = usePlatformStats(period);
  const [clinicRows, setClinicRows] = useState<ClinicRow[]>([]);

  useEffect(() => {
    const load = async () => {
      const [clinicsRes, membersRes, apptRes, payRes] = await Promise.all([
        supabase.from("clinics").select("id, name, plan"),
        supabase.from("clinic_members").select("clinic_id"),
        supabase.from("appointments").select("clinic_id"),
        supabase.from("payments").select("clinic_id, amount, status"),
      ]);

      const count = (rows: any[] | null, id: string) =>
        (rows ?? []).filter((r) => r.clinic_id === id).length;

      setClinicRows(
        (clinicsRes.data ?? []).map((c) => ({
          name: c.name,
          plan: c.plan ?? "free",
          members: count(membersRes.data, c.id),
          appointments: count(apptRes.data, c.id),
          revenue: (payRes.data ?? [])
            .filter((p) => p.clinic_id === c.id && p.status === "paid")
            .reduce((s, p) => s + (p.amount ?? 0), 0),
        }))
      );
    };
    load();
  }, []);

  const diff = (current: number, previous: number) => {
    const delta = current - previous;
    if (!previous) return `${current} sur la période`;
    return `${delta >= 0 ? "+" : ""}${delta} vs période précédente`;
  };

  const maxMonthly = Math.max(1, ...stats.monthly.map((m) => m.revenue));
  const maxPlanCount = Math.max(1, ...stats.planBuckets.map((p) => p.count));

  const handleExport = () => {
    exportToExcel(
      clinicRows as unknown as Record<string, unknown>[],
      [
        { header: "Clinique", key: "name" },
        { header: "Plan", key: "plan" },
        { header: "Membres", key: "members" },
        { header: "Rendez-vous", key: "appointments" },
        { header: "Revenu", key: "revenue" },
      ],
      "analytics-plateforme"
    );
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Platform Analytics</h1>
            <p className="text-muted-foreground">Statistiques globales de la plateforme (données réelles)</p>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={(v) => setPeriod(v as PlatformPeriod)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 jours</SelectItem>
                <SelectItem value="30d">30 jours</SelectItem>
                <SelectItem value="90d">90 jours</SelectItem>
                <SelectItem value="1y">1 an</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport} disabled={clinicRows.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Revenu Total</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : formatFCFA(stats.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.revenueGrowth === null
                  ? "Pas de période précédente comparable"
                  : `${stats.revenueGrowth.toFixed(1)}% vs période précédente`}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Nouvelles Cliniques</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.newClinics}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {diff(stats.newClinics, stats.previousNewClinics)} · {stats.totalClinics} au total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Nouveaux Utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.newUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {diff(stats.newUsers, stats.previousNewUsers)} · {stats.totalUsers} au total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rendez-vous</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.appointments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {diff(stats.appointments, stats.previousAppointments)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Revenu Mensuel (12 mois)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.monthly.every((m) => m.revenue === 0) ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground text-sm text-center">
                  <div>
                    <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    Aucun revenu enregistré
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-end gap-2">
                  {stats.monthly.map((m) => (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t"
                        style={{ height: `${(m.revenue / maxMonthly) * 200}px` }}
                        title={formatFCFA(m.revenue)}
                      />
                      <span className="text-[10px] text-muted-foreground">{m.month}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Activité par Clinique
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clinicRows.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                  Aucune clinique enregistrée
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {clinicRows.map((c) => (
                    <div key={c.name} className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate">{c.name}</span>
                      <span className="text-muted-foreground">
                        {c.members} membres · {c.appointments} RDV
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Revenu par Clinique</CardTitle>
          </CardHeader>
          <CardContent>
            {clinicRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {clinicRows.map((item) => (
                  <div key={item.name} className="p-4 border border-border rounded-lg">
                    <h3 className="font-semibold mb-2 truncate">{item.name}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Plan</span>
                        <span className="font-medium capitalize">{item.plan}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Utilisateurs</span>
                        <span className="font-medium">{item.members}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Revenu</span>
                        <span className="font-medium">{formatFCFA(item.revenue)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribution par Plan</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.planBuckets.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune clinique enregistrée</p>
            ) : (
              <div className="space-y-4">
                {stats.planBuckets.map((item) => (
                  <div key={item.plan}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="capitalize">{item.plan}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {item.count} clinique{item.count > 1 ? "s" : ""}
                        </span>
                      </div>
                      <span className="text-sm font-medium">{formatFCFA(item.revenue)}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                        style={{ width: `${(item.count / maxPlanCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminAnalytics;
