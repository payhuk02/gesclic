import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2,
  Users,
  TrendingUp,
  CreditCard,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  BarChart3,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PlatformStats {
  totalClinics: number;
  totalUsers: number;
  totalAppointments: number;
  totalRevenue: number;
  activeClinics: number;
  newClinicsThisMonth: number;
  newUsersThisMonth: number;
  revenueThisMonth: number;
  revenueGrowth: number;
}

interface RecentActivity {
  id: string;
  clinicName: string;
  description: string;
  timestamp: string;
}

interface TopClinic {
  id: string;
  name: string;
  plan: string;
  users: number;
  appointments: number;
}


const SuperAdminDashboard = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [topClinics, setTopClinics] = useState<TopClinic[]>([]);
  const [planDistribution, setPlanDistribution] = useState<{ plan: string; count: number }[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);


      // Fetch platform stats
      const [{ data: clinics }, { data: users }, { data: appointments }, { data: members }, { data: payments }] =
        await Promise.all([
          supabase.from("clinics").select("id, name, plan, status, created_at"),
          supabase.from("profiles").select("id, created_at"),
          supabase.from("appointments").select("id, clinic_id, created_at"),
          supabase.from("clinic_members").select("clinic_id"),
          supabase.from("subscription_payments").select("amount, status, created_at, paid_at"),
        ]);

      const totalClinics = clinics?.length || 0;
      const totalUsers = users?.length || 0;
      const totalAppointments = appointments?.length || 0;

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const newClinicsThisMonth = clinics?.filter((c) => new Date(c.created_at) >= thisMonth).length || 0;
      const newUsersThisMonth = users?.filter((u) => new Date(u.created_at) >= thisMonth).length || 0;
      const paid = (payments ?? []).filter((p) => p.status === "paid" || p.status === "success");
      const revenueThisMonth = paid
        .filter((p) => new Date(p.paid_at || p.created_at) >= thisMonth)
        .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
      const revenueLastMonth = paid
        .filter((p) => {
          const d = new Date(p.paid_at || p.created_at);
          return d >= lastMonth && d < thisMonth;
        })
        .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
      const totalRevenue = paid.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
      const revenueGrowth =
        revenueLastMonth > 0 ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100) : 0;

      setStats({
        totalClinics,
        totalUsers,
        totalAppointments,
        totalRevenue,
        activeClinics: clinics?.filter((c) => c.status === "active").length || 0,
        newClinicsThisMonth,
        newUsersThisMonth,
        revenueThisMonth,
        revenueGrowth,
      });

      setRecentActivity(
        (clinics ?? [])
          .slice()
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
          .map((c) => ({
            id: c.id,
            clinicName: c.name,
            description: "Clinique enregistrée",
            timestamp: c.created_at,
          }))
      );

      const membersByClinic = new Map<string, number>();
      for (const m of members ?? []) membersByClinic.set(m.clinic_id, (membersByClinic.get(m.clinic_id) ?? 0) + 1);
      const apptsByClinic = new Map<string, number>();
      for (const a of appointments ?? []) {
        if (!a.clinic_id) continue;
        apptsByClinic.set(a.clinic_id, (apptsByClinic.get(a.clinic_id) ?? 0) + 1);
      }

      setTopClinics(
        (clinics ?? [])
          .map((c) => ({
            id: c.id,
            name: c.name,
            plan: c.plan,
            users: membersByClinic.get(c.id) ?? 0,
            appointments: apptsByClinic.get(c.id) ?? 0,
          }))
          .sort((a, b) => b.appointments - a.appointments || b.users - a.users)
          .slice(0, 5)
      );

      const planMap = new Map<string, number>();
      for (const c of clinics ?? []) planMap.set(c.plan || "essentiel", (planMap.get(c.plan || "essentiel") ?? 0) + 1);
      setPlanDistribution([...planMap.entries()].map(([plan, count]) => ({ plan, count })));

      const nextAlerts: string[] = [];
      const suspended = clinics?.filter((c) => c.status === "suspended").length || 0;
      if (suspended > 0) nextAlerts.push(`${suspended} clinique(s) suspendue(s)`);
      const pendingPay = (payments ?? []).filter((p) => p.status === "pending").length;
      if (pendingPay > 0) nextAlerts.push(`${pendingPay} paiement(s) d'abonnement en attente`);
      setAlerts(nextAlerts);

    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,

    change,
    icon: Icon,
    trend,
  }: {
    title: string;
    value: string | number;
    change?: number;
    icon: any;
    trend?: "up" | "down";

  }) => (
    <Card className="border border-border shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {change !== undefined && (
          <p className={cn("text-xs mt-1 flex items-center font-medium", trend === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
            {trend === "up" ? <ArrowUpRight className="inline w-3.5 h-3.5 mr-1" strokeWidth={2} /> : <ArrowDownRight className="inline w-3.5 h-3.5 mr-1" strokeWidth={2} />}
            {change}% vs mois dernier
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </SuperAdminLayout>
    );
  }


  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}

        <div>
          <h1 className="text-2xl font-bold text-foreground">Platform Dashboard</h1>
          <p className="text-muted-foreground">Vue d'ensemble de la plateforme Gesclic</p>
        </div>


        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Cliniques"
            value={stats?.totalClinics || 0}
            icon={Building2}
          />
          <StatCard
            title="Total Utilisateurs"
            value={stats?.totalUsers || 0}
            icon={Users}
          />
          <StatCard
            title="Rendez-vous"
            value={stats?.totalAppointments || 0}
            icon={Calendar}
          />
          <StatCard
            title="Revenu Mensuel"
            value={`${(stats?.revenueThisMonth || 0).toLocaleString()} FCFA`}
            change={stats?.revenueGrowth || undefined}
            trend={stats && stats.revenueGrowth < 0 ? "down" : "up"}
            icon={CreditCard}
          />
        </div>


        {/* Charts Row */}

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />

                Croissance des Cliniques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Graphique de croissance</p>
                </div>

              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Distribution par Plan
              </CardTitle>
            </CardHeader>
            <CardContent>

              <div className="space-y-4">
                {planDistribution.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucune clinique enregistrée</p>
                ) : (
                  planDistribution.map((item) => {
                    const max = Math.max(...planDistribution.map((p) => p.count), 1);
                    return (
                      <div key={item.plan}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium capitalize">{item.plan}</span>
                          <span className="text-sm text-muted-foreground">{item.count} cliniques</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${(item.count / max) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </CardContent>
          </Card>
        </div>


        {/* Recent Activity & Top Clinics */}

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Activité Récente
              </CardTitle>
            </CardHeader>
            <CardContent>

              <div className="space-y-4">
                {recentActivity.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucune activité récente</p>
                )}
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.75} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{activity.clinicName}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>

              <Button variant="outline" className="w-full mt-4" asChild>
                <Link to="/super-admin/activity">Voir toute l'activité</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" strokeWidth={1.75} />

                Cliniques Performentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topClinics.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucune clinique</p>
                )}
                {topClinics.map((clinic, index) => (
                  <div key={clinic.id} className="flex items-center gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-xs sm:text-sm font-bold text-white flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{clinic.name}</p>
                      <p className="text-xs text-muted-foreground">{clinic.users} utilisateurs • {clinic.appointments} RDV</p>
                    </div>
                    <Badge variant="outline">{clinic.plan}</Badge>
                  </div>
                ))}
              </div>

              <Button variant="outline" className="w-full mt-4" asChild>
                <Link to="/super-admin/clinics">Voir toutes les cliniques</Link>
              </Button>
            </CardContent>
          </Card>
        </div>


        {/* Alerts */}
        {alerts.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
              Alertes Plateforme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div key={alert} className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span className="text-foreground">{alert}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        )}

      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;
