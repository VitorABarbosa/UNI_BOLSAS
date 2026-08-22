import type { Database } from '@/types/db';

/**
 * Shared (client-safe) view of a mirrored Shopee listing.
 *
 * Lives outside `lib/shopee/*` on purpose: those modules are `server-only`
 * (they hold the partner key), while this one is imported by the PDP.
 */

type ShopeeItemRow = Database['public']['Tables']['shopee_items']['Row'];

export type ShopeeOffer = Pick<
  ShopeeItemRow,
  'item_id' | 'item_url' | 'price' | 'stock' | 'item_status' | 'synced_at'
>;

/**
 * The offer worth showing on the site: an item that is actually listed
 * (`NORMAL`). Unlisted/banned items stay in the mirror for the admin panel
 * but never reach the public page.
 */
export function activeShopeeOffer(
  offers: ShopeeOffer[] | null | undefined,
): ShopeeOffer | null {
  return offers?.find((o) => o.item_status === 'NORMAL') ?? null;
}

/**
 * `stock === null` means Shopee didn't report a number (some listings omit
 * it) — treat that as "available" rather than hiding a live item.
 */
export function isShopeeSoldOut(offer: ShopeeOffer): boolean {
  return offer.stock !== null && offer.stock <= 0;
}
