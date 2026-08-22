import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { createProductFromSource } from '@/lib/catalog/create-product';

/**
 * Turns a mirrored Shopee listing into a real product of ours.
 *
 * The site is a showroom: the imported product is an ordinary row in
 * `products`, with its photos copied into our Storage bucket, so it gets the
 * full PDP (galeria, SEO, slug) and sells through the same WhatsApp CTA as
 * everything else. Nothing links back to the Shopee checkout.
 */

export type ImportResult = {
  productId: string;
  slug: string;
  name: string;
  /** Photos actually copied into Storage (a failed download is skipped). */
  imageCount: number;
};

export class ShopeeImportError extends Error {}

/**
 * Creates the product for one mirrored item and claims the mapping.
 * Throws `ShopeeImportError` for the expected refusals (already imported,
 * unknown item) so callers can surface them as messages, not 500s.
 */
export async function importShopeeItem(
  itemRowId: string,
  categoryId: string,
): Promise<ImportResult> {
  const supabase = createAdminClient();

  const { data: item, error } = await supabase
    .from('shopee_items')
    .select('id, item_name, description, price, product_id, image_urls, item_id')
    .eq('id', itemRowId)
    .maybeSingle();

  if (error) throw new Error(`importShopeeItem: read failed: ${error.message}`);
  if (!item) throw new ShopeeImportError('Item da Shopee não encontrado');
  if (item.product_id) {
    throw new ShopeeImportError('Este item já está vinculado a um produto');
  }

  const created = await createProductFromSource({
    name: item.item_name,
    description: item.description,
    // Shopee stays the price of record for imported products (see sync.ts).
    price: item.price,
    categoryId,
    imageUrls: item.image_urls,
  });

  // Claim the mapping last: if anything above threw, the item stays unlinked
  // and a retry is safe (it creates a fresh product rather than a half one).
  const { error: linkError } = await supabase
    .from('shopee_items')
    .update({ product_id: created.productId })
    .eq('id', item.id);

  if (linkError) {
    throw new Error(`importShopeeItem: link failed: ${linkError.message}`);
  }

  return created;
}
