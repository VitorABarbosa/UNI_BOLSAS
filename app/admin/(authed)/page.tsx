import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/require-admin';
import { AdminShell } from '@/components/admin/shell/AdminShell';
import { A_FAZER, carregarPedidos, FILAS, type Fila, type PedidoAdmin } from '@/lib/admin/pedidos';
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

/** O dia da loja: o que vendeu, o que falta fazer e o que está pendente de configurar. */
export default async function AdminInicioPage() {
  const { user, supabase } = await requireAdmin();

  const [{ pedidos, erro }, integracoes, { count: ativos }, { count: ocultos }] = await Promise.all([
    carregarPedidos(),
    statusDasIntegracoes(),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('active', false),
  ]);

  const vendas = resumoDeVendas(pedidos.filter((p) => p.pagamento.status === 'approved'));
  const n = (f: Fila) => pedidos.filter((p) => p.fila === f).length;
  const proximos = pedidos.filter((p) => A_FAZER.includes(p.fila)).reverse().slice(0, 6);
  const pendencias = integracoes.filter((i) => !i.ok);

  return (
    <AdminShell user={{ email: user.email ?? '' }} title="Início">
      <div className="space-y-6 p-4 md:p-6">
        {erro && <p className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">{erro}</p>}

        <section>
          <h2 className="mb-2 font-serif text-lg text-ink">Vendas pelo site</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {vendas.map((v) => (
              <div key={v.rotulo} className="rounded-lg border bg-white px-4 py-3">
                <div className="text-xs text-stone-500">{v.rotulo}</div>
                <div className="text-2xl font-semibold">{formatPriceBRL(v.total)}</div>
                <div className="text-xs text-stone-500">
                  {v.n} {v.n === 1 ? 'pedido pago' : 'pedidos pagos'}
                </div>
              </div>
            ))}
          </div>
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
