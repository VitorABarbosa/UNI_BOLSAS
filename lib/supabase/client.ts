import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/db';

/**
 * Supabase client for the browser. Use inside `'use client'` components.
 * Reads the public URL and anon key from `NEXT_PUBLIC_*` env vars.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
