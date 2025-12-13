-- Optimize RLS policy for audit_logs to prevent per-row re-evaluation of auth.jwt()
-- We wrap auth.job() calls in (select ...) to allow Postgres to execute it once per query (InitPlan).

DROP POLICY "Org Admins can view own audit logs" ON "public"."audit_logs";

CREATE POLICY "Org Admins can view own audit logs"
ON "public"."audit_logs" FOR SELECT
TO authenticated
USING (
    organization_id = ((select auth.jwt()) ->> 'org_id')
    AND
    ((((select auth.jwt()) ->> 'org_role')::text) = 'admin')
);
