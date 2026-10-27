import { useState } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { BarChart3, Users, Building2, Calendar, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatFCFA, usePlatformStats, type PlatformPeriod } from "@/hooks/usePlatformStats";

const SuperAdminAnalytics = () => {
  const [period, setPeriod] = useState<PlatformPeriod>("30d");
  const { stats, loading } = usePlatformStats(period);
  const maxPlan = Math.max(...stats.planBuckets.map((p) => p.count), 1);
  const maxMonth = Math.max(...stats.monthly.map((m) => m.revenue), 1);

  const delta = (current: number, previous: number) => {
    if (!previous) return null;
    return ((current - previous) / previous) * 100;
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Platform Analytics</h1>
            <p className="text-muted-foreground">Statistiques réelles de la plateforme</p>
          </div>
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
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Revenu", value: formatFCFA(stats.totalRevenue), change: stats.revenueGrowth, icon: CreditCard },
            { title: "Nouvelles cliniques", value: String(stats.newClinics), change: delta(stats.newClinics, stats.previousNewClinics), icon: Building2 },
            { title: "Nouveaux utilisateurs", value: String(stats.newUsers), change: delta(stats.newUsers, stats.previousNewUsers), icon: Users },
            { title: "Rendez-vous", value: String(stats.appointments), change: delta(stats.appointments, stats.previousAppointments), icon: Calendar },
          ].map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "…" : card.value}</div>
                {card.change != null && (
                  <p className={`text-xs mt-1 ${card.change >= 0 ? "text-success" : "text-destructive"}`}>
                    {card.change >= 0 ? "+" : ""}
                    {card.change.toFixed(1)}% vs période précédente
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" />Revenu mensuel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.monthly.every((m) => m.revenue === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-12">Aucun revenu enregistré</p>
              ) : (
                stats.monthly.map((m) => (
                  <div key={m.month}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{m.month}</span>
                      <span>{formatFCFA(m.revenue)}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${(m.revenue / maxMonth) * 100}%` }} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Distribution par plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.planBuckets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">Aucune clinique</p>
              ) : (
                stats.planBuckets.map((item) => (
                  <div key={item.plan}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="capitalize">{item.plan}</Badge>
                        <span className="text-sm text-muted-foreground">{item.count} cliniques</span>
                      </div>
                      <span className="text-sm font-medium">{formatFCFA(item.revenue)}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${(item.count / maxPlan) * 100}%` }} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminAnalytics;
