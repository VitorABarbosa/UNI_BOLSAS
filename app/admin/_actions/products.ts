'use server';

import { revalidatePath } from 'next/cache';
import { ProductSchema, type ProductInput } from '@/lib/validators/product';
import { requireAdmin } from '@/lib/auth/require-admin';
import { removeStorageObjects } from '@/lib/storage';

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createProduct(
  input: ProductInput,
): Promise<ActionResult<{ id: string }>> {
  const { supabase } = await requireAdmin();
  const parsed = ProductSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Dados inválidos',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { data, error } = await supabase
    .from('products')
    .insert(parsed.data)
    .select('id, slug')
    .single();
  if (error) {
    if (error.code === '23505')
      return { ok: false, error: 'Slug já em uso', fieldErrors: { slug: ['já existe'] } };
    return { ok: false, error: error.message };
  }

  revalidatePath('/');
  revalidatePath('/sitemap.xml');
  revalidatePath(`/produtos/${data.slug}`);

  return { ok: true, data: { id: data.id } };
}

export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = ProductSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Dados inválidos',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { data: prev } = await supabase
    .from('products')
    .select('slug')
    .eq('id', id)
    .single();

  const { error } = await supabase.from('products').update(parsed.data).eq('id', id);
  if (error) {
    if (error.code === '23505')
      return { ok: false, error: 'Slug já em uso', fieldErrors: { slug: ['já existe'] } };
    return { ok: false, error: error.message };
  }

  revalidatePath('/');
  revalidatePath('/sitemap.xml');
  if (prev?.slug && prev.slug !== parsed.data.slug)
    revalidatePath(`/produtos/${prev.slug}`);
  revalidatePath(`/produtos/${parsed.data.slug}`);

  return { ok: true, data: undefined };
}

/**
 * Tira o produto do site sem apagá-lo do banco.
 *
 * É o caminho certo pra "esse produto não faz sentido aqui": a linha continua
 * existindo, então a importação da planilha reconhece o nome e PULA. Excluir
 * de verdade apaga essa memória, e a importação seguinte recria o produto —
 * foi o que aconteceu quando os produtos removidos voltaram sozinhos.
 */
export async function setProductActive(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();

  const { data: product, error } = await supabase
    .from('products')
    .update({ active })
    .eq('id', id)
    .select('slug')
    .single();
  if (error) return { ok: false, error: error.message };

  revalidatePath('/');
  revalidatePath('/sitemap.xml');
  revalidatePath('/admin/produtos');
  if (product?.slug) revalidatePath(`/produtos/${product.slug}`);

  return { ok: true, data: undefined };
}

/**
 * A mesma coisa, para vários de uma vez.
 *
 * Um `update ... in (...)` em vez de N chamadas: tirar trinta produtos do site
 * vira uma ida ao banco, não trinta. Devolve quantos mudaram de fato, que é o
 * número que a tela mostra.
 */
export async function setProductsActive(
  ids: string[],
  active: boolean,
): Promise<ActionResult<{ count: number }>> {
  const { supabase } = await requireAdmin();
  if (ids.length === 0) return { ok: true, data: { count: 0 } };

  const { data, error } = await supabase
    .from('products')
    .update({ active })
    .in('id', ids)
    .select('slug');
  if (error) return { ok: false, error: error.message };

  revalidatePath('/');
  revalidatePath('/sitemap.xml');
  revalidatePath('/admin/produtos');
  for (const p of data ?? []) revalidatePath(`/produtos/${p.slug}`);

  return { ok: true, data: { count: data?.length ?? 0 } };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();

  const { data: product } = await supabase
    .from('products')
    .select('slug')
    .eq('id', id)
    .single();
  const { data: imgs } = await supabase
    .from('product_images')
    .select('storage_path')
    .eq('product_id', id);

  const paths = (imgs ?? []).map((i) => i.storage_path);
  if (paths.length > 0) await removeStorageObjects(paths);

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/');
  revalidatePath('/sitemap.xml');
  if (product?.slug) revalidatePath(`/produtos/${product.slug}`);

  return { ok: true, data: undefined };
}
