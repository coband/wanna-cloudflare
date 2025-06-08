alter table "public"."books" add column "author" text not null;

alter table "public"."books" add column "available" boolean not null default true;

alter table "public"."books" add column "borrowed_at" timestamp with time zone;

alter table "public"."books" add column "borrowed_by" uuid;

alter table "public"."books" add column "created_at" timestamp with time zone not null default now();

alter table "public"."books" add column "description" text;

alter table "public"."books" add column "has_pdf" boolean not null default false;

alter table "public"."books" add column "isbn" text;

alter table "public"."books" add column "level" text;

alter table "public"."books" add column "location" text;

alter table "public"."books" add column "publisher" text;

alter table "public"."books" add column "school" text;

alter table "public"."books" add column "subject" text;

alter table "public"."books" add column "title" text not null;

alter table "public"."books" add column "type" text;

alter table "public"."books" add column "user_id" uuid;

alter table "public"."books" add column "year" smallint;

CREATE UNIQUE INDEX books_isbn_key ON public.books USING btree (isbn);

alter table "public"."books" add constraint "books_isbn_key" UNIQUE using index "books_isbn_key";


