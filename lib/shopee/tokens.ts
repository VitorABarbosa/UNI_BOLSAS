import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { isMissingTable } from '@/lib/supabase/missing-table';
import type { Database } from '@/types/db';
import { shopeeConfig } from './config';
import { shopeeTimestamp, signPublic } from './sign';
import {
  ShopeeApiError,
  shopeePublicPost,
  shopeeShopGet,
  type ShopeeBaseResponse,
} from './client';

export type ShopeeShopRow = Database['public']['Tables']['shopee_shops']['Row'];

const PATH_AUTH_PARTNER = '/api/v2/shop/auth_partner';
const PATH_TOKEN_GET = '/api/v2/auth/token/get';
const PATH_TOKEN_REFRESH = '/api/v2/auth/access_token/get';
const PATH_SHOP_INFO = '/api/v2/shop/get_shop_info';

/** Shopee's refresh_token lifetime. Past this, re-authorization is required. */
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Refresh when the access token has less than this left (it lives ~4h). */
const REFRESH_MARGIN_MS = 15 * 60 * 1000;

type TokenResponse = ShopeeBaseResponse & {
  access_token?: string;
  refresh_token?: string;
  expire_in?: number;
};

type ShopInfoResponse = ShopeeBaseResponse & {
  shop_name?: string;
  region?: string;
};

/**
 * URL the admin is sent to in order to authorize the shop. Shopee appends
 * `?code=...&shop_id=...` to `redirect` after the seller confirms.
 */
export function shopeeAuthorizeUrl(): string {
  const { partnerId, partnerKey, baseUrl, redirectUrl } = shopeeConfig();
  const timestamp = shopeeTimestamp();
  const query = new URLSearchParams({
    partner_id: String(partnerId),
    timestamp: String(timestamp),
    sign: signPublic(partnerKey, partnerId, PATH_AUTH_PARTNER, timestamp),
    redirect: redirectUrl,
  });
  return `${baseUrl}${PATH_AUTH_PARTNER}?${query}`;
}

/** The connected shop, or null when nobody authorized yet. */
export async function getShopeeShop(): Promise<ShopeeShopRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('shopee_shops')
    .select('*')
    .order('authorized_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`getShopeeShop failed: ${error.message}`);
  return data;
}

/**
 * Por que a tela precisa disto em vez de chamar `getShopeeShop` direto: aquela
 * função lança, e é o certo pro cron (falha alta, visível no log). Numa página
 * um throw vira 500 e o admin fica sem entender o que houve — foi exatamente
 * assim que /admin/shopee caiu quando as tabelas da Shopee ainda não existiam
 * no banco. Aqui cada motivo vira um estado que a tela sabe explicar.
 */
export type ShopeeShopLookup =
  | { ok: true; shop: ShopeeShopRow | null }
  | { ok: false; reason: 'missing-tables' | 'no-credentials' | 'error'; message: string };

export async function lookupShopeeShop(): Promise<ShopeeShopLookup> {
  let supabase: ReturnType<typeof createAdminClient>;
  try {
    // Estoura quando falta SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL.
    supabase = createAdminClient();
  } catch (err) {
    return {
      ok: false,
      reason: 'no-credentials',
      message: err instanceof Error ? err.message : String(err),
    };
  }

  const { data, error } = await supabase
    .from('shopee_shops')
    .select('*')
    .order('authorized_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      reason: isMissingTable(error) ? 'missing-tables' : 'error',
      message: error.message,
    };
  }
  return { ok: true, shop: data };
}

/**
 * Exchanges the `code` from the authorization redirect for a token pair and
 * persists the shop. Idempotent per shop_id (upsert), so re-authorizing an
 * already-connected shop just rotates its tokens.
 */
