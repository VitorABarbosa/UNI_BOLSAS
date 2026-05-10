import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/middleware';
import { isAdminClaim } from '@/lib/auth/is-admin-claim';

/**
 * Admin gate for /admin/*.
 *
 * Strategy:
 *   1. Bypass `/admin/login` so the login page itself is reachable (and we
 *      avoid redirect loops).
 *   2. Use `getClaims()` (JWT-only — zero DB roundtrip) to read the session
 *      and the `is_admin` claim injected by `custom_access_token_hook`.
 *   3. No session  → redirect to `/admin/login?next=<encoded original path>`.
 *   4. Session but not admin → redirect to `/admin/login?error=unauthorized`.
 *   5. Admin → return the `response` produced by `createMiddlewareClient`
 *      (carries refreshed Supabase auth cookies back to the browser).
 *
 * Runs on the Node.js runtime (Next 16 `proxy` does not support `edge`).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass /admin/login itself to avoid redirect loops.
  // This must come BEFORE creating the supabase client to skip wasted work.
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  const { supabase, response } = createMiddlewareClient(request);

  // getClaims() is JWT-only (zero DB roundtrip) — relies on the
  // custom_access_token_hook injecting `is_admin` at login time.
  const { data, error } = await supabase.auth.getClaims();

  // No session → redirect to login with `next` preserved.
  if (error || !data?.claims) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // Has session but not admin → redirect with error code.
  if (!isAdminClaim(data.claims as Record<string, unknown>)) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = '?error=unauthorized';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
