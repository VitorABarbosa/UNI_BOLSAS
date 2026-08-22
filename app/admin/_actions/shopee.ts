'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/require-admin';
import { syncShopeeCatalog, type SyncResult } from '@/lib/shopee/sync';
import { disconnectShop } from '@/lib/shopee/tokens';
import { ShopeeApiError } from '@/lib/shopee/client';
import {
  importShopeeItem,
  ShopeeImportError,
  type ImportResult,
} from '@/lib/shopee/import';
import { createAdminClient } from '@/lib/supabase/admin';

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

const ImportSchema = z.object({
  itemRowId: z.string().uuid(),
  categoryId: z.string().uuid(),
});

/** Creates a product from one Shopee item (photos included). */
export async function importShopeeItemToCatalog(
  input: z.infer<typeof ImportSchema>,
): Promise<ActionResult<ImportResult>> {
  await requireAdmin();
  const parsed = ImportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Dados inválidos' };

  try {
    const result = await importShopeeItem(
      parsed.data.itemRowId,
      parsed.data.categoryId,
    );
    revalidateCatalog(result.slug);
    return { ok: true, data: result };
  } catch (err) {
    if (err instanceof ShopeeImportError) return { ok: false, error: err.message };
    console.error('[shopee] import falhou:', err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

const ImportAllSchema = z.object({ categoryId: z.string().uuid() });

/**
 * Imports every unlinked listing that is live on Shopee. Partial success is
 * the normal outcome — the count of failures comes back so the panel can say
 * so instead of pretending everything worked.
 */
export async function importAllShopeeItems(
  input: z.infer<typeof ImportAllSchema>,
): Promise<ActionResult<{ imported: number; failed: number }>> {
  await requireAdmin();
  const parsed = ImportAllSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Dados inválidos' };

  const supabase = createAdminClient();
  const { data: items, error } = await supabase
    .from('shopee_items')
    .select('id')
    .eq('item_status', 'NORMAL')
    .is('product_id', null);

  if (error) return { ok: false, error: error.message };
  if (!items || items.length === 0) {
    return { ok: false, error: 'Nenhum item pendente para importar' };
  }

  let imported = 0;
  let failed = 0;
  for (const item of items) {
    try {
      await importShopeeItem(item.id, parsed.data.categoryId);
      imported += 1;
    } catch (err) {
      console.warn('[shopee] import em lote falhou para', item.id, err);
      failed += 1;
    }
  }

  revalidateCatalog();
  return { ok: true, data: { imported, failed } };
}

const SettingsSchema = z.object({
  shopId: z.number().int().positive(),
  defaultCategoryId: z.string().uuid().nullable(),
  autoImport: z.boolean(),
});

/** Where automatic imports land, and whether the cron may run them at all. */
export async function updateShopeeImportSettings(
  input: z.infer<typeof SettingsSchema>,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = SettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Dados inválidos' };

  if (parsed.data.autoImport && !parsed.data.defaultCategoryId) {
    return {
      ok: false,
      error: 'Escolha a categoria padrão antes de ligar a importação automática',
    };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('shopee_shops')
    .update({
      default_category_id: parsed.data.defaultCategoryId,
      auto_import: parsed.data.autoImport,
    })
    .eq('shop_id', parsed.data.shopId);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/shopee');
  return { ok: true, data: undefined };
}

/** The home lists the catalog; each PDP is its own ISR entry. */
function revalidateCatalog(slug?: string) {
  revalidatePath('/admin/shopee');
  revalidatePath('/');
  revalidatePath('/sitemap.xml');
  if (slug) revalidatePath(`/produtos/${slug}`);
}
