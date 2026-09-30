import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/require-admin';
import { AdminShell } from '@/components/admin/shell/AdminShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  readAnalytics,
  pruneOldSummaries,
  emptyDay,
  type DaySummary,
} from '@/lib/analytics/store';
import { RETAIN_DAYS } from '@/lib/analytics/policy';

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
  // A limpeza do que passou do prazo anda junto com a leitura: sem agendador,
  // e o painel é aberto com frequência suficiente pra dar conta.
  const [byDay] = await Promise.all([readAnalytics(DAYS), pruneOldSummaries()]);

  const days = Object.keys(byDay).sort();
  const paths: Record<string, number> = {};
  const refs: Record<string, number> = {};
  const devices: Record<string, number> = {};
  const hours: Record<string, number> = {};
  const waPaths: Record<string, number> = {};
  const vids = new Set<string>();
  let views = 0;
  let anon = 0;
  let waClicks = 0;
  let newVisitors = 0;
  let returning = 0;
  for (const day of days) {
    const s = { ...emptyDay(), ...(byDay[day] as DaySummary) };
    views += s.views;
    anon += s.anon;
    waClicks += s.waClicks;
    newVisitors += s.newVisitors;
    returning += s.returning;
    addInto(paths, s.paths);
    addInto(refs, s.refs);
    addInto(devices, s.devices);
    addInto(hours, s.hours);
    addInto(waPaths, s.waPaths);
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

  const porClique = waClicks > 0 ? Math.round(views / waClicks) : 0;
  const conhecidos = newVisitors + returning;
  const paginasPorVisitante =
    vids.size > 0 ? (views / vids.size).toFixed(1).replace('.', ',') : null;
  const horaPico = top(hours, 1)[0];

  return (
    <AdminShell user={{ email: user.email ?? '' }} title="Dados">
      <div className="space-y-6 p-6">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label={`Visitas · ${DAYS} dias`} value={views} />
          <Stat label="Visitas · 7 dias" value={views7} />
          <Stat
            label="Visitantes únicos"
            value={vids.size}
            hint={
              anon > 0
                ? `+ ${anon} visita(s) sem cookie`
                : undefined
            }
          />
          <Stat
            label="Cliques no WhatsApp"
            value={waClicks}
            accent
            hint={
              porClique > 0
                ? `1 a cada ${porClique} página(s) vista(s)`
                : 'ninguém chamou ainda'
            }
          />
        </section>

        {views === 0 && waClicks === 0 ? (
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
              {/* A pergunta que o catálogo existe pra responder: qual peça
                  fez a pessoa sair da vitrine e ir falar com a loja. */}
              <RankCard
                title="Peças que levaram ao WhatsApp"
                empty="Nenhum clique no WhatsApp ainda."
                rows={top(waPaths, 10).map(([p, n]) => [labelFor(p), n])}
              />
              <RankCard
                title="Páginas mais vistas"
                rows={top(paths, 10).map(([p, n]) => [labelFor(p), n])}
              />
            </section>

            <section>
              <h2 className="mb-3 font-serif text-lg text-ink">
                Horário de movimento
              </h2>
              <Card>
                <CardContent className="p-6">
                  <HourChart hours={hours} />
                  <p className="mt-3 text-xs text-stone">
                    {horaPico
                      ? `Pico às ${horaPico[0]}h, com ${horaPico[1]} página(s) vista(s). Horário de São Paulo.`
                      : 'Ainda sem movimento suficiente pra desenhar o dia.'}
                  </p>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
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
                  <Bar
                    label="Celular"
                    count={mobile}
                    pct={(mobile / totalDev) * 100}
                  />
                  <Bar
                    label="Computador"
                    count={desktop}
                    pct={(desktop / totalDev) * 100}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-normal text-stone">
                    Quem volta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {conhecidos === 0 ? (
                    <p className="text-sm text-stone">
                      Ninguém aceitou cookies ainda — sem o código não dá pra
                      saber quem já tinha vindo.
                    </p>
                  ) : (
                    <>
                      <Bar
                        label="Primeira visita"
                        count={newVisitors}
                        pct={(newVisitors / conhecidos) * 100}
                      />
                      <Bar
                        label="Já tinham vindo"
                        count={returning}
                        pct={(returning / conhecidos) * 100}
                      />
                      {paginasPorVisitante && (
                        <p className="pt-1 text-xs text-stone">
                          {paginasPorVisitante} página(s) por visitante, em
                          média.
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </section>
          </>
        )}

        {/* Não é rodapé decorativo: é a resposta pronta pra quando um cliente
            perguntar "o que vocês guardam sobre mim". */}
        <section>
          <h2 className="mb-3 font-serif text-lg text-ink">
            Privacidade · o que medimos
          </h2>
          <Card>
            <CardContent className="grid gap-6 p-6 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-medium text-ink">
                  O que entra na conta
                </p>
                <ul className="space-y-1 text-sm text-stone">
                  <li>· página aberta e horário</li>
                  <li>· celular ou computador</li>
                  <li>· site de origem (só o domínio)</li>
                  <li>· clique no WhatsApp e em qual peça</li>
                  <li>
                    · um código sorteado, <strong>só de quem aceitou</strong>{' '}
                    o aviso de cookies
                  </li>
                </ul>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-ink">
                  O que nunca entra
                </p>
                <ul className="space-y-1 text-sm text-stone">
                  <li>· nome, e-mail, telefone, CPF</li>
                  <li>· IP (chega no servidor, não é gravado)</li>
                  <li>· localização</li>
                  <li>· Google Analytics, pixel do Facebook ou similar</li>
                </ul>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-stone">
                  Medição própria, sem serviço de terceiros. Os registros
                  individuais viram um resumo do dia e são apagados quando o
                  dia fecha; os resumos ficam {RETAIN_DAYS} dias e depois somem
                  sozinhos. Quem recusa cookies entra na contagem de visitas,
                  nunca na de visitantes únicos.{' '}
                  <Link
                    href="/privacidade"
                    target="_blank"
                    className="text-leather underline"
                  >
                    Ver a política publicada no site
                  </Link>
                  .
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </AdminShell>
  );
}

function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: number;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-normal text-stone">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={
            'font-serif text-3xl ' + (accent ? 'text-leather' : 'text-ink')
          }
        >
          {value}
        </p>
        {hint && <p className="mt-1 text-xs text-stone">{hint}</p>}
      </CardContent>
    </Card>
  );
}

/** Movimento ao longo do dia, das 0h às 23h. */
function HourChart({ hours }: { hours: Record<string, number> }) {
  const max = Math.max(1, ...Object.values(hours));
  const slots = Array.from({ length: 24 }, (_, h) => {
    const key = String(h).padStart(2, '0');
    return [key, hours[key] ?? 0] as const;
  });
  return (
    <>
      <div className="flex items-end gap-[3px]" aria-hidden="true">
        {slots.map(([key, n]) => (
          <div
            key={key}
            title={`${key}h · ${n} página(s) vista(s)`}
            className="flex-1 rounded-t-sm bg-leather/70 transition-colors hover:bg-leather"
            style={{ height: `${Math.max(3, (n / max) * 80)}px` }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] text-stone">
        <span>0h</span>
        <span>6h</span>
        <span>12h</span>
        <span>18h</span>
        <span>23h</span>
      </div>
    </>
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

function Bar({
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
