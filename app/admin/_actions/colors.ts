'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ColorSchema, type ColorInput } from '@/lib/validators/color';
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

export async function upsertColor(
  productId: string,
  input: { id?: string } & ColorInput,
): Promise<ActionResult<{ id: string }>> {
  const { supabase } = await requireAdmin();
  const parsed = ColorSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Dados inválidos',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  if (input.id) {
    const { error } = await supabase
      .from('product_colors')
      .update(parsed.data)
      .eq('id', input.id)
      .eq('product_id', productId); // safety: bind to product
    if (error) return { ok: false, error: error.message };
    const slug = await getProductSlug(supabase, productId);
    revalidatePath('/');
    if (slug) revalidatePath(`/produtos/${slug}`);
    return { ok: true, data: { id: input.id } };
  }

  const { data, error } = await supabase
    .from('product_colors')
    .insert({ ...parsed.data, product_id: productId })
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };

  const slug = await getProductSlug(supabase, productId);
  revalidatePath('/');
  if (slug) revalidatePath(`/produtos/${slug}`);

  return { ok: true, data: { id: data.id } };
}

export async function deleteColor(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();

  // Collect storage paths + product slug before delete
  const { data: imgs } = await supabase
    .from('product_images')
    .select('storage_path')
    .eq('color_id', id);

  const { data: colorRow } = await supabase
    .from('product_colors')
    .select('product_id, products(slug)')
    .eq('id', id)
    .single();

  const paths = (imgs ?? []).map((i) => i.storage_path);
  if (paths.length > 0) await removeStorageObjects(paths);

  const { error } = await supabase.from('product_colors').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };

  const slug = (colorRow?.products as unknown as { slug: string } | null)?.slug;
  revalidatePath('/');
  if (slug) revalidatePath(`/produtos/${slug}`);

  return { ok: true, data: undefined };
}

const ReorderSchema = z.object({
  productId: z.string().uuid(),
  orderedIds: z.array(z.string().uuid()).min(1),
});

export async function reorderColors(
  productId: string,
  orderedIds: string[],
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = ReorderSchema.safeParse({ productId, orderedIds });
  if (!parsed.success) return { ok: false, error: 'IDs inválidos' };

  const errors: string[] = [];
  await Promise.all(
    parsed.data.orderedIds.map(async (id, i) => {
      const { error } = await supabase
        .from('product_colors')
        .update({ sort_order: i })
        .eq('id', id)
        .eq('product_id', parsed.data.productId);
      if (error) errors.push(error.message);
    }),
  );
  if (errors.length > 0) return { ok: false, error: errors.join('; ') };

  const slug = await getProductSlug(supabase, productId);
  revalidatePath('/');
  if (slug) revalidatePath(`/produtos/${slug}`);

  return { ok: true, data: undefined };
}
