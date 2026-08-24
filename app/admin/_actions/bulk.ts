'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/require-admin';

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const IdsSchema = z.array(z.string().uuid()).min(1).max(500);

const PromoSchema = z.object({
  ids: IdsSchema,
  /**
   * `percent` desconta sobre o preço de varejo de cada produto — é o modo que
   * faz sentido numa seleção com preços diferentes. `fixed` grava o mesmo
   * valor em todos, útil pra um lote de peças do mesmo preço.
   */
  mode: z.enum(['percent', 'fixed']),
  value: z.number().positive(),
  /** ISO 8601. Null = promoção sem prazo. */
  endsAt: z.string().datetime().nullable(),
});

export type BulkPromoInput = z.infer<typeof PromoSchema>;

/** Arredonda pra centavo, evitando 89.99999999 vindo do cálculo de porcentagem. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Aplica promoção a vários produtos de uma vez.
 *
 * Cada produto precisa do próprio `price_retail` pra calcular o percentual,
 * então a ação lê os preços antes de escrever. Produtos cujo resultado não
 * seria um desconto de verdade (>= preço cheio, ou <= 0) são pulados e
 * contados no relatório, em vez de derrubar o lote inteiro no CHECK do banco.
 */
export async function bulkApplyPromo(
  input: BulkPromoInput,
): Promise<ActionResult<{ updated: number; skipped: number }>> {
  const { supabase } = await requireAdmin();
  const parsed = PromoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Dados inválidos' };
  const { ids, mode, value, endsAt } = parsed.data;

  if (mode === 'percent' && value >= 100) {
    return { ok: false, error: 'O desconto precisa ser menor que 100%' };
  }

  const { data: products, error: readError } = await supabase
    .from('products')
    .select('id, slug, price_retail')
    .in('id', ids);
  if (readError) return { ok: false, error: readError.message };

  let updated = 0;
  let skipped = 0;
  const touchedSlugs: string[] = [];

  for (const product of products ?? []) {
    const retail = Number(product.price_retail);
    const promo =
      mode === 'percent' ? round2(retail * (1 - value / 100)) : round2(value);

    if (!(promo > 0) || promo >= retail) {
      skipped += 1;
      continue;
    }

    const { error } = await supabase
      .from('products')
      .update({ price_promo: promo, promo_ends_at: endsAt })
      .eq('id', product.id);
    if (error) {
      skipped += 1;
      continue;
    }
    updated += 1;
    touchedSlugs.push(product.slug);
  }

  revalidatePath('/');
  revalidatePath('/admin/produtos');
  for (const slug of touchedSlugs) revalidatePath(`/produtos/${slug}`);

  return { ok: true, data: { updated, skipped } };
}

/** Encerra a promoção dos produtos selecionados. */
export async function bulkClearPromo(
  ids: string[],
): Promise<ActionResult<{ updated: number }>> {
  const { supabase } = await requireAdmin();
  const parsed = IdsSchema.safeParse(ids);
  if (!parsed.success) return { ok: false, error: 'Seleção inválida' };

  const { data, error } = await supabase
    .from('products')
    .update({ price_promo: null, promo_ends_at: null })
    .in('id', parsed.data)
    .select('slug');
  if (error) return { ok: false, error: error.message };

  revalidatePath('/');
  revalidatePath('/admin/produtos');
  for (const row of data ?? []) revalidatePath(`/produtos/${row.slug}`);

  return { ok: true, data: { updated: data?.length ?? 0 } };
}

/** Publica ou despublica os produtos selecionados. */
export async function bulkSetActive(
  ids: string[],
  active: boolean,
): Promise<ActionResult<{ updated: number }>> {
  const { supabase } = await requireAdmin();
  const parsed = IdsSchema.safeParse(ids);
  if (!parsed.success) return { ok: false, error: 'Seleção inválida' };

  const { data, error } = await supabase
    .from('products')
    .update({ active })
    .in('id', parsed.data)
    .select('slug');
  if (error) return { ok: false, error: error.message };

  revalidatePath('/');
  revalidatePath('/admin/produtos');
  revalidatePath('/sitemap.xml');
  for (const row of data ?? []) revalidatePath(`/produtos/${row.slug}`);

  return { ok: true, data: { updated: data?.length ?? 0 } };
}

/** Move os produtos selecionados para outra categoria. */
export async function bulkSetCategory(
  ids: string[],
  categoryId: string,
): Promise<ActionResult<{ updated: number }>> {
  const { supabase } = await requireAdmin();
  const parsed = IdsSchema.safeParse(ids);
  const categoryOk = z.string().uuid().safeParse(categoryId);
  if (!parsed.success || !categoryOk.success) {
    return { ok: false, error: 'Seleção inválida' };
  }

  const { data, error } = await supabase
    .from('products')
    .update({ category_id: categoryOk.data })
    .in('id', parsed.data)
    .select('slug');
  if (error) return { ok: false, error: error.message };

  revalidatePath('/');
  revalidatePath('/admin/produtos');
  for (const row of data ?? []) revalidatePath(`/produtos/${row.slug}`);

  return { ok: true, data: { updated: data?.length ?? 0 } };
}
