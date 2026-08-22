import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { shopeeAuthorizeUrl } from '@/lib/shopee/tokens';

/**
 * Step 1 of the shop authorization: bounce the admin to Shopee's consent
 * screen. Shopee then redirects back to /api/shopee/callback with `code` and
 * `shop_id`.
 *
 * Admin-gated here rather than by the proxy: the proxy only matches /admin/*.
 */
export async function GET(request: NextRequest) {
  await requireAdmin();

  try {
    return NextResponse.redirect(shopeeAuthorizeUrl());
  } catch (err) {
    console.error('[shopee] authorize falhou:', err);
    return NextResponse.redirect(
      new URL('/admin/shopee?error=config', request.url),
    );
  }
}
