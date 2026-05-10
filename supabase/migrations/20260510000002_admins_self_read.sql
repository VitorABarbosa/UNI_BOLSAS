-- Allow an authenticated user to SELECT only their own row in public.admins.
-- Used by signInAction, requireAdmin(), and login/page.tsx as a defense-in-depth
-- check on top of the `is_admin` JWT claim injected by custom_access_token_hook.
--
-- Without this policy, RLS-on + zero policies for `authenticated` blocks the
-- check and every admin request redirects to /admin/login?error=unauthorized.

create policy "admins_self_read"
on public.admins
as permissive
for select
to authenticated
using (user_id = (select auth.uid()));
