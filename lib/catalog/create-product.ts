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
 * Colours are optional: the spreadsheet importer recognizes them from the
 * Shopee variation names and passes a hex along, and Shopee often has a photo
 * per colour — those land on the right swatch instead of the generic gallery.
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

type ImageType = { ext: string; contentType: string };

/**
 * Identifies an image by its magic bytes.
 *
 * Shopee's CDN serves photos from extension-less URLs (…/file/br-11134207-…),
 * so neither the URL nor a possibly-generic `content-type` header can be
 * trusted. Reading the first bytes is the only reliable answer, and it keeps a
 * mislabelled response from silently costing us every photo of an import.
 */
function sniffImageType(bytes: Uint8Array): ImageType | null {
  const startsWith = (...signature: number[]) =>
    signature.every((byte, i) => bytes[i] === byte);

  if (startsWith(0xff, 0xd8, 0xff)) return { ext: 'jpg', contentType: 'image/jpeg' };
  if (startsWith(0x89, 0x50, 0x4e, 0x47)) return { ext: 'png', contentType: 'image/png' };
  // RIFF....WEBP
  if (
    startsWith(0x52, 0x49, 0x46, 0x46) &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return { ext: 'webp', contentType: 'image/webp' };
  }
  return null;
}

export type NewProductInput = {
  name: string;
  description: string | null;
  /** BRL. Falls back to 0 when the source has no usable price. */
  price: number | null;
  categoryId: string;
  /** Gallery photos, shown for every colour. */
  imageUrls: string[];
  /** Colour swatches, each with its own photo when the source has one. */
  colors?: { name: string; hex: string; imageUrl: string | null }[];
  /** Defaults to the column default ('Único') when empty. */
  sizes?: string[];
};

export type CreatedProduct = {
  productId: string;
  slug: string;
  name: string;
  /** Photos actually stored (a failed download is skipped, not fatal). */
  imageCount: number;
  colorCount: number;
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
      ...(input.sizes && input.sizes.length > 0 ? { sizes: input.sizes } : {}),
    })
    .select('id, slug')
    .single();

  if (error) throw new Error(`createProduct: insert failed: ${error.message}`);

  const colors = await createColors(product.id, input.colors ?? []);

  // Per-colour photos first, so each swatch has its own shot; the rest of the
  // gallery is shared (color_id null) and shows for every colour.
  let imageCount = 0;
  for (const color of colors) {
    if (color.imageUrl) {
      imageCount += await copyImagesFromUrls(product.id, [color.imageUrl], color.id);
    }
  }
  imageCount += await copyImagesFromUrls(product.id, input.imageUrls);

  return {
    productId: product.id,
    slug: product.slug,
    name: input.name,
    imageCount,
    colorCount: colors.length,
  };
}

/** Inserts the swatches in the order the source listed them. */
async function createColors(
  productId: string,
  colors: NonNullable<NewProductInput['colors']>,
): Promise<{ id: string; imageUrl: string | null }[]> {
  if (colors.length === 0) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('product_colors')
    .insert(
      colors.map((color, index) => ({
        product_id: productId,
        name: color.name,
        hex: color.hex,
        sort_order: index,
      })),
    )
    .select('id, name');

  if (error) {
    // A product without swatches is still a usable product — don't lose it.
    console.warn(`[import] cores não criadas para ${productId}:`, error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    imageUrl: colors.find((c) => c.name === row.name)?.imageUrl ?? null,
  }));
}

/**
 * Downloads each photo and stores it under `<productId>/<uuid>.<ext>` — the
 * same layout the admin uploader uses. A photo that fails is skipped with a
 * warning: a product with 3 of 4 photos beats no product at all.
 */
export async function copyImagesFromUrls(
  productId: string,
  urls: string[],
  colorId: string | null = null,
): Promise<number> {
  const supabase = createAdminClient();
  let stored = 0;

  for (const [index, url] of urls.slice(0, MAX_IMAGES).entries()) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const bytes = new Uint8Array(await res.arrayBuffer());
      if (bytes.byteLength > MAX_IMAGE_BYTES) {
        throw new Error(`imagem acima de 5MB (${Math.round(bytes.byteLength / 1024)}KB)`);
      }

      // The header is a hint; the bytes are the truth.
      const header = (res.headers.get('content-type') ?? '').split(';')[0]?.trim() ?? '';
      const declared = EXT_FROM_MIME[header]
        ? { ext: EXT_FROM_MIME[header]!, contentType: header }
        : null;
      const type = sniffImageType(bytes) ?? declared;
      if (!type) {
        throw new Error(
          `não é uma imagem suportada (content-type: ${header || 'ausente'})`,
        );
      }

      const path = `${productId}/${crypto.randomUUID()}.${type.ext}`;
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(path, bytes, { contentType: type.contentType, cacheControl: '3600' });
      if (uploadError) throw new Error(uploadError.message);

      const { error: rowError } = await supabase.from('product_images').insert({
        product_id: productId,
        color_id: colorId,
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
