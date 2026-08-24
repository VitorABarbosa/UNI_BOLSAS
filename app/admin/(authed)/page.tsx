import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/require-admin';
import { AdminShell } from '@/components/admin/shell/AdminShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Dashboard · Uni Bolsas Admin',
};

export default async function AdminDashboardPage() {
  const { user, supabase } = await requireAdmin();

  const nowIso = new Date().toISOString();

  const [
    { count: productsCount },
    { count: categoriesCount },
    { count: imagesCount },
    { count: promoCount },
    { data: recentProducts },
    { data: allForHealth },
  ] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('categories').select('id', { count: 'exact', head: true }),
    supabase.from('product_images').select('id', { count: 'exact', head: true }),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .not('price_promo', 'is', null)
      .or(`promo_ends_at.is.null,promo_ends_at.gt.${nowIso}`),
    supabase
      .from('products')
      .select('id, name, slug, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5),
    // Produto sem foto ou sem cor é o resíduo típico da importação em massa —
    // e some do catálogo sem ninguém perceber. Aqui vira número na primeira
    // tela, com link pro filtro correspondente.
    supabase
      .from('products')
      .select('id, images:product_images(id), colors:product_colors(id)'),
  ]);

  const health = (allForHealth ?? []).reduce(
    (acc, p) => ({
      noImage: acc.noImage + ((p.images ?? []).length === 0 ? 1 : 0),
      noColor: acc.noColor + ((p.colors ?? []).length === 0 ? 1 : 0),
    }),
    { noImage: 0, noColor: 0 },
  );

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
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Produtos ativos" value={productsCount ?? 0} />
          <StatCard label="Categorias" value={categoriesCount ?? 0} />
          <StatCard label="Imagens" value={imagesCount ?? 0} />
          <StatCard
            label="Em promoção"
            value={promoCount ?? 0}
            href="/admin/produtos"
          />
        </section>

        {(health.noImage > 0 || health.noColor > 0) && (
          <section className="grid gap-4 sm:grid-cols-2">
            {health.noImage > 0 && (
              <StatCard
                label="Produtos sem foto"
                value={health.noImage}
                href="/admin/produtos"
                tone="warn"
              />
            )}
            {health.noColor > 0 && (
              <StatCard
                label="Produtos sem cor cadastrada"
                value={health.noColor}
                href="/admin/produtos"
                tone="warn"
              />
            )}
          </section>
        )}

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

function StatCard({
  label,
  value,
  href,
  tone = 'default',
}: {
  label: string;
  value: number;
  href?: string;
  tone?: 'default' | 'warn';
}) {
  const card = (
    <Card className={tone === 'warn' ? 'border-leather/40 bg-bone-light' : undefined}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-normal text-stone">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={
            'font-serif text-3xl ' +
            (tone === 'warn' ? 'text-leather-dark' : 'text-ink')
          }
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );

  if (!href) return card;
  return (
    <Link href={href} className="block transition-opacity hover:opacity-80">
      {card}
    </Link>
  );
}
