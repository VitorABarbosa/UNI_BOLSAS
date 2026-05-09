import { createClient } from '@/lib/supabase/client';

const EXT_FROM_MIME: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/svg+xml': 'svg',
};

/**
 * Uploads a product image to the `products` storage bucket.
 *
 * Path layout: `<productId>/<random-uuid>.<ext>`. Extension is derived from
 * the original filename when possible, falling back to the MIME type, then
 * to `bin` (which the bucket's MIME allow-list will reject — surfacing the
 * problem at upload time rather than silently storing a misnamed file).
 *
 * Returns the storage path that should be persisted on `product_images.storage_path`.
 */
export async function uploadProductImage(file: File, productId: string): Promise<string> {
  const supabase = createClient();

  const fromName = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';
  const ext = fromName || EXT_FROM_MIME[file.type] || 'bin';
  const path = `${productId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from('products')
    .upload(path, file, { contentType: file.type, cacheControl: '3600' });

  if (error) throw new Error(error.message);
  return path;
}
