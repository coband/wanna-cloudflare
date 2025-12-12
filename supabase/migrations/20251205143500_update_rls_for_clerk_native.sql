-- Create the helper function to extract Org ID or User ID from Clerk Token (Native Integration)
-- Matches https://clerk.com/blog/multitenancy-clerk-supabase-b2b
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'o'::text) ->> 'id'::text, -- Organization ID from 'o' object
    (auth.jwt() ->> 'sub'::text)              -- Fallback to User ID (sub)
  )::text;
$$;

-- Create a specific function for strictly Org ID (for organization_inventory)
CREATE OR REPLACE FUNCTION requesting_org_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt() -> 'o'::text) ->> 'id'::text;
$$;


-- Update Policies for 'books' (if we want to allow Org-based access)
-- Note: In our strict schema, we might want to ensure 'books' are always tied to an Org via 'organization_id'
-- The previous policy used: organization_id = (auth.jwt() ->> 'org_id')

DROP POLICY IF EXISTS "Users can view books in their organization" ON "public"."books";
CREATE POLICY "Users can view books in their organization" ON "public"."books"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  organization_id = requesting_org_id()
);

DROP POLICY IF EXISTS "Users can insert books into their organization" ON "public"."books";
CREATE POLICY "Users can insert books into their organization" ON "public"."books"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = requesting_org_id()
);

DROP POLICY IF EXISTS "Users can delete books from their organization" ON "public"."books";
CREATE POLICY "Users can delete books from their organization" ON "public"."books"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  organization_id = requesting_org_id()
);

DROP POLICY IF EXISTS "Users can update books in their organization" ON "public"."books";
CREATE POLICY "Users can update books in their organization" ON "public"."books"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  organization_id = requesting_org_id()
)
WITH CHECK (
  organization_id = requesting_org_id()
);


-- Update Policies for 'organization_inventory'

DROP POLICY IF EXISTS "Users can view own org inventory" ON "public"."organization_inventory";
CREATE POLICY "Users can view own org inventory"
ON "public"."organization_inventory" FOR SELECT
TO authenticated
USING (
    organization_id = requesting_org_id()
);

DROP POLICY IF EXISTS "Users can insert into own org inventory" ON "public"."organization_inventory";
CREATE POLICY "Users can insert into own org inventory"
ON "public"."organization_inventory" FOR INSERT
TO authenticated
WITH CHECK (
    organization_id = requesting_org_id()
);

DROP POLICY IF EXISTS "Users can update own org inventory" ON "public"."organization_inventory";
CREATE POLICY "Users can update own org inventory"
ON "public"."organization_inventory" FOR UPDATE
TO authenticated
USING (
    organization_id = requesting_org_id()
)
WITH CHECK (
    organization_id = requesting_org_id()
);

DROP POLICY IF EXISTS "Users can delete from own org inventory" ON "public"."organization_inventory";
CREATE POLICY "Users can delete from own org inventory"
ON "public"."organization_inventory" FOR DELETE
TO authenticated
USING (
    organization_id = requesting_org_id()
);
