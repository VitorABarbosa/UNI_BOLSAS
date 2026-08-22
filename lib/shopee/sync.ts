import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/types/db';
import type { ShopeeRegion } from './config';
import { fetchShopCatalog, type ShopeeItemSnapshot } from './catalog';
import { getAuthorizedShop } from './tokens';
import { ShopeeApiError } from './client';

/**
 * Mirrors the Shopee catalog into `shopee_items`.
 *
 * The mirror is authoritative: items that vanished from Shopee are deleted
 * here too. The one thing we never overwrite is `product_id` — the mapping
 * between a Shopee item and a product of ours, set automatically by name on
 * first sight and editable by hand in /admin/shopee.
 */

type ShopeeItemInsert = Database['public']['Tables']['shopee_items']['Insert'];

export type SyncResult = {
  shopId: number;
  shopName: string | null;
  /** Items mirrored in this run. */
  itemCount: number;
  /** Rows deleted because the item no longer exists on Shopee. */
  removedCount: number;
  /** Items auto-linked to a product by name in this run. */
  autoLinkedCount: number;
  /** Slugs of products whose PDP changed and should be revalidated. */
  affectedSlugs: string[];
};

export async function syncShopeeCatalog(): Promise<SyncResult> {
  const shop = await getAuthorizedShop();
  const supabase = createAdminClient();

  try {
    const items = await fetchShopCatalog(
      { shopId: shop.shop_id, accessToken: shop.access_token },
      shop.region.toLowerCase() as ShopeeRegion,
    );

    const removedCount = await deleteVanishedItems(shop.shop_id, items);
    if (items.length > 0) {
      const { error } = await supabase
        .from('shopee_items')
        // product_id is deliberately absent from the payload: on conflict
        // Postgres only updates the columns we send, so an existing mapping
        // survives the sync.
        .upsert(items.map((item) => toRow(shop.shop_id, item)), {
          onConflict: 'item_id',
        });
      if (error) throw new Error(`sync: upsert failed: ${error.message}`);
    }

    const autoLinkedCount = await autoLinkByName(shop.shop_id);
    const affectedSlugs = await linkedProductSlugs(shop.shop_id);

    await supabase
      .from('shopee_shops')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_error: null,
        last_sync_item_count: items.length,
      })
      .eq('shop_id', shop.shop_id);

    return {
      shopId: shop.shop_id,
      shopName: shop.shop_name,
      itemCount: items.length,
      removedCount,
      autoLinkedCount,
      affectedSlugs,
    };
  } catch (err) {
    const message =
      err instanceof ShopeeApiError || err instanceof Error
        ? err.message
        : String(err);
    // Record the failure so the admin panel can show it without digging
    // through logs, then let the caller handle the error.
    await supabase
      .from('shopee_shops')
      .update({ last_sync_at: new Date().toISOString(), last_sync_error: message })
      .eq('shop_id', shop.shop_id);
    throw err;
  }
}

function toRow(shopId: number, item: ShopeeItemSnapshot): ShopeeItemInsert {
  return {
    shop_id: shopId,
    item_id: item.itemId,
    item_name: item.name,
    item_sku: item.sku,
    item_status: item.status,
    currency: item.currency,
    price: item.price,
    original_price: item.originalPrice,
    stock: item.stock,
    image_url: item.imageUrl,
    item_url: item.itemUrl,
    has_model: item.hasModel,
    shopee_update_time: item.updateTime,
    synced_at: new Date().toISOString(),
  };
}

async function deleteVanishedItems(
  shopId: number,
  items: ShopeeItemSnapshot[],
): Promise<number> {
  const supabase = createAdminClient();
  const { data: existing, error } = await supabase
    .from('shopee_items')
    .select('item_id')
    .eq('shop_id', shopId);

  if (error) throw new Error(`sync: read existing failed: ${error.message}`);

  const live = new Set(items.map((i) => i.itemId));
  const gone = (existing ?? [])
    .map((row) => row.item_id)
    .filter((id) => !live.has(id));
  if (gone.length === 0) return 0;

  const { error: deleteError } = await supabase
    .from('shopee_items')
    .delete()
    .eq('shop_id', shopId)
    .in('item_id', gone);
  if (deleteError) throw new Error(`sync: delete failed: ${deleteError.message}`);

  return gone.length;
}

/**
 * Links unmapped items to a product when the names match after
 * normalization, and the match is unambiguous on both sides.
 */
async function autoLinkByName(shopId: number): Promise<number> {
  const supabase = createAdminClient();

  const [{ data: items, error: itemsError }, { data: products, error: productsError }] =
    await Promise.all([
      supabase
        .from('shopee_items')
        .select('id, item_name')
        .eq('shop_id', shopId)
        .is('product_id', null),
      supabase.from('products').select('id, name'),
    ]);

  if (itemsError) throw new Error(`sync: read items failed: ${itemsError.message}`);
  if (productsError)
    throw new Error(`sync: read products failed: ${productsError.message}`);
  if (!items || items.length === 0 || !products || products.length === 0) return 0;

  // Products whose normalized name is ambiguous are skipped entirely.
  const byName = new Map<string, string | null>();
  for (const product of products) {
    const key = normalizeName(product.name);
    byName.set(key, byName.has(key) ? null : product.id);
  }

  const { data: taken } = await supabase
    .from('shopee_items')
    .select('product_id')
    .not('product_id', 'is', null);
  const alreadyLinked = new Set(
    (taken ?? []).map((row) => row.product_id).filter((id): id is string => !!id),
  );

  let linked = 0;
  for (const item of items) {
    const productId = byName.get(normalizeName(item.item_name));
    if (!productId || alreadyLinked.has(productId)) continue;

    const { error } = await supabase
      .from('shopee_items')
      .update({ product_id: productId })
      .eq('id', item.id);
    if (error) {
      console.warn(`[shopee] auto-link falhou para ${item.item_name}:`, error.message);
      continue;
    }
    alreadyLinked.add(productId);
    linked += 1;
  }

  return linked;
}

async function linkedProductSlugs(shopId: number): Promise<string[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('shopee_items')
    .select('product:products(slug)')
    .eq('shop_id', shopId)
    .not('product_id', 'is', null);

  if (error) {
    console.warn('[shopee] não foi possível listar slugs afetados:', error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => (row.product as { slug: string } | null)?.slug)
    .filter((slug): slug is string => !!slug);
}

/** lowercase, accent-free, alphanumeric-only — "Bolsa Matelassê" -> "bolsamatelasse". */
function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}
