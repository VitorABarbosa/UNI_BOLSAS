import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/require-admin';
import { AdminShell } from '@/components/admin/shell/AdminShell';
import { A_FAZER, carregarPedidos, FILAS, type Fila, type PedidoAdmin } from '@/lib/admin/pedidos';
import { pecasDoPagamento } from '@/lib/checkout/mercadopago';
import { statusDasIntegracoes } from '@/lib/admin/status';
import { formatPriceBRL } from '@/lib/format';

export const metadata = {
  title: 'Início · Uni Bolsas Admin',
};
export const dynamic = 'force-dynamic';

const TZ = 'America/Sao_Paulo';
const dia = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const dataHora = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: TZ });

/** Vendas pagas por período (pela data da aprovação, no horário de São Paulo). */
function resumoDeVendas(pagos: PedidoAdmin[]) {
  const agora = Date.now();
  const ha = (dias: number) => dia.format(new Date(agora - dias * 24 * 60 * 60 * 1000));
  const somar = (desde: string) => {
    const lista = pagos.filter((p) => dia.format(new Date(p.pagamento.date_approved ?? p.pagamento.date_created)) >= desde);
    return { n: lista.length, total: lista.reduce((s, p) => s + p.pagamento.transaction_amount, 0) };
  };
  return [
    { rotulo: 'Hoje', ...somar(ha(0)) },
    { rotulo: 'Últimos 7 dias', ...somar(ha(6)) },
    { rotulo: 'Últimos 30 dias', ...somar(ha(29)) },
  ];
}

/** As peças que mais saíram nos últimos 30 dias (pagas), por quantidade. */
function maisVendidas(pagos: PedidoAdmin[]) {
  const desde = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const mapa = new Map<string, { nome: string; qtd: number; total: number }>();
  for (const p of pagos) {
    if (new Date(p.pagamento.date_approved ?? p.pagamento.date_created).getTime() < desde) continue;
    for (const i of pecasDoPagamento(p.pagamento)) {
      const nome = String(i.title ?? '').split(' · ')[0] || 'Peça';
      const atual = mapa.get(nome) ?? { nome, qtd: 0, total: 0 };
      atual.qtd += Number(i.quantity) || 0;
      atual.total += (Number(i.quantity) || 0) * (Number(i.unit_price) || 0);
      mapa.set(nome, atual);
    }
  }
  return [...mapa.values()].sort((a, b) => b.qtd - a.qtd).slice(0, 5);
}

