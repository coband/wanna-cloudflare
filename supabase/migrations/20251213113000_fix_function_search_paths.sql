-- Fix "Function Search Path Mutable" warnings by explicitly setting search_path to empty string
-- This prevents malicious users from hijacking the function execution by creating objects in schemas that are earlier in the search_path.

ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
ALTER FUNCTION public.log_audit_event() SET search_path = '';
ALTER FUNCTION public.requesting_user_id() SET search_path = '';
ALTER FUNCTION public.requesting_org_id() SET search_path = '';
