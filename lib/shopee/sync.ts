import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/types/db';
import type { ShopeeRegion } from './config';
import { fetchShopCatalog, type ShopeeItemSnapshot } from './catalog';
import { getAuthorizedShop } from './tokens';
import { ShopeeApiError } from './client';
import { importShopeeItem } from './import';

/**
 * Mirrors the Shopee catalog into `shopee_items`, then feeds our own catalog
 * from it.
 *
 * Each run, in order:
 *   1. mirror every item (name, description, photos, price, stock);
 *   2. mark as GONE what disappeared from Shopee — the imported product stays
 *      live on the site, since we keep selling it by WhatsApp;
 *   3. link items to existing products by name, when unambiguous;
 *   4. import still-unlinked items as new products, if the shop opted in;
 *   5. push Shopee's price onto every linked product — Shopee is the price of
 *      record, so the site never quotes a stale number.
 *
 * `product_id` is the one column the mirror never overwrites: it is the
 * mapping, set here or by hand in /admin/shopee.
 */

type ShopeeItemInsert = Database['public']['Tables']['shopee_items']['Insert'];

export type SyncResult = {
  shopId: number;
  shopName: string | null;
  /** Items mirrored in this run. */
  itemCount: number;
  /** Items that disappeared from Shopee and were marked GONE. */
  removedCount: number;
  /** Items auto-linked to an existing product by name in this run. */
  autoLinkedCount: number;
  /** Items imported as brand-new products in this run. */
  importedCount: number;
  /** Linked products whose price was pulled from Shopee in this run. */
  priceUpdatedCount: number;
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

    const removedCount = await markVanishedItems(shop.shop_id, items);
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
    const importedCount = shop.auto_import
      ? await importUnlinkedItems(shop.shop_id, shop.default_category_id)
      : 0;
    const priceUpdatedCount = await pushPricesToProducts(shop.shop_id);
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
      importedCount,
      priceUpdatedCount,
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
    description: item.description,
    item_sku: item.sku,
    item_status: item.status,
    currency: item.currency,
    price: item.price,
    original_price: item.originalPrice,
    stock: item.stock,
    image_url: item.imageUrl,
    image_urls: item.imageUrls,
    item_url: item.itemUrl,
    has_model: item.hasModel,
    shopee_update_time: item.updateTime,
    synced_at: new Date().toISOString(),
  };
}

/**
 * Items that vanished from Shopee (deleted, banned) are marked `GONE` instead
 * of being dropped: the product they were imported into stays on the site, and
 * keeping the row preserves the mapping — so an item that comes back is
 * recognized rather than imported a second time.
 */
async function markVanishedItems(
  shopId: number,
  items: ShopeeItemSnapshot[],
): Promise<number> {
  const supabase = createAdminClient();
  const { data: existing, error } = await supabase
    .from('shopee_items')
    .select('item_id')
    .eq('shop_id', shopId)
    .neq('item_status', 'GONE');

  if (error) throw new Error(`sync: read existing failed: ${error.message}`);

  const live = new Set(items.map((i) => i.itemId));
  const gone = (existing ?? [])
    .map((row) => row.item_id)
    .filter((id) => !live.has(id));
  if (gone.length === 0) return 0;

  const { error: updateError } = await supabase
    .from('shopee_items')
    .update({ item_status: 'GONE', stock: 0 })
    .eq('shop_id', shopId)
    .in('item_id', gone);
  if (updateError) throw new Error(`sync: mark gone failed: ${updateError.message}`);

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

/**
 * Creates a product for every still-unlinked item, when the shop turned the
 * automatic import on and picked a landing category. Bounded per run so a
 * misconfigured shop can't spend a whole cron window downloading photos.
 */
const MAX_AUTO_IMPORTS_PER_RUN = 25;

async function importUnlinkedItems(
  shopId: number,
  categoryId: string | null,
): Promise<number> {
  if (!categoryId) {
    console.warn('[shopee] auto_import ligado sem categoria padrão — nada importado');
    return 0;
  }

  const supabase = createAdminClient();
  const { data: items, error } = await supabase
    .from('shopee_items')
    .select('id, item_name')
    .eq('shop_id', shopId)
    .eq('item_status', 'NORMAL')
    .is('product_id', null)
    .limit(MAX_AUTO_IMPORTS_PER_RUN);

  if (error) throw new Error(`sync: read importable failed: ${error.message}`);
  if (!items || items.length === 0) return 0;

  let imported = 0;
  for (const item of items) {
    try {
      await importShopeeItem(item.id, categoryId);
      imported += 1;
    } catch (err) {
      // One bad listing shouldn't abort the run — the admin can retry it by
      // hand from the panel, where the error is visible.
      console.warn(`[shopee] import automático falhou para ${item.item_name}:`, err);
    }
  }

  if (items.length === MAX_AUTO_IMPORTS_PER_RUN) {
    console.warn(
      `[shopee] limite de ${MAX_AUTO_IMPORTS_PER_RUN} importações por run atingido — o resto entra na próxima sincronização`,
    );
  }

  return imported;
}

/**
 * Shopee is the price of record for linked products: whatever the listing
 * charges is what the site quotes.
 *
 * A Shopee devolve dois valores: `price` é o que o cliente paga hoje (já com
 * a promoção da loja aplicada) e `original_price` é o preço cheio. Antes só o
 * `price` era gravado, em `price_retail` — o site mostrava o valor
 * promocional como se fosse o normal e o desconto se perdia. Agora, quando há
 * diferença entre os dois, o cheio vai pro `price_retail` e o vigente pro
 * `price_promo`, e o site ganha o "de/por" sozinho.
 *
 * Promoções da Shopee não têm prazo conhecido aqui, então `promo_ends_at`
 * fica nulo: quem encerra é o próprio sync, no dia em que a Shopee voltar a
 * cobrar o preço cheio.
 *
 * Só o que mudou é escrito, pro trigger de `updated_at` não disparar em todo
 * produto a cada rodada.
 */
async function pushPricesToProducts(shopId: number): Promise<number> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('shopee_items')
    .select(
      'price, original_price, product:products(id, price_retail, price_promo)',
    )
    .eq('shop_id', shopId)
    .not('product_id', 'is', null)
    .not('price', 'is', null);

  if (error) throw new Error(`sync: read prices failed: ${error.message}`);

  let updated = 0;
  for (const row of data ?? []) {
    const product = row.product as {
      id: string;
      price_retail: number;
      price_promo: number | null;
    } | null;
    if (!product || row.price === null) continue;

    const current = Number(row.price);
    const original = row.original_price === null ? null : Number(row.original_price);
    const hasDiscount = original !== null && original > current;

    const nextRetail = hasDiscount ? original : current;
    const nextPromo = hasDiscount ? current : null;

    const sameRetail = Number(product.price_retail) === nextRetail;
    const samePromo =
      (product.price_promo === null ? null : Number(product.price_promo)) ===
      nextPromo;
    if (sameRetail && samePromo) continue;

    const { error: updateError } = await supabase
      .from('products')
      .update({ price_retail: nextRetail, price_promo: nextPromo })
      .eq('id', product.id);
    if (updateError) {
      console.warn(`[shopee] preço não atualizado para ${product.id}:`, updateError.message);
      continue;
    }
    updated += 1;
  }

  return updated;
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
