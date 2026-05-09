import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/db';

/**
 * Cookie-aware Supabase client for Next.js middleware.
 *
 * Returns the supabase instance + a `NextResponse` with refreshed cookies.
 * The caller MUST return this `response` from the middleware (or merge its
 * cookies/headers into any other response it returns) so that refreshed
 * Supabase auth cookies make it back to the browser.
 *
 * Edge-compatible: uses only `@supabase/ssr` and `next/server` — no
 * `next/headers`, no `'server-only'`, no Node-specific APIs.
 *
 * Pattern: https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  return { supabase, response };
}
