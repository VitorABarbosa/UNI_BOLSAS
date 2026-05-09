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
};

const LIST_SELECT = `
  id, slug, name, tagline, badge, price_retail, sizes, sort_order, active, category_id,
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
  };
}

export async function listActiveProducts(): Promise<ProductWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select(LIST_SELECT)
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .returns<ProductWithRelations[]>();

  if (error) {
    throw new Error(`listActiveProducts failed: ${error.message}`);
  }
  return (data ?? []).map(sortRelations);
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductWithRelations | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select(PDP_SELECT)
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle<ProductWithRelations>();

  if (error) {
    throw new Error(`getProductBySlug failed: ${error.message}`);
  }
  return data ? sortRelations(data) : null;
}

export async function listRelatedProducts(
  productId: string,
  categoryId: string,
  limit = 4,
): Promise<ProductWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select(LIST_SELECT)
    .eq('active', true)
    .eq('category_id', categoryId)
    .neq('id', productId)
    .order('sort_order', { ascending: true })
    .limit(limit)
    .returns<ProductWithRelations[]>();

  if (error) {
    throw new Error(`listRelatedProducts failed: ${error.message}`);
  }
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
