import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createAnonClient } from '@/lib/supabase/anon';
import type { Database } from '@/types/db';

type ProductRow = Database['public']['Tables']['products']['Row'];
type CategoryRow = Database['public']['Tables']['categories']['Row'];
type ColorRow = Database['public']['Tables']['product_colors']['Row'];
type ImageRow = Database['public']['Tables']['product_images']['Row'];

export type ProductWithRelations = ProductRow & {
  category: Pick<CategoryRow, 'slug' | 'label'>;
  colors: ColorRow[];
  images: ImageRow[];
  /**
   * Espelho do anúncio na Shopee, de onde sai o "de/por". Ausente quando o
   * produto não está vinculado — ou quando o espelho não pôde ser lido, caso
   * em que o site apenas não mostra promoção.
   */
  shopee?: { price: number | null; original_price: number | null } | null;
};

/**
 * Preço promocional espelhado da Shopee.
 *
 * Fica isolado de propósito: se a tabela não existir no projeto (integração
 * nunca aplicada), a consulta inteira falharia e derrubaria a página. Por
 * isso cada consulta tenta com este trecho e, dando errado, repete sem ele —
 * o pior caso vira "a promoção não aparece", nunca "o site não carrega".
 */
const SHOPEE_SELECT = `,
  shopee:shopee_items(price, original_price)`;

const LIST_SELECT = `
  id, slug, name, tagline, badge, price_retail, price_wholesale, sizes, sort_order, active, category_id,
  category:categories(slug, label),
  colors:product_colors(id, name, hex, accent_hex, sort_order, product_id),
  images:product_images(id, color_id, storage_path, alt, sort_order, product_id)
`;

const PDP_SELECT = `
  id, slug, name, tagline, badge, price_retail, price_wholesale,
  description, dimensions, weight, material, sizes, sort_order, active,
  seo_title, seo_description, category_id, created_at, updated_at,
  category:categories(slug, label),
  colors:product_colors(id, name, hex, accent_hex, sort_order, product_id),
  images:product_images(id, color_id, storage_path, alt, sort_order, product_id)
`;

function sortRelations<T extends ProductWithRelations>(p: T): T {
  return {
    ...p,
    colors: [...p.colors].sort((a, b) => a.sort_order - b.sort_order),
    images: [...p.images].sort((a, b) => a.sort_order - b.sort_order),
    // O PostgREST devolve a relação como lista; a unique em product_id
    // garante no máximo um anúncio por produto.
    shopee: Array.isArray(p.shopee) ? (p.shopee[0] ?? null) : (p.shopee ?? null),
  };
}

/** Roda a consulta com o espelho da Shopee e, se falhar, sem ele. */
async function withShopeeFallback<T>(
  run: (select: string) => PromiseLike<{ data: T | null; error: { message: string } | null }>,
  baseSelect: string,
  label: string,
): Promise<T | null> {
  const enriched = await run(baseSelect + SHOPEE_SELECT);
  if (!enriched.error) return enriched.data;

  console.warn(
    `[${label}] espelho da Shopee indisponível, seguindo sem promoção:`,
    enriched.error.message,
  );
  const plain = await run(baseSelect);
  if (plain.error) throw new Error(`${label} failed: ${plain.error.message}`);
  return plain.data;
}

export async function listActiveProducts(): Promise<ProductWithRelations[]> {
  const supabase = await createClient();
  const data = await withShopeeFallback<ProductWithRelations[]>(
    (select) =>
      supabase
        .from('products')
        .select(select)
        .eq('active', true)
        .order('sort_order', { ascending: true })
        .returns<ProductWithRelations[]>(),
    LIST_SELECT,
    'listActiveProducts',
  );
  return (data ?? []).map(sortRelations);
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductWithRelations | null> {
  const supabase = await createClient();
  const data = await withShopeeFallback<ProductWithRelations>(
    (select) =>
      supabase
        .from('products')
        .select(select)
        .eq('slug', slug)
        .eq('active', true)
        .maybeSingle<ProductWithRelations>(),
    PDP_SELECT,
    'getProductBySlug',
  );
  return data ? sortRelations(data) : null;
}

export async function listRelatedProducts(
  productId: string,
  categoryId: string,
  limit = 4,
): Promise<ProductWithRelations[]> {
  const supabase = await createClient();
  const data = await withShopeeFallback<ProductWithRelations[]>(
    (select) =>
      supabase
        .from('products')
        .select(select)
        .eq('active', true)
        .eq('category_id', categoryId)
        .neq('id', productId)
        .order('sort_order', { ascending: true })
        .limit(limit)
        .returns<ProductWithRelations[]>(),
    LIST_SELECT,
    'listRelatedProducts',
  );
  return (data ?? []).map(sortRelations);
}

export type ProductSlugRow = Pick<ProductRow, 'slug' | 'updated_at'>;

/**
 * Slug list for `generateStaticParams` and `sitemap.ts`. Uses an anon-key
 * client because `generateStaticParams` runs at build time, where the
 * cookie-bound SSR client throws.
 */
export async function listProductSlugs(): Promise<ProductSlugRow[]> {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(`listProductSlugs failed: ${error.message}`);
  }
  return data ?? [];
}
