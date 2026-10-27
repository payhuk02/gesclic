import { fromAdmin } from "@/lib/admin-db";

const EXPORT_TABLES = [
  "clinics",
  "profiles",
  "clinic_members",
  "patients",
  "doctors",
  "appointments",
  "medical_records",
  "prescriptions",
  "payments",
  "lab_results",
  "platform_settings",
  "subscription_payments",
] as const;

export interface PlatformBackupPayload {
  version: 1;
  exported_at: string;
  tables: Record<string, unknown[]>;
  errors: Record<string, string>;
}

function downloadJson(filename: string, json: string) {
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const backupService = {
  async exportPlatformDump(): Promise<{ filename: string; json: string; size: number; payload: PlatformBackupPayload }> {
    const tables: Record<string, unknown[]> = {};
    const errors: Record<string, string> = {};

    await Promise.all(
      EXPORT_TABLES.map(async (table) => {
        const { data, error } = await fromAdmin(table).select("*");
        if (error) {
          errors[table] = error.message;
          tables[table] = [];
        } else {
          tables[table] = (data ?? []) as unknown[];
        }
      }),
    );

    const payload: PlatformBackupPayload = {
      version: 1,
      exported_at: new Date().toISOString(),
      tables,
      errors,
    };
    const json = JSON.stringify(payload, null, 2);
    const filename = `gesclic-backup-${payload.exported_at.replace(/[:.]/g, "-")}.json`;
    return { filename, json, size: new Blob([json]).size, payload };
  },

  triggerDownload(filename: string, json: string) {
    downloadJson(filename, json);
  },
};
