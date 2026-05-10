import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/require-admin';
import { AdminShell } from '@/components/admin/shell/AdminShell';
import { ProductForm } from '@/components/admin/ProductForm';

export const metadata = {
  title: 'Novo produto · Uni Bolsas Admin',
};

export default async function NovoProdutoPage() {
  const { user, supabase } = await requireAdmin();

  const { data: cats, error } = await supabase
    .from('categories')
    .select('id, label')
    .order('sort_order');
  if (error) throw error;

  return (
    <AdminShell
      user={{ email: user.email ?? '' }}
      title="Novo produto"
      actions={
        <Link
          href="/admin/produtos"
          className="text-sm text-stone hover:text-ink"
        >
          ← Voltar
        </Link>
      }
    >
      <ProductForm mode="create" categories={cats ?? []} />
    </AdminShell>
  );
}
