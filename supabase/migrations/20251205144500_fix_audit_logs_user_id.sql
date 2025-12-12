-- Fix audit_logs table to support Clerk User IDs (Strings) instead of UUIDs
ALTER TABLE "public"."audit_logs"
  ALTER COLUMN "changed_by" TYPE text;

-- Update the audit function to handle text user IDs
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
    user_id text; -- Changed from uuid to text
    org_id text;
BEGIN
    -- standard auth.uid() returns uuid, which fails for Clerk IDs.
    -- We extract 'sub' directly from the JWT.
    user_id := (auth.jwt() ->> 'sub');
    
    -- Also try to get Org ID using our new helper or raw claim
    -- We use the raw claim here to keep this function self-contained
    org_id := (auth.jwt() -> 'o'::text) ->> 'id'::text;
    
    -- Fallback if not B2B/Org flow?
    if org_id IS NULL THEN
        org_id := (auth.jwt() ->> 'org_id'); -- Legacy fallback
    end if;

    IF (TG_OP = 'DELETE') THEN
        INSERT INTO "public"."audit_logs" (table_name, record_id, operation, old_data, changed_by, organization_id)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD), user_id, org_id);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO "public"."audit_logs" (table_name, record_id, operation, old_data, new_data, changed_by, organization_id)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW), user_id, org_id);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO "public"."audit_logs" (table_name, record_id, operation, new_data, changed_by, organization_id)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW), user_id, org_id);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
