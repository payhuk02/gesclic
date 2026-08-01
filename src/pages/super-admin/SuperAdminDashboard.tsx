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
}

interface RecentActivity {
  id: string;
  action: string;
  resourceType: string;
  success: boolean;
  timestamp: string;
}

interface TopClinic {
  id: string;
  name: string;
  plan: string;
  users: number;
  appointments: number;
}

interface PlanBucket {
  plan: string;
  count: number;
  color: string;
}

const PLAN_COLORS: Record<string, string> = {
  free: "bg-slate-500",
  gratuit: "bg-slate-500",
  standard: "bg-blue-500",
  pro: "bg-purple-500",
  enterprise: "bg-amber-500",
  entreprise: "bg-amber-500",
};

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [topClinics, setTopClinics] = useState<TopClinic[]>([]);
  const [planDistribution, setPlanDistribution] = useState<PlanBucket[]>([]);
  const [openTickets, setOpenTickets] = useState(0);
  const [suspendedClinics, setSuspendedClinics] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [
        { data: clinics },
        { data: users },
        { data: appointments },
        { data: payments },
        { data: members },
        { data: logs },
        { data: tickets },
      ] = await Promise.all([
        supabase.from("clinics").select("id, name, plan, status, created_at"),
        supabase.from("profiles").select("id, created_at"),
        supabase.from("appointments").select("id, clinic_id, created_at"),
        supabase.from("payments").select("amount, status, created_at"),
        supabase.from("clinic_members").select("clinic_id, is_active"),
        supabase
          .from("audit_logs")
          .select("id, action, resource_type, success, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("support_tickets").select("id, status"),
      ]);

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const paidPayments = (payments || []).filter((p) => p.status === "paid" || p.status === "completed");
      const totalRevenue = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const revenueThisMonth = paidPayments
        .filter((p) => new Date(p.created_at) >= thisMonth)
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      setStats({
        totalClinics: clinics?.length || 0,
        totalUsers: users?.length || 0,
        totalAppointments: appointments?.length || 0,
        totalRevenue,
        activeClinics: (clinics || []).filter((c) => c.status === "active").length,
        newClinicsThisMonth: (clinics || []).filter((c) => new Date(c.created_at) >= thisMonth).length,
        newUsersThisMonth: (users || []).filter((u) => new Date(u.created_at) >= thisMonth).length,
        revenueThisMonth,
      });

      setSuspendedClinics((clinics || []).filter((c) => c.status !== "active").length);
      setOpenTickets((tickets || []).filter((t) => t.status === "open" || t.status === "in_progress").length);

      // Plan distribution (real)
      const planCounts = new Map<string, number>();
      (clinics || []).forEach((c) => {
        const key = c.plan || "free";
        planCounts.set(key, (planCounts.get(key) || 0) + 1);
      });
      setPlanDistribution(
        Array.from(planCounts.entries())
          .map(([plan, count]) => ({
            plan,
            count,
            color: PLAN_COLORS[plan.toLowerCase()] || "bg-slate-500",
          }))
          .sort((a, b) => b.count - a.count)
      );

      // Top clinics by real appointment volume
      const apptByClinic = new Map<string, number>();
      (appointments || []).forEach((a) => {
        if (a.clinic_id) apptByClinic.set(a.clinic_id, (apptByClinic.get(a.clinic_id) || 0) + 1);
      });
      const membersByClinic = new Map<string, number>();
      (members || []).forEach((m) => {
        if (m.clinic_id && m.is_active)
          membersByClinic.set(m.clinic_id, (membersByClinic.get(m.clinic_id) || 0) + 1);
      });

      setTopClinics(
        (clinics || [])
          .map((c) => ({
            id: c.id,
            name: c.name,
            plan: c.plan || "free",
            users: membersByClinic.get(c.id) || 0,
            appointments: apptByClinic.get(c.id) || 0,
          }))
          .sort((a, b) => b.appointments - a.appointments || b.users - a.users)
          .slice(0, 5)
      );

      setRecentActivity(
        (logs || []).map((l) => ({
          id: l.id,
          action: l.action,
          resourceType: l.resource_type,
          success: l.success,
          timestamp: l.created_at,
        }))
      );
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs mt-1 text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </SuperAdminLayout>
    );
  }

  const totalClinics = stats?.totalClinics || 0;

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Platform Dashboard</h1>
          <p className="text-muted-foreground">Vue d'ensemble de la plateforme Gesclic</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Cliniques"
            value={totalClinics}
            subtitle={`${stats?.newClinicsThisMonth || 0} ce mois-ci`}
            icon={Building2}
          />
          <StatCard
            title="Total Utilisateurs"
            value={stats?.totalUsers || 0}
            subtitle={`${stats?.newUsersThisMonth || 0} ce mois-ci`}
            icon={Users}
          />
          <StatCard title="Rendez-vous" value={stats?.totalAppointments || 0} icon={Calendar} />
          <StatCard
            title="Revenu Mensuel"
            value={`${(stats?.revenueThisMonth || 0).toLocaleString()} FCFA`}
            subtitle={`Total: ${(stats?.totalRevenue || 0).toLocaleString()} FCFA`}
            icon={CreditCard}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Cliniques Actives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex flex-col items-center justify-center text-center">
                <BarChart3 className="w-10 h-10 mb-3 text-muted-foreground opacity-50" />
                <p className="text-4xl font-bold text-foreground">{stats?.activeClinics || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  sur {totalClinics} cliniques enregistrées
                </p>
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
              {planDistribution.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Aucune clinique enregistrée</p>
              ) : (
                <div className="space-y-4">
                  {planDistribution.map((item) => (
                    <div key={item.plan}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium capitalize">{item.plan}</span>
                        <span className="text-sm text-muted-foreground">{item.count} cliniques</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", item.color)}
                          style={{ width: `${totalClinics ? (item.count / totalClinics) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Activité Récente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Aucune activité enregistrée</p>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Activity className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.resourceType}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link to="/super-admin/activity">Voir toute l'activité</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Cliniques Performantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topClinics.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Aucune clinique enregistrée</p>
              ) : (
                <div className="space-y-4">
                  {topClinics.map((clinic, index) => (
                    <div key={clinic.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{clinic.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {clinic.users} utilisateurs • {clinic.appointments} RDV
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {clinic.plan}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link to="/super-admin/clinics">Voir toutes les cliniques</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {(suspendedClinics > 0 || openTickets > 0) && (
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="w-5 h-5" />
                Alertes Plateforme
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {suspendedClinics > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span className="text-foreground">
                      {suspendedClinics} clinique(s) inactive(s) ou suspendue(s)
                    </span>
                  </div>
                )}
                {openTickets > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="w-4 h-4 text-amber-600" />
                    <span className="text-foreground">{openTickets} ticket(s) de support ouvert(s)</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;
