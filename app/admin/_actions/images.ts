'use server';

import { revalidatePath } from 'next/cache';
import {
  ImageInsertSchema,
  ImageUpdateAltSchema,
  ImageReorderSchema,
  type ImageInsertInput,
  type ImageUpdateAltInput,
  type ImageReorderInput,
} from '@/lib/validators/image';
import { requireAdmin } from '@/lib/auth/require-admin';
import { removeStorageObjects } from '@/lib/storage';

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

async function getProductSlug(
  supabase: Awaited<ReturnType<typeof requireAdmin>>['supabase'],
  productId: string,
) {
  const { data } = await supabase
    .from('products')
    .select('slug')
    .eq('id', productId)
    .single();
  return data?.slug ?? null;
}

export async function insertImage(
  input: ImageInsertInput,
): Promise<ActionResult<{ id: string; sort_order: number }>> {
  const { supabase } = await requireAdmin();
  const parsed = ImageInsertSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Dados inválidos',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  // Compute sort_order = max + 1 within the scope (product_id + color_id)
  let q = supabase
    .from('product_images')
    .select('sort_order')
    .eq('product_id', parsed.data.product_id)
    .order('sort_order', { ascending: false })
    .limit(1);
  q = parsed.data.color_id === null
    ? q.is('color_id', null)
    : q.eq('color_id', parsed.data.color_id);

  const { data: maxRow } = await q.maybeSingle();
  const nextSort = (maxRow?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from('product_images')
    .insert({ ...parsed.data, sort_order: nextSort })
    .select('id, sort_order')
    .single();
  if (error) return { ok: false, error: error.message };

  const slug = await getProductSlug(supabase, parsed.data.product_id);
  revalidatePath('/');
  if (slug) revalidatePath(`/produtos/${slug}`);

  return { ok: true, data: { id: data.id, sort_order: data.sort_order } };
}

export async function updateImageAlt(
  input: ImageUpdateAltInput,
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = ImageUpdateAltSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Dados inválidos',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { data: row } = await supabase
    .from('product_images')
    .select('product_id')
    .eq('id', parsed.data.id)
    .single();

  const { error } = await supabase
    .from('product_images')
    .update({ alt: parsed.data.alt })
    .eq('id', parsed.data.id);
  if (error) return { ok: false, error: error.message };

  if (row?.product_id) {
    const slug = await getProductSlug(supabase, row.product_id);
    revalidatePath('/');
    if (slug) revalidatePath(`/produtos/${slug}`);
  }

  return { ok: true, data: undefined };
}

export async function deleteImage(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();

  const { data: row } = await supabase
    .from('product_images')
    .select('storage_path, product_id, products(slug)')
    .eq('id', id)
    .single();

  if (row?.storage_path) {
    await removeStorageObjects([row.storage_path]);
  }

  const { error } = await supabase.from('product_images').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };

  const slug = (row?.products as unknown as { slug: string } | null)?.slug;
  revalidatePath('/');
  if (slug) revalidatePath(`/produtos/${slug}`);

  return { ok: true, data: undefined };
}

export async function reorderImages(
  input: ImageReorderInput,
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = ImageReorderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'IDs inválidos' };
  }

  const errors: string[] = [];
  await Promise.all(
    parsed.data.ordered_ids.map(async (id, i) => {
      // Constrain by scope (product + color) so a stray id can't escape it
      let q = supabase
        .from('product_images')
        .update({ sort_order: i })
        .eq('id', id)
        .eq('product_id', parsed.data.product_id);
      q = parsed.data.color_id === null
        ? q.is('color_id', null)
        : q.eq('color_id', parsed.data.color_id);
      const { error } = await q;
      if (error) errors.push(error.message);
    }),
  );
  if (errors.length > 0) return { ok: false, error: errors.join('; ') };

  const slug = await getProductSlug(supabase, parsed.data.product_id);
  revalidatePath('/');
  if (slug) revalidatePath(`/produtos/${slug}`);

  return { ok: true, data: undefined };
}
