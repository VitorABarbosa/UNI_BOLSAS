import { requireAdmin } from '@/lib/auth/require-admin';
import { AdminShell } from '@/components/admin/shell/AdminShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { readAnalytics, type DaySummary } from '@/lib/analytics/store';

export const metadata = {
  title: 'Dados · Uni Bolsas Admin',
};

// Os números mudam a cada visita — nunca servir uma foto velha.
export const dynamic = 'force-dynamic';

const DAYS = 30;

/** Soma um Record<string, number> dentro de outro. */
function addInto(
  target: Record<string, number>,
  src: Record<string, number>,
): void {
  for (const [k, v] of Object.entries(src)) target[k] = (target[k] ?? 0) + v;
}

function top(rec: Record<string, number>, n: number): [string, number][] {
  return Object.entries(rec)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

const fmtDay = (iso: string) => {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
};

export default async function DadosPage() {
  const { user, supabase } = await requireAdmin();
  const byDay = await readAnalytics(DAYS);

  const days = Object.keys(byDay).sort();
  const paths: Record<string, number> = {};
  const refs: Record<string, number> = {};
  const devices: Record<string, number> = {};
  const vids = new Set<string>();
  let views = 0;
  let anon = 0;
  for (const day of days) {
    const s = byDay[day] as DaySummary;
    views += s.views;
    anon += s.anon;
    addInto(paths, s.paths);
    addInto(refs, s.refs);
    addInto(devices, s.devices);
    for (const v of s.vids) vids.add(v);
  }

  const last7 = days.slice(-7);
  const views7 = last7.reduce((t, d) => t + (byDay[d]?.views ?? 0), 0);
  const maxDay = Math.max(1, ...days.map((d) => byDay[d]?.views ?? 0));

  // Os caminhos /produtos/<slug> viram o nome da peça — "qual bolsa desperta
  // interesse" é a pergunta real, e slug não é resposta pra pessoa nenhuma.
  const { data: products } = await supabase
    .from('products')
    .select('slug, name');
  const nameBySlug = new Map(
    (products ?? []).map((p) => [`/produtos/${p.slug}`, p.name]),
  );
  const labelFor = (p: string) =>
    p === '/' ? 'Página inicial' : (nameBySlug.get(p) ?? p);

  const mobile = devices['m'] ?? 0;
  const desktop = devices['d'] ?? 0;
  const totalDev = Math.max(1, mobile + desktop);

  return (
    <AdminShell user={{ email: user.email ?? '' }} title="Dados">
      <div className="space-y-6 p-6">
        <section className="grid gap-4 sm:grid-cols-3">
          <Stat label={`Visitas · ${DAYS} dias`} value={views} />
          <Stat label="Visitas · 7 dias" value={views7} />
          <Stat
            label="Visitantes únicos"
            value={vids.size}
            hint={
              anon > 0
                ? `+ ${anon} visita(s) de quem não aceitou cookies`
                : undefined
            }
          />
        </section>

        {views === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-stone">
              Ainda não há visitas registradas. Os números começam a aparecer
              assim que alguém navegar pelo site — a contagem é feita pelo
              próprio site, sem serviço de fora.
            </CardContent>
          </Card>
        ) : (
          <>
            <section>
              <h2 className="mb-3 font-serif text-lg text-ink">
                Visitas por dia
              </h2>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-end gap-[3px]" aria-hidden="true">
                    {days.map((d) => {
                      const v = byDay[d]?.views ?? 0;
                      return (
                        <div
                          key={d}
                          title={`${fmtDay(d)} · ${v} visita(s)`}
                          className="flex-1 rounded-t-sm bg-leather/80 transition-colors hover:bg-leather"
                          style={{
                            height: `${Math.max(3, (v / maxDay) * 96)}px`,
                          }}
                        />
                      );
                    })}
                  </div>
                  <div className="mt-2 flex justify-between font-mono text-[10px] text-stone">
                    <span>{fmtDay(days[0] ?? '')}</span>
                    <span>{fmtDay(days[days.length - 1] ?? '')}</span>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <RankCard
                title="Páginas mais vistas"
                rows={top(paths, 10).map(([p, n]) => [labelFor(p), n])}
              />
              <div className="space-y-4">
                <RankCard
                  title="De onde vieram"
                  empty="Só acessos diretos até agora."
                  rows={top(refs, 8)}
                />
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-normal text-stone">
                      Aparelhos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <DeviceBar
                      label="Celular"
                      count={mobile}
                      pct={(mobile / totalDev) * 100}
                    />
                    <DeviceBar
                      label="Computador"
                      count={desktop}
                      pct={(desktop / totalDev) * 100}
                    />
                  </CardContent>
                </Card>
              </div>
            </section>
          </>
        )}

        <p className="text-xs text-stone">
          Medição própria, sem Google e sem serviço de terceiros. O visitante
          só ganha um cookie anônimo se aceitar no aviso; quem recusa entra na
          contagem de visitas, mas não na de visitantes únicos.
        </p>
      </div>
    </AdminShell>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-normal text-stone">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-serif text-3xl text-ink">{value}</p>
        {hint && <p className="mt-1 text-xs text-stone">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function RankCard({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: [string, number][];
  empty?: string;
}) {
  const max = Math.max(1, ...rows.map(([, n]) => n));
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-normal text-stone">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-stone">{empty ?? 'Nada por aqui ainda.'}</p>
        ) : (
          <ul className="space-y-2">
            {rows.map(([label, n]) => (
              <li key={label} className="text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-ink">{label}</span>
                  <span className="font-mono text-xs text-stone">{n}</span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-whisper">
                  <div
                    className="h-full rounded-full bg-leather/70"
                    style={{ width: `${(n / max) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function DeviceBar({
  label,
  count,
  pct,
}: {
  label: string;
  count: number;
  pct: number;
}) {
  return (
    <div className="text-sm">
      <div className="flex items-baseline justify-between">
        <span className="text-ink">{label}</span>
        <span className="font-mono text-xs text-stone">
          {count} · {Math.round(pct)}%
        </span>
      </div>
      <div className="mt-1 h-1 rounded-full bg-whisper">
        <div
          className="h-full rounded-full bg-leather/70"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
