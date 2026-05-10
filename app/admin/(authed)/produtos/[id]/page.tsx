import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/require-admin';
import { AdminShell } from '@/components/admin/shell/AdminShell';
import { ProductForm } from '@/components/admin/ProductForm';
import type { ColorRow } from '@/components/admin/ProductForm/ColorsEditor';
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
      .select(
        `
          *,
          colors:product_colors(*),
          images:product_images(id, color_id, sort_order, storage_path, alt)
        `,
      )
      .eq('id', id)
      .maybeSingle(),
    supabase.from('categories').select('id, label').order('sort_order'),
  ]);
  if (prodError) throw prodError;
  if (catsError) throw catsError;
  if (!product) notFound();

  type ColorRecord = {
    id: string;
    name: string;
    hex: string;
    accent_hex: string | null;
    sort_order: number;
  };
  type ImageRecord = { color_id: string | null };

  const colorRecords: ColorRecord[] = (product.colors ?? []) as ColorRecord[];
  const imageRecords: ImageRecord[] = (product.images ?? []) as ImageRecord[];

  const initialColors: ColorRow[] = colorRecords.map((c) => ({
    id: c.id,
    name: c.name,
    hex: c.hex,
    accent_hex: c.accent_hex,
    sort_order: c.sort_order,
    image_count: imageRecords.filter((img) => img.color_id === c.id).length,
  }));

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
        initialColors={initialColors}
      />
    </AdminShell>
  );
}
