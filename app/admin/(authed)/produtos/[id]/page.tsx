import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/require-admin';
import { AdminShell } from '@/components/admin/shell/AdminShell';
import { ProductForm } from '@/components/admin/ProductForm';
import { DeleteProductButton } from '@/components/admin/DeleteProductButton';

export const metadata = {
  title: 'Editar produto · Uni Bolsas Admin',
};

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, supabase } = await requireAdmin();

  const [
    { data: product, error: prodError },
    { data: cats, error: catsError },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('*, colors:product_colors(*), images:product_images(*)')
      .eq('id', id)
      .maybeSingle(),
    supabase.from('categories').select('id, label').order('sort_order'),
  ]);
  if (prodError) throw prodError;
  if (catsError) throw catsError;
  if (!product) notFound();

  return (
    <AdminShell
      user={{ email: user.email ?? '' }}
      title={`Editando: ${product.name}`}
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/admin/produtos"
            className="text-sm text-stone hover:text-ink"
          >
            ← Voltar
          </Link>
          <DeleteProductButton id={product.id} name={product.name} />
        </div>
      }
    >
      <ProductForm
        mode="edit"
        categories={cats ?? []}
        product={product as never}
      />
    </AdminShell>
  );
}