export async function exchangeAuthCode(
  code: string,
  shopId: number,
): Promise<ShopeeShopRow> {
  const res = await shopeePublicPost<TokenResponse>(PATH_TOKEN_GET, {
    code,
    shop_id: shopId,
  });

  if (!res.access_token || !res.refresh_token) {
    throw new ShopeeApiError(
      'invalid_response',
      'token/get respondeu sem access_token/refresh_token',
      res.request_id,
    );
  }

  const { region } = shopeeConfig();
  const now = Date.now();
  const shopName = await fetchShopName(shopId, res.access_token);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('shopee_shops')
    .upsert(
      {
        shop_id: shopId,
        shop_name: shopName,
        region: region.toUpperCase(),
        access_token: res.access_token,
        refresh_token: res.refresh_token,
        expires_at: expiresAt(now, res.expire_in),
        refresh_expires_at: new Date(now + REFRESH_TOKEN_TTL_MS).toISOString(),
        authorized_at: new Date(now).toISOString(),
      },
      { onConflict: 'shop_id' },
    )
    .select('*')
    .single();

  if (error) throw new Error(`exchangeAuthCode: persist failed: ${error.message}`);
  return data;
}

/**
 * Returns the shop with a usable access token, refreshing it first when it is
 * expired or about to expire. Throws when no shop is connected or when the
 * refresh token itself has expired (seller must re-authorize).
 */
export async function getAuthorizedShop(): Promise<ShopeeShopRow> {
  const shop = await getShopeeShop();
  if (!shop) {
    throw new ShopeeApiError('not_connected', 'Nenhuma loja Shopee conectada');
  }

  const expiresInMs = new Date(shop.expires_at).getTime() - Date.now();
  if (expiresInMs > REFRESH_MARGIN_MS) return shop;

  if (new Date(shop.refresh_expires_at).getTime() <= Date.now()) {
    throw new ShopeeApiError(
      'error_auth_refresh_expired',
      'O refresh_token expirou (30 dias sem uso). Reconecte a loja.',
    );
  }

  return refreshShopToken(shop);
}

/** Rotates the token pair. Shopee may return a new refresh_token too. */
export async function refreshShopToken(
  shop: ShopeeShopRow,
): Promise<ShopeeShopRow> {
  const res = await shopeePublicPost<TokenResponse>(PATH_TOKEN_REFRESH, {
    refresh_token: shop.refresh_token,
    shop_id: shop.shop_id,
  });

  if (!res.access_token) {
    throw new ShopeeApiError(
      'invalid_response',
      'access_token/get respondeu sem access_token',
      res.request_id,
    );
  }

  const now = Date.now();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('shopee_shops')
    .update({
      access_token: res.access_token,
      // Shopee rotates the refresh token on most refreshes, but not always —
      // keep the old one when the response omits it.
      refresh_token: res.refresh_token ?? shop.refresh_token,
      expires_at: expiresAt(now, res.expire_in),
      refresh_expires_at: res.refresh_token
        ? new Date(now + REFRESH_TOKEN_TTL_MS).toISOString()
        : shop.refresh_expires_at,
    })
    .eq('shop_id', shop.shop_id)
    .select('*')
    .single();

  if (error) throw new Error(`refreshShopToken: persist failed: ${error.message}`);
  return data;
}

/** Drops the stored authorization (cascades to the cached items). */
export async function disconnectShop(shopId: number): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('shopee_shops')
    .delete()
    .eq('shop_id', shopId);
  if (error) throw new Error(`disconnectShop failed: ${error.message}`);
}

/** Best-effort: a missing shop name shouldn't fail the whole connection. */
async function fetchShopName(
  shopId: number,
  accessToken: string,
): Promise<string | null> {
  try {
    const info = await shopeeShopGet<ShopInfoResponse>(PATH_SHOP_INFO, {
      shopId,
      accessToken,
    });
    return info.shop_name ?? null;
  } catch (err) {
    console.warn('[shopee] get_shop_info falhou (seguindo sem o nome):', err);
    return null;
  }
}

function expiresAt(nowMs: number, expireInSeconds: number | undefined): string {
  // Shopee documents ~4h; fall back to 4h when the field is missing.
  const seconds = expireInSeconds && expireInSeconds > 0 ? expireInSeconds : 4 * 3600;
  return new Date(nowMs + seconds * 1000).toISOString();
}
