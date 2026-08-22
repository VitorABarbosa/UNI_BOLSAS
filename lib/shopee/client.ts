import 'server-only';
import { shopeeConfig } from './config';
import { shopeeTimestamp, signPublic, signShop } from './sign';

/**
 * Thin signed-fetch layer over the Shopee Open Platform v2.
 *
 * Every call carries `partner_id`, `timestamp` and `sign` in the query string;
 * shop-scoped calls add `access_token` + `shop_id`. Shopee answers HTTP 200
 * even for business errors — the failure lives in the `error` field — so the
 * status code alone is never enough.
 */

const TIMEOUT_MS = 30_000;

export type ShopeeBaseResponse = {
  error?: string;
  message?: string;
  request_id?: string;
  warning?: string;
};

export class ShopeeApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly requestId?: string,
  ) {
    super(`Shopee API ${code}: ${message}`);
    this.name = 'ShopeeApiError';
  }

  /**
   * Auth-family errors: the shop must re-authorize (the refresh token is dead
   * or was revoked). Distinguished from transient errors so the sync job can
   * report "reconecte a loja" instead of retrying forever.
   */
  get isAuthError(): boolean {
    return (
      this.code.startsWith('error_auth') ||
      this.code === 'error_token' ||
      this.code === 'invalid_access_token' ||
      this.code === 'access_token_error' ||
      this.code === 'error_permission'
    );
  }
}

type ShopAuth = { shopId: number; accessToken: string };

/** Public (unauthenticated) POST — used by the token endpoints. */
export async function shopeePublicPost<T extends ShopeeBaseResponse>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const { partnerId, partnerKey, baseUrl } = shopeeConfig();
  const timestamp = shopeeTimestamp();
  const query = new URLSearchParams({
    partner_id: String(partnerId),
    timestamp: String(timestamp),
    sign: signPublic(partnerKey, partnerId, path, timestamp),
  });

  return send<T>(`${baseUrl}${path}?${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, partner_id: partnerId }),
  });
}

/**
 * Shop-scoped GET. `query` values may repeat (Shopee takes `item_status`
 * several times), hence the array form.
 */
export async function shopeeShopGet<T extends ShopeeBaseResponse>(
  path: string,
  auth: ShopAuth,
  query: Record<string, string | string[]> = {},
): Promise<T> {
  const { partnerId, partnerKey, baseUrl } = shopeeConfig();
  const timestamp = shopeeTimestamp();
  const params = new URLSearchParams({
    partner_id: String(partnerId),
    timestamp: String(timestamp),
    access_token: auth.accessToken,
    shop_id: String(auth.shopId),
    sign: signShop(
      partnerKey,
      partnerId,
      path,
      timestamp,
      auth.accessToken,
      auth.shopId,
    ),
  });
  for (const [key, value] of Object.entries(query)) {
    for (const v of Array.isArray(value) ? value : [value]) {
      if (v !== '') params.append(key, v);
    }
  }

  return send<T>(`${baseUrl}${path}?${params}`, { method: 'GET' });
}

async function send<T extends ShopeeBaseResponse>(
  url: string,
  init: RequestInit,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new ShopeeApiError('network_error', reason);
  }

  const text = await res.text();
  let json: T;
  try {
    json = JSON.parse(text) as T;
  } catch {
    throw new ShopeeApiError(
      'invalid_response',
      `HTTP ${res.status}: ${text.slice(0, 300)}`,
    );
  }

  // `error` is present-but-empty on success — only a non-empty value fails.
  if (json.error) {
    throw new ShopeeApiError(
      json.error,
      json.message ?? 'sem mensagem',
      json.request_id,
    );
  }
  if (!res.ok) {
    throw new ShopeeApiError('http_error', `HTTP ${res.status}`);
  }

  return json;
}
