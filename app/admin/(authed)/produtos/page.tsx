import { requireAdmin } from '@/lib/auth/require-admin';
import { AdminShell } from '@/components/admin/shell/AdminShell';
import {
  ProductsTable,
  type ProductListRow,
} from '@/components/admin/ProductsTable';

export const metadata = {
  title: 'Produtos · Uni Bolsas Admin',
};

export default async function ProdutosPage() {
  const { user, supabase } = await requireAdmin();

  const BASE =
    'id, slug, name, active, sort_order, category_id, category:categories(id, label), images:product_images(storage_path, sort_order)';

  // `featured` é opcional: a migration dos destaques pode não ter sido
  // aplicada, e uma coluna inexistente derruba a consulta INTEIRA. Tenta com
  // ela, cai pra sem — o painel abre dos dois jeitos e a tabela mostra o
  // aviso quando a coluna falta.
  const withFeatured = await supabase
    .from('products')
    .select(`${BASE}, featured`)
    .order('sort_order', { ascending: true });

  const featuredAvailable = !withFeatured.error;
  const { data: rawProducts, error: productsError } = featuredAvailable
    ? withFeatured
    : await supabase.from('products').select(BASE).order('sort_order', { ascending: true });

  const { data: cats, error: catsError } = await supabase
    .from('categories')
    .select('id, label')
    .order('sort_order');
  if (productsError) throw productsError;
  if (catsError) throw catsError;

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
      featured: 'featured' in p ? Boolean(p.featured) : false,
    };
  });

  return (
    <AdminShell user={{ email: user.email ?? '' }} title="Produtos">
      <ProductsTable
        initial={rows}
        categories={cats ?? []}
        featuredAvailable={featuredAvailable}
      />
    </AdminShell>
  );
}
