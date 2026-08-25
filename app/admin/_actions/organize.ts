'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/require-admin';
import {
  CATEGORY_RULES,
  suggestCategory,
} from '@/lib/catalog/category-rules';

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type CategoryMove = {
  productId: string;
  productName: string;
  fromLabel: string;
  toSlug: string;
  toLabel: string;
  /** Palavra do nome que disparou a regra. */
  keyword: string;
};

export type OrganizePreview = {
  moves: CategoryMove[];
  /** Produtos em que nenhuma regra casou — ficam onde estão. */
  unmatched: { id: string; name: string }[];
  /** Categorias que as regras usam mas que ainda não existem no catálogo. */
  missingCategories: { slug: string; label: string; count: number }[];
  totalProducts: number;
};

/**
 * Simula a organização sem escrever nada.
 *
 * O admin vê o que vai mudar antes de confirmar: mover produto em massa é
 * difícil de desfazer, então a conferência não é opcional.
 */
export async function previewCategoryOrganization(): Promise<
  ActionResult<OrganizePreview>
> {
  const { supabase } = await requireAdmin();

  const [{ data: products, error: prodError }, { data: cats, error: catError }] =
    await Promise.all([
      supabase.from('products').select('id, name, category_id').order('name'),
      supabase.from('categories').select('id, slug, label'),
    ]);
  if (prodError) return { ok: false, error: prodError.message };
  if (catError) return { ok: false, error: catError.message };

  const bySlug = new Map((cats ?? []).map((c) => [c.slug, c]));
  const byId = new Map((cats ?? []).map((c) => [c.id, c]));

  const moves: CategoryMove[] = [];
  const unmatched: { id: string; name: string }[] = [];
  const missingCount = new Map<string, number>();

  for (const product of products ?? []) {
    const suggestion = suggestCategory(product.name);
    if (!suggestion) {
      unmatched.push({ id: product.id, name: product.name });
      continue;
    }

    const target = bySlug.get(suggestion.slug);
    if (!target) {
      missingCount.set(
        suggestion.slug,
        (missingCount.get(suggestion.slug) ?? 0) + 1,
      );
      continue;
    }
    // Já está no lugar certo — não entra na lista pra não virar ruído.
    if (target.id === product.category_id) continue;

    moves.push({
      productId: product.id,
      productName: product.name,
      fromLabel: byId.get(product.category_id)?.label ?? '—',
      toSlug: target.slug,
      toLabel: target.label,
      keyword: suggestion.keyword,
    });
  }

  const missingCategories = [...missingCount.entries()].map(([slug, count]) => ({
    slug,
    label: CATEGORY_RULES.find((r) => r.slug === slug)?.label ?? slug,
    count,
  }));

  return {
    ok: true,
    data: {
      moves,
      unmatched,
      missingCategories,
      totalProducts: (products ?? []).length,
    },
  };
}

const ApplySchema = z
  .array(
    z.object({
      productId: z.string().uuid(),
      toSlug: z.string().min(1),
    }),
  )
  .min(1)
  .max(1000);

/** Move de fato os produtos confirmados pelo admin. */
export async function applyCategoryOrganization(
  moves: { productId: string; toSlug: string }[],
): Promise<ActionResult<{ updated: number; failed: number }>> {
  const { supabase } = await requireAdmin();
  const parsed = ApplySchema.safeParse(moves);
  if (!parsed.success) return { ok: false, error: 'Seleção inválida' };

  const { data: cats, error: catError } = await supabase
    .from('categories')
    .select('id, slug');
  if (catError) return { ok: false, error: catError.message };
  const bySlug = new Map((cats ?? []).map((c) => [c.slug, c.id]));

  // Agrupa por destino: um UPDATE por categoria em vez de um por produto.
  const idsByCategory = new Map<string, string[]>();
  for (const move of parsed.data) {
    const categoryId = bySlug.get(move.toSlug);
    if (!categoryId) continue;
    const list = idsByCategory.get(categoryId) ?? [];
    list.push(move.productId);
    idsByCategory.set(categoryId, list);
  }

  let updated = 0;
  let failed = 0;
  for (const [categoryId, ids] of idsByCategory) {
    const { data, error } = await supabase
      .from('products')
      .update({ category_id: categoryId })
      .in('id', ids)
      .select('slug');
    if (error) {
      failed += ids.length;
      continue;
    }
    updated += data?.length ?? 0;
    for (const row of data ?? []) revalidatePath(`/produtos/${row.slug}`);
  }

  revalidatePath('/');
  revalidatePath('/admin/produtos');
  revalidatePath('/admin/categorias');

  return { ok: true, data: { updated, failed } };
}

/** Cria uma categoria que as regras precisam e o catálogo ainda não tem. */
export async function createMissingCategory(
  slug: string,
): Promise<ActionResult<{ label: string }>> {
  const { supabase } = await requireAdmin();
  const rule = CATEGORY_RULES.find((r) => r.slug === slug);
  if (!rule) return { ok: false, error: 'Categoria desconhecida' };

  const { data: last } = await supabase
    .from('categories')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from('categories').insert({
    slug: rule.slug,
    label: rule.label,
    sort_order: (last?.sort_order ?? 0) + 10,
  });
  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Categoria já existe' };
    return { ok: false, error: error.message };
  }

  revalidatePath('/');
  revalidatePath('/admin/categorias');
  return { ok: true, data: { label: rule.label } };
}
