import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';

/**
 * Supabase admin client (service role). Bypasses ALL Row Level Security.
 *
 * Only callable from server-side code: the `'server-only'` import above
 * makes the module a build-time error if it ever lands in a Client
 * Component bundle. Use exclusively in scripts and trusted server code
 * (e.g. seed scripts, internal admin tasks).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  }
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