/** O dia da loja: o que vendeu, o que falta fazer e o que está pendente de configurar. */
export default async function AdminInicioPage() {
  const { user, supabase } = await requireAdmin();

  const [{ pedidos, erro }, integracoes, { count: ativos }, { count: ocultos }] = await Promise.all([
    carregarPedidos(),
    statusDasIntegracoes(),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('active', false),
  ]);

  const pagos = pedidos.filter((p) => p.pagamento.status === 'approved');
  const vendas = resumoDeVendas(pagos);
  const ultimas = [...pagos]
    .sort((a, b) => +new Date(b.pagamento.date_approved ?? b.pagamento.date_created) - +new Date(a.pagamento.date_approved ?? a.pagamento.date_created))
    .slice(0, 5);
  const top = maisVendidas(pagos);
  const n = (f: Fila) => pedidos.filter((p) => p.fila === f).length;
  const proximos = pedidos.filter((p) => A_FAZER.includes(p.fila)).reverse().slice(0, 6);
  const pendencias = integracoes.filter((i) => !i.ok);

  return (
    <AdminShell user={{ email: user.email ?? '' }} title="Início">
      <div className="space-y-6 p-4 md:p-6">
        {erro && <p className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">{erro}</p>}

        <section>
          <h2 className="mb-2 font-serif text-lg text-ink">Vendas pelo site</h2>
          {/* Três lado a lado até no celular: o resumo cabe numa olhada. */}
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {vendas.map((v) => (
              <div key={v.rotulo} className="min-w-0 rounded-lg border bg-white px-2.5 py-2.5 md:px-4 md:py-3">
                <div className="truncate text-[11px] text-stone-500 md:text-xs">{v.rotulo.replace('Últimos ', '')}</div>
                <div className="truncate text-base font-semibold tabular-nums md:text-2xl">{formatPriceBRL(v.total)}</div>
                <div className="text-[11px] text-stone-500 md:text-xs">
                  {v.n} {v.n === 1 ? 'pedido' : 'pedidos'}
                </div>
              </div>
            ))}
          </div>
          {ultimas.length > 0 && (
            <div className="mt-3 rounded-lg border bg-white">
              <div className="border-b px-4 py-2 text-xs font-medium uppercase tracking-wide text-stone-500">Últimas vendas</div>
              <ul className="divide-y">
                {ultimas.map((p) => {
                  const m = p.pagamento.metadata ?? {};
                  return (
                    <li key={p.ref}>
                      <Link href={`/admin/pedidos/${p.ref}`} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-stone-50">
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{m.empresa || m.cliente_nome || p.ref}</span>
                          <span className="block text-xs text-stone-500">
                            {dataHora.format(new Date(p.pagamento.date_approved ?? p.pagamento.date_created))} ·{' '}
                            {FILAS.find((f) => f.id === p.fila)?.rotulo ?? ''}
                          </span>
                        </span>
                        <span className="shrink-0 font-semibold tabular-nums">{formatPriceBRL(p.pagamento.transaction_amount)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-2 font-serif text-lg text-ink">O que fazer agora</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {(['separar', 'postar', 'retirar', 'problema'] as Fila[]).map((f) => {
              const fila = FILAS.find((x) => x.id === f)!;
              const qtd = n(f);
              return (
                <Link
                  key={f}
                  href={`/admin/pedidos?aba=${f}`}
                  className={`rounded-lg border px-4 py-3 transition-colors hover:border-stone-500 ${
                    qtd > 0 ? (f === 'problema' ? 'border-red-300 bg-red-50' : 'border-amber-300 bg-amber-50') : 'bg-white'
                  }`}
                >
                  <div className="text-2xl font-semibold">{qtd}</div>
                  <div className="text-sm font-medium">{fila.rotulo}</div>
                  <div className="text-xs text-stone-500">{fila.dica}</div>
                </Link>
              );
            })}
          </div>

          {proximos.length > 0 && (
            <ul className="mt-3 divide-y rounded-lg border bg-white">
              {proximos.map((p) => {
                const m = p.pagamento.metadata ?? {};
                return (
                  <li key={p.ref}>
                    <Link href={`/admin/pedidos/${p.ref}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm hover:bg-stone-50">
                      <span>
                        <span className="font-medium">{m.empresa || m.cliente_nome}</span>{' '}
                        <span className="text-xs text-stone-500">
                          · {FILAS.find((f) => f.id === p.fila)!.rotulo} · {m.entrega === 'retirada' ? 'retirada' : 'envio'} · pago{' '}
                          {dataHora.format(new Date(p.pagamento.date_approved ?? p.pagamento.date_created))}
                        </span>
                      </span>
                      <span className="font-semibold">{formatPriceBRL(p.pagamento.transaction_amount)} ›</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          {proximos.length === 0 && !erro && <p className="mt-3 text-sm text-stone-500">Nenhum pedido esperando por você.</p>}
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            <Link className="underline" href="/admin/pedidos">
              Todos os pedidos
            </Link>
            <span className="text-stone-500">
              {n('transito')} a caminho · {n('aguardando')} aguardando pagamento
            </span>
          </div>
        </section>

        {top.length > 0 && (
          <section>
            <h2 className="mb-2 font-serif text-lg text-ink">Mais vendidas · 30 dias</h2>
            <ol className="divide-y rounded-lg border bg-white">
              {top.map((t, i) => (
                <li key={t.nome} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="w-5 shrink-0 text-xs font-semibold text-stone-400">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{t.nome}</span>
                  <span className="shrink-0 text-xs text-stone-500">{t.qtd} un.</span>
                  <span className="w-24 shrink-0 text-right font-medium tabular-nums">{formatPriceBRL(t.total)}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {pendencias.length > 0 && (
          <section className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
            <h2 className="mb-1 font-medium text-amber-900">Falta configurar</h2>
            <ul className="list-disc space-y-0.5 pl-5 text-amber-900">
              {pendencias.map((i) => (
                <li key={i.nome}>
                  <strong>{i.nome}:</strong> {i.falta}
                </li>
              ))}
            </ul>
            <Link href="/admin/integracoes" className="mt-2 inline-block underline">
              Ver integrações
            </Link>
          </section>
        )}

        <section>
          <h2 className="mb-2 font-serif text-lg text-ink">Catálogo</h2>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/admin/produtos" className="rounded-lg border bg-white px-4 py-3 hover:border-stone-500">
              <div className="text-2xl font-semibold">{ativos ?? 0}</div>
              <div className="text-stone-500">produtos à venda</div>
            </Link>
            <Link href="/admin/produtos" className="rounded-lg border bg-white px-4 py-3 hover:border-stone-500">
              <div className="text-2xl font-semibold">{ocultos ?? 0}</div>
              <div className="text-stone-500">ocultos / esgotados</div>
            </Link>
            <Link href="/admin/produtos/novo" className="flex items-center rounded-lg border border-dashed bg-white px-4 py-3 hover:border-stone-500">
              + Novo produto
            </Link>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
