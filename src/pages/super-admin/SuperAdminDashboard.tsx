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
  type: "clinic_created" | "user_created" | "subscription_upgraded" | "payment_received";
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
  revenue: number;
}

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [topClinics, setTopClinics] = useState<TopClinic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch platform stats
      const { data: clinics } = await supabase.from("clinics").select("id, name, plan, created_at");
      const { data: users } = await supabase.from("profiles").select("id, created_at");
      const { data: appointments } = await supabase.from("appointments").select("id, created_at");

      const totalClinics = clinics?.length || 0;
      const totalUsers = users?.length || 0;
      const totalAppointments = appointments?.length || 0;

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const newClinicsThisMonth = clinics?.filter(c => new Date(c.created_at) >= thisMonth).length || 0;
      const newUsersThisMonth = users?.filter(u => new Date(u.created_at) >= thisMonth).length || 0;

      setStats({
        totalClinics,
        totalUsers,
        totalAppointments,
        totalRevenue: 0, // Would come from payments table
        activeClinics: totalClinics, // Assuming all are active
        newClinicsThisMonth,
        newUsersThisMonth,
        revenueThisMonth: 0,
        revenueGrowth: 0,
      });

      // Mock recent activity
      setRecentActivity([
        {
          id: "1",
          type: "clinic_created",
          clinicName: "Clinique Santé Plus",
          description: "Nouvelle clinique créée",
          timestamp: new Date().toISOString(),
        },
        {
          id: "2",
          type: "subscription_upgraded",
          clinicName: "Hôpital Central",
          description: "Plan mis à niveau vers Pro",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "3",
          type: "user_created",
          clinicName: "Cabinet Médical Alpha",
          description: "Nouveau médecin ajouté",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
      ]);

      // Mock top clinics
      setTopClinics([
        {
          id: "1",
          name: "Clinique Santé Plus",
          plan: "Pro",
          users: 25,
          appointments: 450,
          revenue: 89700,
        },
        {
          id: "2",
          name: "Hôpital Central",
          plan: "Entreprise",
          users: 50,
          appointments: 890,
          revenue: 178000,
        },
        {
          id: "3",
          name: "Cabinet Médical Alpha",
          plan: "Standard",
          users: 12,
          appointments: 230,
          revenue: 35700,
        },
      ]);
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className={cn("text-xs mt-1", trend === "up" ? "text-success" : "text-destructive")}>
            {trend === "up" ? <ArrowUpRight className="inline w-3 h-3 mr-1" /> : <ArrowDownRight className="inline w-3 h-3 mr-1" />}
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
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
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
            change={15}
            trend="up"
            icon={Building2}
          />
          <StatCard
            title="Total Utilisateurs"
            value={stats?.totalUsers || 0}
            change={23}
            trend="up"
            icon={Users}
          />
          <StatCard
            title="Rendez-vous"
            value={stats?.totalAppointments || 0}
            change={8}
            trend="up"
            icon={Calendar}
          />
          <StatCard
            title="Revenu Mensuel"
            value={`${(stats?.revenueThisMonth || 0).toLocaleString()} FCFA`}
            change={12}
            trend="up"
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
                {[
                  { plan: "Gratuit", count: 45, color: "bg-slate-500" },
                  { plan: "Standard", count: 32, color: "bg-blue-500" },
                  { plan: "Pro", count: 18, color: "bg-purple-500" },
                  { plan: "Entreprise", count: 5, color: "bg-amber-500" },
                ].map((item) => (
                  <div key={item.plan}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{item.plan}</span>
                      <span className="text-sm text-muted-foreground">{item.count} cliniques</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", item.color)} style={{ width: `${(item.count / 100) * 100}%` }} />
                    </div>
                  </div>
                ))}
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
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
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
                <TrendingUp className="w-5 h-5" />
                Cliniques Performentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topClinics.map((clinic, index) => (
                  <div key={clinic.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
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
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
              Alertes Plateforme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-amber-600" />
                <span className="text-foreground">3 cliniques nécessitent une attention</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span className="text-foreground">2 paiements en attente de validation</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;
