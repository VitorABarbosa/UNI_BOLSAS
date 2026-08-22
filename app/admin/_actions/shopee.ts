'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/require-admin';
import { syncShopeeCatalog, type SyncResult } from '@/lib/shopee/sync';
import { disconnectShop } from '@/lib/shopee/tokens';
import { ShopeeApiError } from '@/lib/shopee/client';

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/** Runs the same sync as the cron, on demand from /admin/shopee. */
export async function syncShopeeNow(): Promise<ActionResult<SyncResult>> {
  await requireAdmin();

  try {
    const result = await syncShopeeCatalog();
    revalidatePath('/admin/shopee');
    revalidatePath('/');
    for (const slug of result.affectedSlugs) revalidatePath(`/produtos/${slug}`);
    return { ok: true, data: result };
  } catch (err) {
    if (err instanceof ShopeeApiError) {
      return {
        ok: false,
        error: err.isAuthError
          ? `${err.message} — reconecte a loja.`
          : err.message,
      };
    }
    console.error('[shopee] sync manual falhou:', err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

const LinkSchema = z.object({
  itemRowId: z.string().uuid(),
  productId: z.string().uuid().nullable(),
});

/**
 * Points a Shopee item at one of our products (or clears the mapping when
 * `productId` is null). The partial unique index keeps it 1:1.
 */
export async function linkShopeeItem(
  input: z.infer<typeof LinkSchema>,
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = LinkSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Dados inválidos' };

  // Slugs to revalidate: the product being linked AND the one being unlinked.
  const { data: before } = await supabase
    .from('shopee_items')
    .select('product:products(slug)')
    .eq('id', parsed.data.itemRowId)
    .maybeSingle();

  const { error } = await supabase
    .from('shopee_items')
    .update({ product_id: parsed.data.productId })
    .eq('id', parsed.data.itemRowId);

  if (error) {
    if (error.code === '23505') {
      return { ok: false, error: 'Este produto já está vinculado a outro item da Shopee' };
    }
    return { ok: false, error: error.message };
  }

  const previousSlug = (before?.product as { slug: string } | null)?.slug;
  if (previousSlug) revalidatePath(`/produtos/${previousSlug}`);

  if (parsed.data.productId) {
    const { data: product } = await supabase
      .from('products')
      .select('slug')
      .eq('id', parsed.data.productId)
      .maybeSingle();
    if (product) revalidatePath(`/produtos/${product.slug}`);
  }

  revalidatePath('/admin/shopee');
  revalidatePath('/');
  return { ok: true, data: undefined };
}

const DisconnectSchema = z.object({ shopId: z.number().int().positive() });

/** Forgets the tokens. The cached items go with it (FK cascade). */
export async function disconnectShopeeShop(
  input: z.infer<typeof DisconnectSchema>,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = DisconnectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Dados inválidos' };

  try {
    await disconnectShop(parsed.data.shopId);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  revalidatePath('/admin/shopee');
  revalidatePath('/');
  return { ok: true, data: undefined };
}
