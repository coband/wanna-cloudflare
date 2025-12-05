-- 1. Create table: global_books
CREATE TABLE "public"."global_books" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "isbn" text,
    "title" text NOT NULL,
    "author" text NOT NULL,
    "publisher" text,
    "subject" text,
    "description" text,
    "year" integer,
    "level" text,
    "type" text,
    "cover_image" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "global_books_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "global_books_isbn_key" UNIQUE ("isbn")
);

-- RLS: global_books
ALTER TABLE "public"."global_books" ENABLE ROW LEVEL SECURITY;

-- Allow everyone (authenticated) to READ the catalog
CREATE POLICY "Authenticated users can select global_books"
ON "public"."global_books" FOR SELECT
TO authenticated
USING (true);

-- Allow everyone (authenticated) to INSERT into the catalog (Extend the library)
CREATE POLICY "Authenticated users can insert global_books"
ON "public"."global_books" FOR INSERT
TO authenticated
WITH CHECK (true);
-- Optionally: Update policy if we want users to correct typos in global books.

-- 2. Create table: organization_inventory
CREATE TABLE "public"."organization_inventory" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" text NOT NULL,
    "global_book_id" uuid NOT NULL,
    "location" text,
    "available" boolean DEFAULT true NOT NULL,
    "has_pdf" boolean DEFAULT false NOT NULL,
    "borrowed_by" text,
    "borrowed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "user_id" text, -- Who added it to inventory (audit)
    CONSTRAINT "organization_inventory_pkey" PRIMARY KEY ("id")
);

-- Foreign Key
ALTER TABLE "public"."organization_inventory"
    ADD CONSTRAINT "organization_inventory_global_book_id_fkey"
    FOREIGN KEY ("global_book_id")
    REFERENCES "public"."global_books"("id")
    ON DELETE RESTRICT;

-- Index for performance
CREATE INDEX "organization_inventory_org_idx" ON "public"."organization_inventory" ("organization_id");
CREATE INDEX "organization_inventory_global_book_idx" ON "public"."organization_inventory" ("global_book_id");

-- RLS: organization_inventory
ALTER TABLE "public"."organization_inventory" ENABLE ROW LEVEL SECURITY;

-- SELECT: Only my org
CREATE POLICY "Users can view own org inventory"
ON "public"."organization_inventory" FOR SELECT
TO authenticated
USING (
    organization_id = (auth.jwt() ->> 'org_id')
);

-- INSERT: Only to my org
CREATE POLICY "Users can insert into own org inventory"
ON "public"."organization_inventory" FOR INSERT
TO authenticated
WITH CHECK (
    organization_id = (auth.jwt() ->> 'org_id')
);

-- UPDATE: Only my org
CREATE POLICY "Users can update own org inventory"
ON "public"."organization_inventory" FOR UPDATE
TO authenticated
USING (
    organization_id = (auth.jwt() ->> 'org_id')
)
WITH CHECK (
    organization_id = (auth.jwt() ->> 'org_id')
);

-- DELETE: Only my org
CREATE POLICY "Users can delete from own org inventory"
ON "public"."organization_inventory" FOR DELETE
TO authenticated
USING (
    organization_id = (auth.jwt() ->> 'org_id')
);


-- 3. MIGRATION SCRIPT (Best Effort)
-- Migrate unique ISBNs from old 'books' table to 'global_books'
INSERT INTO "public"."global_books" (isbn, title, author, publisher, subject, description, year, level, type)
SELECT DISTINCT ON (isbn) isbn, title, author, publisher, subject, description, year::integer, level, type
FROM "public"."books"
WHERE isbn IS NOT NULL
ON CONFLICT (isbn) DO NOTHING;

-- Migrate inventory entries
-- Note: This assumes 'books' had an 'organization_id' column from previous step. 
-- If entries have no organization_id, they will be skipped (or assign a default if needed).
INSERT INTO "public"."organization_inventory" (organization_id, global_book_id, location, available, has_pdf, borrowed_by, borrowed_at, created_at, user_id)
SELECT 
    b.organization_id,
    gb.id,
    b.location,
    b.available,
    b.has_pdf,
    b.borrowed_by::text,
    b.borrowed_at,
    b.created_at,
    b.user_id
FROM "public"."books" b
JOIN "public"."global_books" gb ON b.isbn = gb.isbn
WHERE b.organization_id IS NOT NULL;
