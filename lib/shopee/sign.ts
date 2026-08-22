import 'server-only';
import { createHmac } from 'node:crypto';

/**
 * HMAC-SHA256 request signing for the Shopee Open Platform v2.
 *
 * The base string depends on the API family:
 *   Public API  (auth/*, shop/auth_partner):
 *     partner_id + api_path + timestamp
 *   Shop API    (everything called on behalf of an authorized shop):
 *     partner_id + api_path + timestamp + access_token + shop_id
 *
 * The signature is the lowercase hex HMAC-SHA256 of that string, keyed by the
 * partner key. Note the base string uses the API PATH only — no query string,
 * no body — so param order never matters.
 */

/** Unix timestamp in seconds — what Shopee expects in `timestamp`. */
export function shopeeTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

export function signPublic(
  partnerKey: string,
  partnerId: number,
  apiPath: string,
  timestamp: number,
): string {
  return hmacHex(partnerKey, `${partnerId}${apiPath}${timestamp}`);
}

export function signShop(
  partnerKey: string,
  partnerId: number,
  apiPath: string,
  timestamp: number,
  accessToken: string,
  shopId: number,
): string {
  return hmacHex(
    partnerKey,
    `${partnerId}${apiPath}${timestamp}${accessToken}${shopId}`,
  );
}

function hmacHex(key: string, base: string): string {
  return createHmac('sha256', key).update(base).digest('hex');
}
