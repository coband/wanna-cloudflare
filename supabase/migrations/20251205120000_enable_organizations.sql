-- 1. Schema Changes
ALTER TABLE "public"."books" DROP CONSTRAINT "books_isbn_key";
DROP INDEX IF EXISTS "public"."books_isbn_key";

-- Add organization_id
ALTER TABLE "public"."books" ADD COLUMN "organization_id" text;

-- Add index
CREATE INDEX "books_organization_id_idx" ON "public"."books" ("organization_id");

-- Add composite unique constraint
CREATE UNIQUE INDEX "books_isbn_org_key" ON "public"."books" ("isbn", "organization_id");
ALTER TABLE "public"."books" ADD CONSTRAINT "books_isbn_org_key" UNIQUE USING INDEX "books_isbn_org_key";

-- 2. Update Policies

-- VIEW (SELECT)
DROP POLICY IF EXISTS "Authenticated users can view books" ON "public"."books";
CREATE POLICY "Users can view books in their organization" ON "public"."books"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  organization_id = (auth.jwt() ->> 'org_id')
);

-- INSERT
DROP POLICY IF EXISTS "Nur Admins / Superadmins dürfen hinzufügen" ON "public"."books";
CREATE POLICY "Users can insert books into their organization" ON "public"."books"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = (auth.jwt() ->> 'org_id')
);

-- DELETE
DROP POLICY IF EXISTS "Nur Admins / Superadmins dürfen löschen" ON "public"."books";
CREATE POLICY "Users can delete books from their organization" ON "public"."books"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  organization_id = (auth.jwt() ->> 'org_id')
);

-- UPDATE
CREATE POLICY "Users can update books in their organization" ON "public"."books"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  organization_id = (auth.jwt() ->> 'org_id')
)
WITH CHECK (
  organization_id = (auth.jwt() ->> 'org_id')
);
