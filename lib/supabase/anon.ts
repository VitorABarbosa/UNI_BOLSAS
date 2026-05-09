import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';

/**
 * Stateless anon-key Supabase client safe to use during build time
 * (generateStaticParams, sitemap.ts) — no cookies, no headers context.
 * RLS still enforces public-read policies, so it can't see admin data.
 */
export function createAnonClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
