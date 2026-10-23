import { supabase } from "@/integrations/supabase/client";

export type SoftDeletableTable =
  | "patients"
  | "appointments"
  | "payments"
  | "prescriptions"
  | "medical_records"
  | "lab_results"
  | "pharmacy_stock"
  | "clinic_members";

/**
 * Soft-delete a clinic-scoped row via SECURITY DEFINER RPC (membership-checked).
 */
export async function softDeleteRecord(
  table: SoftDeletableTable,
  recordId: string,
  reason?: string,
): Promise<{ error: Error | null }> {
  const { error } = await supabase.rpc("soft_delete" as never, {
    table_name: table,
    record_id: recordId,
    reason: reason ?? null,
  } as never);

  return { error: error ? new Error(error.message) : null };
}
