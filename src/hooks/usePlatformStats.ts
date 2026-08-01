import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PlatformPeriod = "7d" | "30d" | "90d" | "1y";

const periodDays: Record<PlatformPeriod, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
};

export interface PlanBucket {
  plan: string;
  count: number;
  revenue: number;
}

export interface MonthlyPoint {
  month: string;
  revenue: number;
}

export interface PlatformStats {
  totalRevenue: number;
  previousRevenue: number;
  revenueGrowth: number | null;
  paidCount: number;
  pendingCount: number;
  pendingAmount: number;
  failedCount: number;
  failedAmount: number;
  totalClinics: number;
  newClinics: number;
  previousNewClinics: number;
  totalUsers: number;
  newUsers: number;
  previousNewUsers: number;
  appointments: number;
  previousAppointments: number;
  planBuckets: PlanBucket[];
  monthly: MonthlyPoint[];
}

const emptyStats: PlatformStats = {
  totalRevenue: 0,
  previousRevenue: 0,
  revenueGrowth: null,
  paidCount: 0,
  pendingCount: 0,
  pendingAmount: 0,
  failedCount: 0,
  failedAmount: 0,
  totalClinics: 0,
  newClinics: 0,
  previousNewClinics: 0,
  totalUsers: 0,
  newUsers: 0,
  previousNewUsers: 0,
  appointments: 0,
  previousAppointments: 0,
  planBuckets: [],
  monthly: [],
};

const growth = (current: number, previous: number): number | null => {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
};

/**
 * Aggregates real platform-wide data from Supabase.
 * No mock/demo values are used: empty database => zeros.
 */
export const usePlatformStats = (period: PlatformPeriod = "30d") => {
  const [stats, setStats] = useState<PlatformStats>(emptyStats);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const days = periodDays[period];
      const now = new Date();
      const start = new Date(now.getTime() - days * 86400000);
      const prevStart = new Date(now.getTime() - 2 * days * 86400000);

      const [clinicsRes, membersRes, appointmentsRes, paymentsRes] = await Promise.all([
        supabase.from("clinics").select("id, plan, created_at"),
        supabase.from("clinic_members").select("user_id, created_at"),
        supabase.from("appointments").select("id, created_at, clinic_id"),
        supabase.from("payments").select("amount, status, date, created_at, clinic_id"),
      ]);

      const clinics = clinicsRes.data ?? [];
      const members = membersRes.data ?? [];
      const appointments = appointmentsRes.data ?? [];
      const payments = paymentsRes.data ?? [];

      const inRange = (value: string | null | undefined, from: Date, to: Date) => {
        if (!value) return false;
        const d = new Date(value);
        return d >= from && d < to;
      };

      const periodPayments = payments.filter((p) => inRange(p.created_at, start, now));
      const prevPayments = payments.filter((p) => inRange(p.created_at, prevStart, start));

      const sum = (rows: typeof payments) => rows.reduce((s, p) => s + (p.amount ?? 0), 0);

      const paid = periodPayments.filter((p) => p.status === "paid");
      const pending = periodPayments.filter((p) => p.status === "pending");
      const failed = periodPayments.filter((p) => p.status === "failed");

      // Revenue per plan, based on the clinic that generated each paid payment
      const clinicPlan = new Map(clinics.map((c) => [c.id, c.plan ?? "free"]));
      const planMap = new Map<string, PlanBucket>();
      clinics.forEach((c) => {
        const plan = c.plan ?? "free";
        const bucket = planMap.get(plan) ?? { plan, count: 0, revenue: 0 };
        bucket.count += 1;
        planMap.set(plan, bucket);
      });
      payments
        .filter((p) => p.status === "paid")
        .forEach((p) => {
          const plan = clinicPlan.get(p.clinic_id as string) ?? "free";
          const bucket = planMap.get(plan) ?? { plan, count: 0, revenue: 0 };
          bucket.revenue += p.amount ?? 0;
          planMap.set(plan, bucket);
        });

      // Monthly revenue over the last 12 months
      const monthly: MonthlyPoint[] = [];
      for (let i = 11; i >= 0; i--) {
        const from = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const to = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const revenue = payments
          .filter((p) => p.status === "paid" && inRange(p.created_at, from, to))
          .reduce((s, p) => s + (p.amount ?? 0), 0);
        monthly.push({
          month: from.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
          revenue,
        });
      }

      const uniqueUsers = new Set(members.map((m) => m.user_id)).size;

      const currentRevenue = sum(paid);
      const previousRevenue = sum(prevPayments.filter((p) => p.status === "paid"));

      setStats({
        totalRevenue: currentRevenue,
        previousRevenue,
        revenueGrowth: growth(currentRevenue, previousRevenue),
        paidCount: paid.length,
        pendingCount: pending.length,
        pendingAmount: sum(pending),
        failedCount: failed.length,
        failedAmount: sum(failed),
        totalClinics: clinics.length,
        newClinics: clinics.filter((c) => inRange(c.created_at, start, now)).length,
        previousNewClinics: clinics.filter((c) => inRange(c.created_at, prevStart, start)).length,
        totalUsers: uniqueUsers,
        newUsers: members.filter((m) => inRange(m.created_at, start, now)).length,
        previousNewUsers: members.filter((m) => inRange(m.created_at, prevStart, start)).length,
        appointments: appointments.filter((a) => inRange(a.created_at, start, now)).length,
        previousAppointments: appointments.filter((a) => inRange(a.created_at, prevStart, start)).length,
        planBuckets: Array.from(planMap.values()).sort((a, b) => b.revenue - a.revenue),
        monthly,
      });
    } catch (error) {
      console.error("Error loading platform stats:", error);
      setStats(emptyStats);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, loading, reload: load };
};

export const formatFCFA = (value: number) => `${(value ?? 0).toLocaleString("fr-FR")} FCFA`;
