import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/require-admin';
import { AdminShell } from '@/components/admin/shell/AdminShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Dashboard · Uni Bolsas Admin',
};

export default async function AdminDashboardPage() {
  const { user, supabase } = await requireAdmin();

  const [
    { count: productsCount },
    { count: categoriesCount },
    { count: imagesCount },
    { data: recentProducts },
  ] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('categories').select('id', { count: 'exact', head: true }),
    supabase.from('product_images').select('id', { count: 'exact', head: true }),
    supabase
      .from('products')
      .select('id, name, slug, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5),
  ]);

  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));

  return (
    <AdminShell user={{ email: user.email ?? '' }} title="Dashboard">
      <div className="space-y-6 p-6">
        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Produtos ativos" value={productsCount ?? 0} />
          <StatCard label="Categorias" value={categoriesCount ?? 0} />
          <StatCard label="Imagens" value={imagesCount ?? 0} />
        </section>

        <section>
          <h2 className="mb-3 font-serif text-lg text-ink">Últimos editados</h2>
          {!recentProducts || recentProducts.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-sm text-stone">
                Nenhum produto cadastrado ainda.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <ul className="divide-y divide-whisper">
                {recentProducts.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/admin/produtos/${p.id}`}
                      className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-bone-light"
                    >
                      <div>
                        <p className="font-medium text-ink">{p.name}</p>
                        <p className="text-xs text-stone">/{p.slug}</p>
                      </div>
                      <span className="text-xs text-stone">{fmtDate(p.updated_at)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>
      </div>
    </AdminShell>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-normal text-stone">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-serif text-3xl text-ink">{value}</p>
      </CardContent>
    </Card>
  );
}
