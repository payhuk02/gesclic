import { useEffect, useState } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { CreditCard, CheckCircle, Clock, AlertTriangle, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatFCFA, usePlatformStats, type PlatformPeriod } from "@/hooks/usePlatformStats";
import { supabase } from "@/integrations/supabase/client";

interface Invoice {
  id: string;
  clinic: string;
  plan: string;
  amount: number;
  status: string;
  date: string;
}

const SuperAdminBilling = () => {
  const [period, setPeriod] = useState<PlatformPeriod>("30d");
  const { stats, loading } = usePlatformStats(period);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    const load = async () => {
      const [{ data }, clinicsRes] = await Promise.all([
        supabase
          .from("subscription_payments")
          .select("id, plan, amount, status, created_at, paid_at, clinic_id")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase.from("clinics").select("id, name"),
      ]);
      const names = Object.fromEntries((clinicsRes.data ?? []).map((c) => [c.id, c.name]));
      setInvoices(
        (data ?? []).map((row) => ({
          id: row.id,
          clinic: names[row.clinic_id] || "—",
          plan: row.plan,
          amount: Number(row.amount ?? 0),
          status: row.status,
          date: row.paid_at || row.created_at,
        }))
      );
    };
    load();
  }, []);

  const statusConfig: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
    paid: { label: "Payé", icon: CheckCircle, color: "bg-success/10 text-success border-success/20" },
    success: { label: "Payé", icon: CheckCircle, color: "bg-success/10 text-success border-success/20" },
    pending: { label: "En attente", icon: Clock, color: "bg-warning/10 text-warning border-warning/20" },
    failed: { label: "Échoué", icon: AlertTriangle, color: "bg-destructive/10 text-destructive border-destructive/20" },
  };

  const maxPlanRevenue = Math.max(...stats.planBuckets.map((p) => p.revenue), 1);

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Platform Billing</h1>
            <p className="text-muted-foreground">Facturation réelle de la plateforme</p>
          </div>
          <Select value={period} onValueChange={(v) => setPeriod(v as PlatformPeriod)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Revenu</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{loading ? "…" : formatFCFA(stats.totalRevenue)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Factures payées</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.paidCount}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">En attente</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.pendingCount}</div>
              <p className="text-xs text-muted-foreground mt-1">{formatFCFA(stats.pendingAmount)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Échouées</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.failedCount}</div>
              <p className="text-xs text-muted-foreground mt-1">{formatFCFA(stats.failedAmount)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Revenu par plan</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {stats.planBuckets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée</p>
            ) : stats.planBuckets.map((item) => (
              <div key={item.plan}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium capitalize">{item.plan}</span>
                  <span className="text-sm text-muted-foreground">{formatFCFA(item.revenue)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${(item.revenue / maxPlanRevenue) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Paiements d'abonnement</CardTitle></CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">Aucun paiement enregistré</p>
            ) : (
              <div className="space-y-4">
                {invoices.map((invoice) => {
                  const statusInfo = statusConfig[invoice.status] ?? statusConfig.pending;
                  const StatusIcon = statusInfo.icon;
                  return (
                    <div key={invoice.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-border rounded-lg">
                      <CreditCard className="w-6 h-6 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{invoice.clinic}</h3>
                          <Badge variant="outline" className="capitalize">{invoice.plan}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(invoice.date).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="font-semibold">{formatFCFA(invoice.amount)}</p>
                      <Badge className={statusInfo.color}><StatusIcon className="w-3 h-3 mr-1" />{statusInfo.label}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminBilling;
