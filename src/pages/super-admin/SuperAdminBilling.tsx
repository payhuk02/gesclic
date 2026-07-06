import { useState } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import {
  CreditCard,
  TrendingUp,
  Download,
  Filter,
  Calendar,
  Building2,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
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

const SuperAdminBilling = () => {
  const [period, setPeriod] = useState("30d");

  const invoices = [
    {
      id: "INV-001",
      clinic: "Clinique Santé Plus",
      plan: "Pro",
      amount: 29900,
      status: "paid",
      date: "2024-03-15",
    },
    {
      id: "INV-002",
      clinic: "Hôpital Central",
      plan: "Entreprise",
      amount: 150000,
      status: "pending",
      date: "2024-03-14",
    },
    {
      id: "INV-003",
      clinic: "Cabinet Médical Alpha",
      plan: "Standard",
      amount: 14900,
      status: "paid",
      date: "2024-03-13",
    },
    {
      id: "INV-004",
      clinic: "Clinique Bien-être",
      plan: "Pro",
      amount: 29900,
      status: "failed",
      date: "2024-03-12",
    },
  ];

  const statusConfig = {
    paid: { label: "Payé", icon: CheckCircle, color: "bg-success/10 text-success border-success/20" },
    pending: { label: "En attente", icon: Clock, color: "bg-warning/10 text-warning border-warning/20" },
    failed: { label: "Échoué", icon: AlertTriangle, color: "bg-destructive/10 text-destructive border-destructive/20" },
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Platform Billing</h1>
            <p className="text-muted-foreground">Facturation globale de la plateforme</p>
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Revenu Total</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.4M FCFA</div>
              <p className="text-xs text-success mt-1">
                <ArrowUpRight className="inline w-3 h-3 mr-1" />
                +18.2% vs période précédente
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Factures Payées</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground mt-1">94% du total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">En Attente</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">8</div>
              <p className="text-xs text-muted-foreground mt-1">48,000 FCFA</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Échouées</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">2</div>
              <p className="text-xs text-muted-foreground mt-1">12,000 FCFA</p>
            </CardContent>
          </Card>
        </div>

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
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Graphique de revenu mensuel</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Revenu par Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { plan: "Entreprise", revenue: 450000, percentage: 45 },
                  { plan: "Pro", revenue: 534000, percentage: 35 },
                  { plan: "Standard", revenue: 476800, percentage: 15 },
                  { plan: "Gratuit", revenue: 0, percentage: 5 },
                ].map((item) => (
                  <div key={item.plan}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{item.plan}</span>
                      <span className="text-sm text-muted-foreground">{item.revenue.toLocaleString()} FCFA</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Factures Récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invoices.map((invoice) => {
                const statusInfo = statusConfig[invoice.status];
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={invoice.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{invoice.clinic}</h3>
                          <Badge variant="outline">{invoice.plan}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{invoice.id}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(invoice.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{invoice.amount.toLocaleString()} FCFA</p>
                      </div>
                      <Badge className={statusInfo.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminBilling;
