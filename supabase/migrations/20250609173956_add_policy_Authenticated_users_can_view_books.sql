alter table "public"."books" enable row level security;

create policy "Authenticated users can view books"
on "public"."books"
as permissive
for select
to authenticated
using (true);



