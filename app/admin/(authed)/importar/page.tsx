import { requireAdmin } from '@/lib/auth/require-admin';
import { AdminShell } from '@/components/admin/shell/AdminShell';
import { SheetImporter } from '@/components/admin/SheetImporter';

export const metadata = {
  title: 'Importar planilha · Uni Bolsas Admin',
};

export default async function ImportarPage() {
  const { user, supabase } = await requireAdmin();

  const { data: categories } = await supabase
    .from('categories')
    .select('id, label')
    .order('sort_order');

  return (
    <AdminShell user={{ email: user.email ?? '' }} title="Importar planilha">
      <SheetImporter categories={categories ?? []} />
    </AdminShell>
  );
}
