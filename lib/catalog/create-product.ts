import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { slugify } from '@/lib/slug';

/**
 * Creates a catalog product from an external source (a Shopee listing, a
 * spreadsheet row), copying its photos into our own Storage bucket.
 *
 * Shared by the two importers so a product created by either is
 * indistinguishable from one typed into the admin form: same slug rules, same
 * storage layout, same ordering.
 *
 * What no importer fills in: cores e tamanhos. Neither source gives us a hex
 * for a colour, and size variations don't map onto our `sizes` array — the
 * admin adds those in the product form afterwards.
 */

/** Our bucket caps each file at 5MB; listings rarely have more than 9 photos. */
const MAX_IMAGES = 9;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const EXT_FROM_MIME: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
};

export type NewProductInput = {
  name: string;
  description: string | null;
  /** BRL. Falls back to 0 when the source has no usable price. */
  price: number | null;
  categoryId: string;
  imageUrls: string[];
};

export type CreatedProduct = {
  productId: string;
  slug: string;
  name: string;
  /** Photos actually stored (a failed download is skipped, not fatal). */
  imageCount: number;
};

export async function createProductFromSource(
  input: NewProductInput,
): Promise<CreatedProduct> {
  const supabase = createAdminClient();

  const slug = await uniqueSlug(input.name);
  const sortOrder = await nextSortOrder();

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      slug,
      name: input.name,
      description: input.description,
      category_id: input.categoryId,
      price_retail: input.price ?? 0,
      active: true,
      sort_order: sortOrder,
    })
    .select('id, slug')
    .single();

  if (error) throw new Error(`createProduct: insert failed: ${error.message}`);

  const imageCount = await copyImagesFromUrls(product.id, input.imageUrls);

  return {
    productId: product.id,
    slug: product.slug,
    name: input.name,
    imageCount,
  };
}

/**
 * Downloads each photo and stores it under `<productId>/<uuid>.<ext>` — the
 * same layout the admin uploader uses. A photo that fails is skipped with a
 * warning: a product with 3 of 4 photos beats no product at all.
 */
export async function copyImagesFromUrls(
  productId: string,
  urls: string[],
): Promise<number> {
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
      console.warn(`[import] foto ${index + 1} não importada (${url}):`, err);
    }
  }

  return stored;
}

/** `bolsa-matelasse`, `bolsa-matelasse-2`, … — products.slug is unique. */
export async function uniqueSlug(name: string): Promise<string> {
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
export async function nextSortOrder(): Promise<number> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('products')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.sort_order ?? -1) + 1;
}
