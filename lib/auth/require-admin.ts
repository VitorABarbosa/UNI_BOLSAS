import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Server-side guard for Server Components and Server Actions.
 *
 * - Uses `getUser()` (NOT `getSession()` — `getSession` is unsafe per Supabase guidance,
 *   it doesn't re-validate the JWT against the auth server).
 * - Confirms presence in `admins` table (defense in depth, even with the
 *   `is_admin` JWT claim from `custom_access_token_hook`).
 * - Redirects to `/admin/login` on failure.
 *
 * Returns the authenticated user + the cookie-bound supabase client (so
 * callers don't need to instantiate it again).
 *
 * Note: `redirect()` throws `NEXT_REDIRECT`. Don't wrap calls to this helper
 * in try/catch — let it propagate.
 */
export async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/admin/login');
  }

  const { data: admin } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!admin) {
    redirect('/admin/login?error=unauthorized');
  }

  return { user, supabase };
}
