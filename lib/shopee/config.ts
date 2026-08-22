import 'server-only';

/**
 * Shopee Open Platform config.
 *
 * Only `SHOPEE_PARTNER_ID` / `SHOPEE_PARTNER_KEY` are secret — they come from
 * Console App > App Detail on open.shopee.com after the app is approved.
 * Nothing here may be prefixed NEXT_PUBLIC_: the partner key signs every call.
 */

/** Base URLs per Shopee region. BR shops live on the .com.br host. */
const BASE_URLS = {
  br: 'https://openplatform.shopee.com.br',
  global: 'https://partner.shopeemobile.com',
  sandbox: 'https://openplatform.sandbox.test-stable.shopee.sg',
} as const;

export type ShopeeRegion = keyof typeof BASE_URLS;

function readRegion(): ShopeeRegion {
  const raw = (process.env.SHOPEE_REGION ?? 'br').toLowerCase();
  if (raw in BASE_URLS) return raw as ShopeeRegion;
  throw new Error(
    `SHOPEE_REGION="${raw}" is invalid. Use one of: ${Object.keys(BASE_URLS).join(', ')}`,
  );
}

export type ShopeeConfig = {
  partnerId: number;
  partnerKey: string;
  region: ShopeeRegion;
  baseUrl: string;
  redirectUrl: string;
};

/**
 * Throws when the app isn't configured — callers should catch and surface
 * "loja não conectada" instead of 500ing.
 */
export function shopeeConfig(): ShopeeConfig {
  const partnerId = Number(process.env.SHOPEE_PARTNER_ID);
  const partnerKey = process.env.SHOPEE_PARTNER_KEY;

  if (!Number.isInteger(partnerId) || partnerId <= 0) {
    throw new Error('SHOPEE_PARTNER_ID is not set (or is not a number)');
  }
  if (!partnerKey) {
    throw new Error('SHOPEE_PARTNER_KEY is not set');
  }

  const region = readRegion();
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  ).replace(/\/$/, '');

  return {
    partnerId,
    partnerKey,
    region,
    baseUrl: BASE_URLS[region],
    // Must match, byte for byte, one of the redirect URLs registered in
    // Console App — Shopee rejects the authorization otherwise.
    redirectUrl:
      process.env.SHOPEE_REDIRECT_URL ?? `${siteUrl}/api/shopee/callback`,
  };
}

/** True when the partner credentials are present (no throw). */
export function isShopeeConfigured(): boolean {
  try {
    shopeeConfig();
    return true;
  } catch {
    return false;
  }
}

/** Public storefront URL of an item, for the "comprar na Shopee" CTA. */
export function shopeeItemUrl(
  shopId: number,
  itemId: number,
  region: ShopeeRegion,
): string {
  const host = region === 'br' ? 'https://shopee.com.br' : 'https://shopee.sg';
  return `${host}/product/${shopId}/${itemId}`;
}
