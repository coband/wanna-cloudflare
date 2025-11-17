create policy "Nur Admins / Superadmins dürfen hinzufügen"
on "public"."books"
as permissive
for insert
to authenticated
with check ((((select auth.jwt()) ->> 'app_role'::text) = ANY (ARRAY['admin'::text, 'superadmin'::text])));



