import { redirectToSite } from '@/lib/public-redirect';
import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { exchangeAuthCode } from '@/lib/shopee/tokens';

/**
 * Step 2: Shopee sends the seller back here with `code` + `shop_id`. The code
 * is single-use and short-lived, so it is exchanged for the token pair right
 * away and persisted.
 *
 * The Shopee redirect is a top-level GET navigation, so the admin's Supabase
 * cookies ride along and `requireAdmin` still gates it — nobody can plant a
 * shop by calling this URL.
 */
export async function GET(request: NextRequest) {
  await requireAdmin();

  const code = request.nextUrl.searchParams.get('code');
  const shopId = Number(request.nextUrl.searchParams.get('shop_id'));

  if (!code || !Number.isInteger(shopId) || shopId <= 0) {
    return redirectToSite('/admin/shopee?error=callback_params');
  }

  try {
    const shop = await exchangeAuthCode(code, shopId);
    return redirectToSite(`/admin/shopee?connected=${shop.shop_id}`);
  } catch (err) {
    console.error('[shopee] troca do code falhou:', err);
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    return redirectToSite(`/admin/shopee?error=${encodeURIComponent(message)}`);
  }
}
