/**
 * Point d'entrée unique pour le reporting d'erreurs en production.
 *
 * Aucun SDK tiers n'est requis : les erreurs sont mises en file et envoyées
 * au endpoint configuré via `VITE_MONITORING_ENDPOINT` (optionnel).
 * Si un SDK (Sentry, LogRocket…) est chargé, on lui délègue également.
 */

export interface MonitoringPayload {
  level: "warn" | "error" | "fatal";
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  stack?: string;
  url?: string;
  userAgent?: string;
}

const endpoint = import.meta.env.VITE_MONITORING_ENDPOINT as string | undefined;
const isProduction = !import.meta.env.DEV;

const recent: MonitoringPayload[] = [];
const MAX_RECENT = 50;

type SentryLike = { captureException?: (e: unknown, ctx?: unknown) => void; captureMessage?: (m: string) => void };

function getSentry(): SentryLike | undefined {
  return (globalThis as unknown as { Sentry?: SentryLike }).Sentry;
}

export function reportError(
  message: string,
  error?: Error | unknown,
  context?: Record<string, unknown>,
  level: MonitoringPayload["level"] = "error"
): void {
  const payload: MonitoringPayload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    stack: error instanceof Error ? error.stack : undefined,
    url: typeof window !== "undefined" ? window.location.href : undefined,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  };

  recent.push(payload);
  if (recent.length > MAX_RECENT) recent.shift();

  const sentry = getSentry();
  if (sentry) {
    if (error && sentry.captureException) sentry.captureException(error, { extra: context });
    else if (sentry.captureMessage) sentry.captureMessage(message);
  }

  if (!isProduction || !endpoint) return;

  try {
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, blob);
    } else {
      void fetch(endpoint, { method: "POST", body: blob, keepalive: true });
    }
  } catch {
    // Ne jamais faire échouer l'application à cause du monitoring.
  }
}

export function getRecentReports(): MonitoringPayload[] {
  return [...recent];
}
