import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { slugify } from '@/lib/slug';

/**
 * Turns a mirrored Shopee listing into a real product of ours.
 *
 * The site is a showroom: the imported product is an ordinary row in
 * `products`, with its photos copied into our Storage bucket, so it gets the
 * full PDP (galeria, SEO, slug) and sells through the same WhatsApp CTA as
 * everything else. Nothing links back to the Shopee checkout.
 *
 * What is NOT imported: cores (Shopee doesn't give us a hex) and tamanhos
 * (they live in the tier variations, which don't map 1:1 to our `sizes`).
 * The admin fills those in afterwards, in the normal product form.
 */

/** Shopee lists up to 9 photos; our bucket caps each file at 5MB. */
const MAX_IMAGES = 9;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const EXT_FROM_MIME: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
};

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

  const slug = await uniqueSlug(item.item_name);
  const sortOrder = await nextSortOrder();

  const { data: product, error: insertError } = await supabase
    .from('products')
    .insert({
      slug,
      name: item.item_name,
      description: item.description,
      category_id: categoryId,
      // Shopee is the price of record for imported products (see sync.ts).
      price_retail: item.price ?? 0,
      active: true,
      sort_order: sortOrder,
    })
    .select('id, slug')
    .single();

  if (insertError) {
    throw new Error(`importShopeeItem: insert failed: ${insertError.message}`);
  }

  const imageCount = await copyImages(product.id, item.image_urls);

  // Claim the mapping last: if anything above threw, the item stays unlinked
  // and a retry is safe (it creates a fresh product rather than a half one).
  const { error: linkError } = await supabase
    .from('shopee_items')
    .update({ product_id: product.id })
    .eq('id', item.id);

  if (linkError) {
    throw new Error(`importShopeeItem: link failed: ${linkError.message}`);
  }

  return { productId: product.id, slug: product.slug, name: item.item_name, imageCount };
}

/**
 * Downloads each photo and stores it under `<productId>/<uuid>.<ext>` — the
 * same layout the admin uploader uses. A photo that fails to download is
 * skipped with a warning: a product with 3 of 4 photos beats no product.
 */
async function copyImages(productId: string, urls: string[]): Promise<number> {
  const supabase = createAdminClient();
  let stored = 0;

  for (const [index, url] of urls.slice(0, MAX_IMAGES).entries()) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const contentType =
        (res.headers.get('content-type') ?? '').split(';')[0]?.trim() ?? '';
      const ext = EXT_FROM_MIME[contentType];
      if (!ext) throw new Error(`tipo não suportado: ${contentType || 'desconhecido'}`);

      const bytes = new Uint8Array(await res.arrayBuffer());
      if (bytes.byteLength > MAX_IMAGE_BYTES) {
        throw new Error(`imagem acima de 5MB (${Math.round(bytes.byteLength / 1024)}KB)`);
      }

      const path = `${productId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(path, bytes, { contentType, cacheControl: '3600' });
      if (uploadError) throw new Error(uploadError.message);

      const { error: rowError } = await supabase.from('product_images').insert({
        product_id: productId,
        color_id: null,
        storage_path: path,
        sort_order: stored,
      });
      if (rowError) throw new Error(rowError.message);

      stored += 1;
    } catch (err) {
      console.warn(`[shopee] foto ${index + 1} não importada (${url}):`, err);
    }
  }

  return stored;
}

/** `bolsa-matelasse`, `bolsa-matelasse-2`, … — products.slug is unique. */
async function uniqueSlug(name: string): Promise<string> {
  const supabase = createAdminClient();
  const base = slugify(name).slice(0, 55);

  const { data } = await supabase
    .from('products')
    .select('slug')
    .like('slug', `${base}%`);

  const taken = new Set((data ?? []).map((row) => row.slug));
  if (!taken.has(base)) return base;

  for (let n = 2; n < 1000; n += 1) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

/** New products land at the end of the catalog. */
async function nextSortOrder(): Promise<number> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('products')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.sort_order ?? -1) + 1;
}
