-- Grant supabase_auth_admin (the role that runs custom_access_token_hook)
-- access to read public.admins, otherwise the hook errors and GoTrue
-- returns 500 "Error running hook URI" on every login attempt.
--
-- Pattern from https://supabase.com/docs/guides/auth/auth-hooks

grant usage on schema public to supabase_auth_admin;
grant select on public.admins to supabase_auth_admin;

-- RLS is on for public.admins, so a SELECT grant alone isn't enough —
-- we also need an explicit policy for this role.
create policy "auth_admin_can_read_admins"
on public.admins
as permissive
for select
to supabase_auth_admin
using (true);
