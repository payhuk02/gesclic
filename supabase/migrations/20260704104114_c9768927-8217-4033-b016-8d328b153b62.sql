
-- Revoke public execute on internal trigger/utility functions
REVOKE EXECUTE ON FUNCTION public.notify_new_appointment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_appointment_reminders() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- has_role() must remain callable by authenticated users (used in RLS policies)
-- but not by anon
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Ensure service_role can still run triggers/utility funcs where needed
GRANT EXECUTE ON FUNCTION public.notify_new_appointment() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_appointment_reminders() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
