import { useState, useEffect } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import {
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  Calendar,
  CreditCard,
  Download,
  Filter,
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

const SuperAdminAnalytics = () => {
  const [period, setPeriod] = useState("30d");

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Platform Analytics</h1>
            <p className="text-muted-foreground">Statistiques globales de la plateforme</p>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
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
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Revenu Total</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.4M FCFA</div>
              <p className="text-xs text-success mt-1">+18.2% vs période précédente</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Nouvelles Cliniques</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-success mt-1">+4 vs période précédente</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Nouveaux Utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-success mt-1">+23% vs période précédente</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rendez-vous</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-success mt-1">+12% vs période précédente</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Revenu Mensuel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Graphique de revenu mensuel</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Croissance des Utilisateurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Graphique de croissance utilisateurs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution Géographique</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { country: "Côte d'Ivoire", clinics: 45, users: 234, revenue: 890000 },
                { country: "Sénégal", clinics: 23, users: 156, revenue: 456000 },
                { country: "Mali", clinics: 18, users: 98, revenue: 234000 },
                { country: "Burkina Faso", clinics: 12, users: 67, revenue: 178000 },
                { country: "Bénin", clinics: 8, users: 45, revenue: 123000 },
                { country: "Togo", clinics: 5, users: 34, revenue: 89000 },
              ].map((item) => (
                <div key={item.country} className="p-4 border border-border rounded-lg">
                  <h3 className="font-semibold mb-2">{item.country}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cliniques</span>
                      <span className="font-medium">{item.clinics}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Utilisateurs</span>
                      <span className="font-medium">{item.users}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revenu</span>
                      <span className="font-medium">{item.revenue.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution par Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { plan: "Entreprise", count: 5, revenue: 450000, growth: 25 },
                { plan: "Pro", count: 18, revenue: 534000, growth: 18 },
                { plan: "Standard", count: 32, revenue: 476800, growth: 12 },
                { plan: "Gratuit", count: 45, revenue: 0, growth: 8 },
              ].map((item) => (
                <div key={item.plan}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{item.plan}</Badge>
                      <span className="text-sm text-muted-foreground">{item.count} cliniques</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium">{item.revenue.toLocaleString()} FCFA</span>
                      <span className="text-xs text-success ml-2">+{item.growth}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                      style={{ width: `${(item.count / 100) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminAnalytics;
