-- 1. Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Add updated_at columns (if not present) and triggers
-- For global_books
DO $$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'global_books' AND column_name = 'updated_at') THEN
        ALTER TABLE "public"."global_books" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();
    END IF;
END $$;

CREATE TRIGGER update_global_books_modtime
    BEFORE UPDATE ON "public"."global_books"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- For organization_inventory
DO $$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_inventory' AND column_name = 'updated_at') THEN
        ALTER TABLE "public"."organization_inventory" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();
    END IF;
END $$;

CREATE TRIGGER update_inventory_modtime
    BEFORE UPDATE ON "public"."organization_inventory"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. Audit Logs Table
CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "table_name" text NOT NULL,
    "record_id" uuid,
    "operation" text NOT NULL, -- INSERT, UPDATE, DELETE
    "old_data" jsonb,
    "new_data" jsonb,
    "changed_by" uuid, -- Clerk User ID / Supabase User ID
    "organization_id" text, -- Which org context
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- RLS for Audit Logs: Only visible to Org Admins (simplified query for now: check org_id)
ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org Admins can view own audit logs"
ON "public"."audit_logs" FOR SELECT
TO authenticated
USING (
    organization_id = (auth.jwt() ->> 'org_id')
    AND
    (((auth.jwt() ->> 'org_role')::text) = 'admin')
);

-- 4. Audit Trigger Function
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
    user_id uuid;
    org_id text;
BEGIN
    -- Try to capture user/org from session
    -- Note: In Supabase Edge Functions / Client calls this usually works if configured context was set. 
    -- If not, these might be null.
    -- We'll assume the client sets 'auth.jwt()' related session variables or we parse them from current_setting if available.
    -- Standard Supabase auth.uid()
    user_id := auth.uid();
    org_id := (auth.jwt() ->> 'org_id');

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

-- 5. Attach Audit Trigger to Inventory
CREATE TRIGGER audit_inventory_changes
    AFTER INSERT OR UPDATE OR DELETE ON "public"."organization_inventory"
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_event();
