create policy "Nur Admins / Superadmins dürfen löschen"
on "public"."books"
as permissive
for delete
to authenticated
using ((((select auth.jwt()) ->> 'app_role'::text) = ANY (ARRAY['admin'::text, 'superadmin'::text])));



