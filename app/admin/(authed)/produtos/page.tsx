import { requireAdmin } from '@/lib/auth/require-admin';
import { readFeaturedIds } from '@/lib/catalog/featured-store';
import { AdminShell } from '@/components/admin/shell/AdminShell';
import {
  ProductsTable,
  type ProductListRow,
} from '@/components/admin/ProductsTable';

export const metadata = {
  title: 'Produtos · Uni Bolsas Admin',
};

/**
 * Nunca servir esta página de cache. É a tela onde o admin muda as coisas e
 * confere o resultado no mesmo segundo: uma versão guardada aqui mostraria o
 * estado anterior ao clique que a pessoa acabou de dar.
 */
export const dynamic = 'force-dynamic';

export default async function ProdutosPage() {
  const { user, supabase } = await requireAdmin();

  const [
    { data: rawProducts, error: productsError },
    { data: cats, error: catsError },
    featuredIds,
  ] = await Promise.all([
    supabase
      .from('products')
      .select(
        'id, slug, name, active, sort_order, category_id, category:categories(id, label), images:product_images(storage_path, sort_order)',
      )
      .order('sort_order', { ascending: true }),
    supabase.from('categories').select('id, label').order('sort_order'),
    // A seleção da vitrine vem do Storage, não de uma coluna.
    readFeaturedIds(),
  ]);
  if (productsError) throw productsError;
  if (catsError) throw catsError;

  const featuredSet = new Set(featuredIds);

  const rows: ProductListRow[] = (rawProducts ?? []).map((p) => {
    const sortedImgs = (p.images ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order);
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      active: p.active,
      sort_order: p.sort_order,
      category_id: p.category_id,
      category_label:
        (p.category as unknown as { label: string } | null)?.label ?? '—',
      image_count: sortedImgs.length,
      cover_storage_path: sortedImgs[0]?.storage_path ?? null,
      featured: featuredSet.has(p.id),
    };
  });

  return (
    <AdminShell user={{ email: user.email ?? '' }} title="Produtos">
      <ProductsTable initial={rows} categories={cats ?? []} />
    </AdminShell>
  );
}
