import AppLayout from "@/components/layout/AppLayout";
import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, Calendar, DollarSign, Activity, Download, Filter, RefreshCw, Loader2, LineChart, PieChart, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { analyticsService } from "@/services/analytics.service";
import { useClinic } from "@/contexts/ClinicContext";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--destructive))", "hsl(var(--warning))", "hsl(210, 70%, 50%)", "hsl(150, 60%, 45%)"];

const AdvancedAnalytics = () => {
  const { activeClinicId } = useClinic();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");
  const [revenueMetrics, setRevenueMetrics] = useState<any>(null);
  const [patientMetrics, setPatientMetrics] = useState<any>(null);
  const [operationalMetrics, setOperationalMetrics] = useState<any>(null);
  const [financialHealth, setFinancialHealth] = useState<any>(null);

  useEffect(() => {
    if (activeClinicId) {
      loadMetrics();
    }
  }, [activeClinicId, period]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const days = parseInt(period);
      
      const [revenue, patients, operational, financial] = await Promise.all([
        analyticsService.getRevenueMetrics(activeClinicId, days),
        analyticsService.getPatientMetrics(activeClinicId, days),
        analyticsService.getOperationalMetrics(activeClinicId, days),
        analyticsService.getFinancialHealth(activeClinicId),
      ]);

      setRevenueMetrics(revenue);
      setPatientMetrics(patients);
      setOperationalMetrics(operational);
      setFinancialHealth(financial);
    } catch (error) {
      console.error("Error loading metrics:", error);
      toast.error("Erreur lors du chargement des métriques");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadMetrics();
  };

  const generateCSV = () => {
    const lines = [
      'Metric,Value',
      `Total Revenue,${revenueMetrics.total_revenue || 0}`,
      `Revenue Growth,${revenueMetrics.revenue_growth || 0}%`,
      `Total Patients,${patientMetrics.total_patients || 0}`,
      `New Patients,${patientMetrics.new_patients || 0}`,
      `Patient Retention,${patientMetrics.patient_retention_rate || 0}%`,
      `Appointment Utilization,${operationalMetrics.appointment_utilization || 0}%`,
      `No Show Rate,${operationalMetrics.no_show_rate || 0}%`,
      `Current Ratio,${financialHealth.current_ratio || 0}`,
      `Profit Margin,${financialHealth.profit_margin || 0}%`,
    ];
    return lines.join('\n');
  };

  const handleExport = async () => {
    try {
      const csvContent = generateCSV();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      toast.success("Export réussi");
    } catch (error) {
      console.error("Error exporting metrics:", error);
      toast.error("Erreur lors de l'export");
    }
  };

  if (loading) {
    return (
      <AppLayout title="Analytics Avancés">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Analytics Avancés">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 jours</SelectItem>
              <SelectItem value="30">30 jours</SelectItem>
              <SelectItem value="90">90 jours</SelectItem>
              <SelectItem value="365">1 an</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="patients">Patients</TabsTrigger>
          <TabsTrigger value="operational">Opérations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenu Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {revenueMetrics?.total_revenue?.toLocaleString()} FCFA
                </div>
                <p className="text-xs text-muted-foreground">
                  +{revenueMetrics?.growth_rate?.toFixed(1)}% vs période précédente
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Nouveaux Patients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{patientMetrics?.new_patients}</div>
                <p className="text-xs text-muted-foreground">
                  {patientMetrics?.retention_rate?.toFixed(1)}% taux de rétention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rendez-vous</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{operationalMetrics?.total_appointments}</div>
                <p className="text-xs text-muted-foreground">
                  {operationalMetrics?.show_rate?.toFixed(1)}% taux de présence
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Santé Financière</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <Badge
                    className={
                      financialHealth?.health_score >= 80
                        ? "bg-success/10 text-success"
                        : financialHealth?.health_score >= 60
                        ? "bg-warning/10 text-warning"
                        : "bg-destructive/10 text-destructive"
                    }
                  >
                    {financialHealth?.health_score}/100
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {financialHealth?.cash_flow_days} jours de trésorerie
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Évolution du Revenu</CardTitle>
                <CardDescription>Revenus sur la période sélectionnée</CardDescription>
              </CardHeader>
              <CardContent>
                {revenueMetrics?.revenue_by_month && revenueMetrics.revenue_by_month.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={revenueMetrics.revenue_by_month}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState icon={LineChart} title="Pas de données" description="Aucune donnée de revenu disponible" />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition des Patients</CardTitle>
                <CardDescription>Par catégorie</CardDescription>
              </CardHeader>
              <CardContent>
                {patientMetrics?.patients_by_category && patientMetrics.patients_by_category.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={patientMetrics.patients_by_category}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => entry.name}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {patientMetrics.patients_by_category.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState icon={PieChart} title="Pas de données" description="Aucune donnée de patients disponible" />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Métriques de Revenu</CardTitle>
              <CardDescription>Analyse détaillée des revenus</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {revenueMetrics ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Revenu Total</p>
                      <p className="text-2xl font-bold">{revenueMetrics.total_revenue?.toLocaleString()} FCFA</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Revenu Moyen/Patient</p>
                      <p className="text-2xl font-bold">{revenueMetrics.average_revenue_per_patient?.toLocaleString()} FCFA</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Taux de Croissance</p>
                      <p className="text-2xl font-bold">{revenueMetrics.growth_rate?.toFixed(1)}%</p>
                    </div>
                  </div>

                  {revenueMetrics.revenue_by_service && revenueMetrics.revenue_by_service.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-4">Revenu par Service</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={revenueMetrics.revenue_by_service}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="service" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              ) : (
                <EmptyState icon={DollarSign} title="Pas de données" description="Aucune donnée de revenu disponible" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Métriques Patients</CardTitle>
              <CardDescription>Analyse détaillée des patients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {patientMetrics ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Patients</p>
                      <p className="text-2xl font-bold">{patientMetrics.total_patients}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Nouveaux</p>
                      <p className="text-2xl font-bold">{patientMetrics.new_patients}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Taux de Rétention</p>
                      <p className="text-2xl font-bold">{patientMetrics.retention_rate?.toFixed(1)}%</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Visites/Patient</p>
                      <p className="text-2xl font-bold">{patientMetrics.average_visits_per_patient?.toFixed(1)}</p>
                    </div>
                  </div>

                  {patientMetrics.patient_acquisition_trend && patientMetrics.patient_acquisition_trend.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-4">Tendance d'Acquisition</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsLineChart data={patientMetrics.patient_acquisition_trend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              ) : (
                <EmptyState icon={Users} title="Pas de données" description="Aucune donnée de patients disponible" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operational" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Métriques Opérationnelles</CardTitle>
              <CardDescription>Analyse des opérations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {operationalMetrics ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Rendez-vous</p>
                      <p className="text-2xl font-bold">{operationalMetrics.total_appointments}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Taux de Présence</p>
                      <p className="text-2xl font-bold">{operationalMetrics.show_rate?.toFixed(1)}%</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Temps d'Attente Moyen</p>
                      <p className="text-2xl font-bold">{operationalMetrics.average_wait_time?.toFixed(1)} min</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Utilisation Ressources</p>
                      <p className="text-2xl font-bold">{operationalMetrics.resource_utilization?.toFixed(1)}%</p>
                    </div>
                  </div>

                  {operationalMetrics.appointments_by_type && operationalMetrics.appointments_by_type.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-4">Rendez-vous par Type</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={operationalMetrics.appointments_by_type}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="type" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="hsl(var(--primary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              ) : (
                <EmptyState icon={Activity} title="Pas de données" description="Aucune donnée opérationnelle disponible" />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default AdvancedAnalytics;
