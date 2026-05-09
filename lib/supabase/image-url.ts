/**
 * Build a public URL for an asset stored in the Supabase `products` bucket.
 *
 * The bucket is configured as public (Plano 01) so unsigned URLs work.
 * For signed/private use, switch to `storage.from('products').createSignedUrl(...)`.
 */
export function publicImageUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) {
    throw new Error(
      'publicImageUrl: NEXT_PUBLIC_SUPABASE_URL is not set. ' +
        'Define it in .env.local (see .env.example).',
    );
  }
  return `${base}/storage/v1/object/public/products/${storagePath}`;
}
