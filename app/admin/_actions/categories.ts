'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { CategorySchema, type CategoryInput } from '@/lib/validators/category';
import { requireAdmin } from '@/lib/auth/require-admin';
import { removeStorageObjects } from '@/lib/storage';

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function upsertCategory(
  input: { id?: string } & CategoryInput,
): Promise<ActionResult<{ id: string }>> {
  const { supabase } = await requireAdmin();
  const parsed = CategorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Dados inválidos',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  if (input.id) {
    const { error } = await supabase
      .from('categories')
      .update(parsed.data)
      .eq('id', input.id);
    if (error) {
      if (error.code === '23505')
        return { ok: false, error: 'Slug já em uso', fieldErrors: { slug: ['já existe'] } };
      return { ok: false, error: error.message };
    }
    revalidatePath('/');
    revalidatePath('/sitemap.xml');
    return { ok: true, data: { id: input.id } };
  }

  const { data, error } = await supabase
    .from('categories')
    .insert(parsed.data)
    .select('id')
    .single();
  if (error) {
    if (error.code === '23505')
      return { ok: false, error: 'Slug já em uso', fieldErrors: { slug: ['já existe'] } };
    return { ok: false, error: error.message };
  }
  revalidatePath('/');
  revalidatePath('/sitemap.xml');
  return { ok: true, data: { id: data.id } };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();

  // Collect affected products (for revalidatePath of each PDP) and storage paths
  const { data: affectedProducts } = await supabase
    .from('products')
    .select('id, slug')
    .eq('category_id', id);

  const productIds = (affectedProducts ?? []).map((p) => p.id);
  let paths: string[] = [];
  if (productIds.length > 0) {
    const { data: imgs } = await supabase
      .from('product_images')
      .select('storage_path')
      .in('product_id', productIds);
    paths = (imgs ?? []).map((i) => i.storage_path);
  }

  // Best-effort storage cleanup BEFORE the cascade delete (rows about to vanish)
  if (paths.length > 0) await removeStorageObjects(paths);

  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/');
  revalidatePath('/sitemap.xml');
  for (const p of affectedProducts ?? []) revalidatePath(`/produtos/${p.slug}`);

  return { ok: true, data: undefined };
}

const ReorderSchema = z.array(z.string().uuid()).min(1);

export async function reorderCategories(orderedIds: string[]): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = ReorderSchema.safeParse(orderedIds);
  if (!parsed.success) return { ok: false, error: 'IDs inválidos' };

  // N updates in parallel — fine for small N (single-admin app, ~5-10 categories).
  // If this becomes a hotspot, refactor to a single RPC.
  const errors: string[] = [];
  await Promise.all(
    parsed.data.map(async (id, i) => {
      const { error } = await supabase
        .from('categories')
        .update({ sort_order: i })
        .eq('id', id);
      if (error) errors.push(error.message);
    }),
  );
  if (errors.length > 0) return { ok: false, error: errors.join('; ') };

  revalidatePath('/');
  return { ok: true, data: undefined };
}
