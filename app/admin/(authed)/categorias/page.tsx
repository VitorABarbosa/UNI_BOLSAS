import { requireAdmin } from '@/lib/auth/require-admin';
import { AdminShell } from '@/components/admin/shell/AdminShell';
import { CategoriesEditor } from '@/components/admin/CategoriesEditor';
import { CategoryOrganizer } from '@/components/admin/CategoryOrganizer';

export const metadata = {
  title: 'Categorias · Uni Bolsas Admin',
};

export default async function CategoriasPage() {
  const { user, supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, label, sort_order, products(count)')
    .order('sort_order');

  if (error) throw error;

  const rows = (data ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    label: c.label,
    sort_order: c.sort_order,
    product_count:
      (c.products as unknown as { count: number }[] | null)?.[0]?.count ?? 0,
  }));

  return (
    <AdminShell user={{ email: user.email ?? '' }} title="Categorias">
      <CategoriesEditor initial={rows} />
      <div className="p-6 pt-0">
        <CategoryOrganizer />
      </div>
    </AdminShell>
  );
}
