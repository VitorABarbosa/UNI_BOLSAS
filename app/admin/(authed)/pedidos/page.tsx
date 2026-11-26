import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/require-admin';
import { AdminShell } from '@/components/admin/shell/AdminShell';
import { formaDePagamento, pecasDoPagamento, statusEmPortugues } from '@/lib/checkout/mercadopago';
import { formatPriceBRL } from '@/lib/format';
import { A_FAZER, carregarPedidos, combina, erroDeConfiguracao, FILAS, type Fila, type PedidoAdmin } from '@/lib/admin/pedidos';

export const metadata = { title: 'Pedidos · Uni Bolsas Admin' };
export const dynamic = 'force-dynamic';

const dataHora = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });

const COR_FILA: Record<Fila, string> = {
  separar: 'bg-amber-100 text-amber-900',
  postar: 'bg-sky-100 text-sky-900',
  retirar: 'bg-violet-100 text-violet-900',
  transito: 'bg-sky-50 text-sky-800',
  problema: 'bg-red-100 text-red-800',
  aguardando: 'bg-stone-100 text-stone-700',
  concluido: 'bg-green-100 text-green-800',
  cancelado: 'bg-stone-200 text-stone-600',
};

type Aba = 'fazer' | Fila | 'todos';

/**
 * Os pedidos do site, separados pelo que a loja precisa fazer. A fonte é o
 * Mercado Pago (cada pagamento leva o código do pedido e os dados da
 * cliente) mais o andamento salvo de cada pedido.
 */
export default async function PedidosPage({ searchParams }: { searchParams: Promise<{ aba?: string; q?: string; bling?: string }> }) {
  const { user } = await requireAdmin();
  const { aba: abaBruta, q = '', bling } = await searchParams;
  const { pedidos, erro } = await carregarPedidos();

  const contagem = (f: Fila) => pedidos.filter((p) => p.fila === f).length;
  const aFazer = pedidos.filter((p) => A_FAZER.includes(p.fila)).length;
  const abas: { id: Aba; rotulo: string; n: number }[] = [
    { id: 'fazer' as Aba, rotulo: 'A fazer', n: aFazer },
    ...FILAS.map((f) => ({ id: f.id as Aba, rotulo: f.rotulo, n: contagem(f.id) })),
    { id: 'todos' as Aba, rotulo: 'Todos', n: pedidos.length },
  ].filter((a) => a.id !== 'problema' || a.n > 0);
  // Com busca, procura em todos; sem, abre no que está pendente.
  const aba: Aba = (abas.some((a) => a.id === abaBruta) ? abaBruta : q.trim() ? 'todos' : aFazer > 0 || !pedidos.length ? 'fazer' : 'todos') as Aba;

  const visiveis = pedidos
    .filter((p) => (aba === 'todos' ? true : aba === 'fazer' ? A_FAZER.includes(p.fila) : p.fila === aba))
    .filter((p) => combina(p, q));
  // Na aba "A fazer", o mais antigo primeiro: quem pagou antes, recebe antes.
  if (aba === 'fazer') visiveis.reverse();

  const link = (a: Aba) => `/admin/pedidos?aba=${a}${q ? `&q=${encodeURIComponent(q)}` : ''}`;

  return (
    <AdminShell user={{ email: user.email ?? '' }} title="Pedidos">
      <div className="space-y-4 p-4 md:p-6">
        {bling && (
          <p className="rounded-md border bg-white p-3 text-sm">
            O Bling agora fica em <Link className="underline" href={`/admin/integracoes?bling=${encodeURIComponent(bling)}`}>Integrações</Link>.
          </p>
        )}
        {erro && <p className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">{erro}</p>}

        <form className="flex gap-2" action="/admin/pedidos">
          <input type="hidden" name="aba" value={q ? 'todos' : aba} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por código, empresa, CPF/CNPJ, nome, e-mail ou telefone"
            className="min-w-0 flex-1 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
          />
          <button className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">Buscar</button>
          {q && (
            <Link href={`/admin/pedidos?aba=${aba}`} className="rounded-md border px-3 py-2 text-sm">
              Limpar
            </Link>
          )}
        </form>

        <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0" aria-label="Filas de pedidos">
          {abas.map((a) => (
            <Link
              key={a.id}
              href={link(a.id)}
              aria-current={a.id === aba ? 'page' : undefined}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${
                a.id === aba ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-300 bg-white text-stone-700 hover:border-stone-500'
              } ${a.id === 'problema' ? 'border-red-300 text-red-800' : ''}`}
            >
              {a.rotulo} <span className={a.id === aba ? 'text-white/70' : 'text-stone-400'}>{a.n}</span>
            </Link>
          ))}
        </nav>

        {aba === 'fazer' && !q && (
          <p className="text-xs text-stone-500">Do mais antigo para o mais novo: quem pagou antes, recebe antes.</p>
        )}

        {!erro && visiveis.length === 0 && (
          <p className="rounded-lg border bg-white p-6 text-center text-sm text-stone-500">
            {q ? 'Nenhum pedido encontrado.' : aba === 'fazer' ? 'Nada pendente. Tudo em dia! 🎉' : 'Nenhum pedido aqui.'}
          </p>
        )}

        <ul className="space-y-2">
          {visiveis.map((p) => (
            <li key={p.ref}>
              <LinhaPedido p={p} />
            </li>
          ))}
        </ul>
      </div>
    </AdminShell>
  );
}

function LinhaPedido({ p }: { p: PedidoAdmin }) {
  const m = p.pagamento.metadata ?? {};
  const pecas = pecasDoPagamento(p.pagamento).reduce((s, i) => s + Number(i.quantity), 0);
  const fila = FILAS.find((f) => f.id === p.fila)!;
  const pago = p.pagamento.status === 'approved' || p.pagamento.status === 'authorized';
  return (
    <Link
      href={`/admin/pedidos/${p.ref}`}
      className="flex flex-col gap-2 rounded-lg border bg-white px-4 py-3 text-sm transition-colors hover:border-stone-500 md:flex-row md:items-center md:gap-6"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-medium">{m.empresa || m.cliente_nome || '—'}</span>
          <span className={`rounded px-2 py-0.5 text-xs font-semibold ${COR_FILA[p.fila]}`}>{pago ? fila.selo : statusEmPortugues(p.pagamento.status)}</span>
          {erroDeConfiguracao(p.estado) && <span className="rounded bg-stone-100 px-2 py-0.5 text-xs text-stone-600">sem nota automática</span>}
        </div>
        <div className="mt-0.5 text-xs text-stone-500">
          <span className="font-mono">{p.ref}</span> · {dataHora.format(new Date(p.pagamento.date_created))} ·{' '}
          {m.entrega === 'retirada' ? 'Retirada na loja' : `Envio${m.ent_cidade ? ` · ${m.ent_cidade}/${m.ent_uf}` : ''}`}
        </div>
      </div>
      <div className="flex items-center justify-between gap-6 md:justify-end">
        <span className="text-stone-600">
          {pecas} peças · {formaDePagamento(p.pagamento)}
        </span>
        <span className="font-semibold">{formatPriceBRL(p.pagamento.transaction_amount)}</span>
        <span aria-hidden="true" className="text-stone-400">
          ›
        </span>
      </div>
    </Link>
  );
}
