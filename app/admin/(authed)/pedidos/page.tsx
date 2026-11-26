import { requireAdmin } from '@/lib/auth/require-admin';
import { AdminShell } from '@/components/admin/shell/AdminShell';
import {
  entregaEmTexto,
  formaDePagamento,
  pecasDoPagamento,
  listarPagamentos,
  mercadoPagoConfigurado,
  statusEmPortugues,
  type Pagamento,
} from '@/lib/checkout/mercadopago';
import { REF_PEDIDO } from '@/lib/checkout/tipos';
import { formatPriceBRL } from '@/lib/format';
import { blingConectado, blingConfigurado } from '@/lib/automacao/bling';
import { lerEstado, type EstadoPedido } from '@/lib/automacao/pedido';
import { PedidoAcoes } from '@/components/admin/PedidoAcoes';

export const metadata = { title: 'Pedidos · Uni Bolsas Admin' };
export const dynamic = 'force-dynamic';

const COR: Record<string, string> = {
  approved: 'bg-green-100 text-green-800',
  pending: 'bg-amber-100 text-amber-800',
  in_process: 'bg-amber-100 text-amber-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-stone-200 text-stone-700',
  refunded: 'bg-stone-200 text-stone-700',
};

const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' });

/**
 * Pedidos pagos pelo site. A fonte é o próprio Mercado Pago: cada pagamento
 * leva o código do pedido e os dados da cliente. Nada disso fica no Supabase.
 */
export default async function PedidosPage({ searchParams }: { searchParams: Promise<{ bling?: string }> }) {
  const { user } = await requireAdmin();
  const { bling: avisoBling } = await searchParams;
  const bling = blingConfigurado() ? await blingConectado() : null;

  let pagamentos: Pagamento[] = [];
  let erro: string | null = null;
  if (!mercadoPagoConfigurado()) {
    erro = 'O Mercado Pago ainda não está configurado (falta MERCADOPAGO_ACCESS_TOKEN nas variáveis da Hostinger).';
  } else {
    try {
      pagamentos = (await listarPagamentos(100)).filter((p) => p.external_reference && REF_PEDIDO.test(p.external_reference));
    } catch (e) {
      console.error('[admin/pedidos]', e instanceof Error ? e.message : e);
      erro = 'Não foi possível consultar o Mercado Pago agora. Atualize a página em instantes.';
    }
  }

  const aprovados = pagamentos.filter((p) => p.status === 'approved');
  // Andamento da nota/etiqueta de cada pedido pago.
  const estados = new Map<string, EstadoPedido | null>(
    await Promise.all(aprovados.map(async (p) => [p.external_reference!, await lerEstado(p.external_reference!).catch(() => null)] as const)),
  );

  return (
    <AdminShell user={{ email: user.email ?? '' }} title="Pedidos">
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap gap-4">
          <div className="rounded-lg border bg-white px-5 py-4">
            <div className="text-xs text-stone-500">Pagos (últimos 100 pagamentos)</div>
            <div className="text-2xl font-semibold">{aprovados.length}</div>
          </div>
          <div className="rounded-lg border bg-white px-5 py-4">
            <div className="text-xs text-stone-500">Total pago</div>
            <div className="text-2xl font-semibold">
              {formatPriceBRL(aprovados.reduce((s, p) => s + p.transaction_amount, 0))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white px-5 py-4 text-sm">
          <div>
            <div className="font-medium">Nota fiscal automática (Bling)</div>
            <div className="text-stone-500">
              {!bling
                ? 'Falta configurar BLING_CLIENT_ID e BLING_CLIENT_SECRET nas variáveis da Hostinger.'
                : bling.conectado
                  ? `Conectado desde ${new Date(bling.desde!).toLocaleDateString('pt-BR')}. Cada venda aprovada gera a NF-e e, se for envio, a etiqueta.`
                  : 'Ainda não conectado: as vendas entram, mas sem nota e etiqueta automáticas.'}
            </div>
            {avisoBling === 'ok' && <div className="mt-1 text-green-700">Bling conectado com sucesso.</div>}
            {avisoBling && avisoBling !== 'ok' && <div className="mt-1 text-red-700">Não deu certo conectar o Bling ({avisoBling}). Tente de novo.</div>}
          </div>
          {bling && (
            <a href="/api/bling/conectar" className="rounded bg-stone-900 px-4 py-2 text-xs font-medium text-white">
              {bling.conectado ? 'Reconectar Bling' : 'Conectar Bling'}
            </a>
          )}
        </div>

        {erro && <p className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">{erro}</p>}
        {!erro && pagamentos.length === 0 && (
          <p className="text-sm text-stone-500">Nenhum pedido pelo site ainda.</p>
        )}

        <div className="space-y-3">
          {pagamentos.map((p) => {
            const m = p.metadata ?? {};
            const itens = pecasDoPagamento(p);
            return (
              <details key={p.id} className="rounded-lg border bg-white">
                <summary className="flex cursor-pointer flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3 text-sm">
                  <span className="font-mono">{p.external_reference}</span>
                  <span className="text-stone-500">{dataHora.format(new Date(p.date_created))}</span>
                  <span className="font-medium">{m.empresa ?? '—'}</span>
                  <span>{formatPriceBRL(p.transaction_amount)}</span>
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${COR[p.status] ?? 'bg-stone-100'}`}>
                    {statusEmPortugues(p.status)} · {formaDePagamento(p)}
                  </span>
                  <span className="text-stone-500">
                    {m.entrega === 'retirada' ? 'Retirada' : m.entrega === 'envio' ? `Envio · ${m.caixas || ''}` : 'Envio · frete a combinar'}
                  </span>
                  {p.status === 'approved' && <Andamento e={estados.get(p.external_reference!) ?? null} envio={m.entrega === 'envio'} />}
                </summary>
                <div className="grid gap-4 border-t px-4 py-4 text-sm md:grid-cols-3">
                  <div>
                    <div className="mb-1 text-xs uppercase tracking-wide text-stone-500">Cliente</div>
                    <div>{m.empresa} · CNPJ {m.cnpj}</div>
                    <div>{m.cliente_nome}</div>
                    <div>{m.telefone}</div>
                    <div>{m.cliente_email}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs uppercase tracking-wide text-stone-500">Peças para separar</div>
                    <ul className="space-y-0.5">
                      {itens.map((i, k) => (
                        <li key={k}>
                          {Number(i.quantity)} × {i.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="mb-1 text-xs uppercase tracking-wide text-stone-500">Entrega</div>
                    <div>{entregaEmTexto(m)}</div>
                    {m.entrega === 'envio' && m.frete_valor ? (
                      <div className="mt-1 text-stone-500">Frete cobrado: {formatPriceBRL(Number(m.frete_valor))}</div>
                    ) : null}
                    <div className="mt-2 text-xs text-stone-500">Mercado Pago nº {p.id}</div>
                  </div>
                  {p.status === 'approved' && (() => {
                    const e = estados.get(p.external_reference!) ?? null;
                    return (
                      <div className="md:col-span-3 space-y-2 border-t pt-3">
                        {e?.nota && (
                          <div>
                            NF-e nº {e.nota.numero} ·{' '}
                            {e.nota.danfe ? (
                              <a className="underline" href={e.nota.danfe} target="_blank" rel="noopener noreferrer">
                                ver DANFE
                              </a>
                            ) : (
                              'autorizada'
                            )}
                            <span className="ml-2 font-mono text-xs text-stone-500">{e.nota.chave}</span>
                          </div>
                        )}
                        {e?.rastreio?.length ? <div>Rastreio: {e.rastreio.join(', ')}</div> : null}
                        {e?.postadoEm || e?.entregueEm || e?.prontoEm || e?.retiradoEm ? (
                          <div className="text-stone-600">
                            {e.entregueEm ? 'Entregue' : e.postadoEm ? 'Postado, a caminho' : e.retiradoEm ? 'Retirado pela cliente' : 'Pronto para retirar (cliente avisada)'}
                          </div>
                        ) : null}
                        {e?.erro && <div className="text-red-700">⚠ {e.erro.mensagem}</div>}
                        <PedidoAcoes
                          refPedido={p.external_reference!}
                          temEtiqueta={!!e?.etiqueta}
                          temErro={!!e?.erro || !e}
                          retirada={m.entrega === 'retirada' ? { pronto: !!e?.prontoEm, retirado: !!e?.retiradoEm } : undefined}
                        />
                      </div>
                    );
                  })()}
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </AdminShell>
  );
}

function Andamento({ e, envio }: { e: EstadoPedido | null; envio: boolean }) {
  const chip = (ok: boolean, texto: string) => (
    <span className={`rounded px-2 py-0.5 text-xs ${ok ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-500'}`}>
      {ok ? '✓' : '·'} {texto}
    </span>
  );
  return (
    <span className="flex gap-1">
      {chip(!!e?.nota, 'NF')}
      {envio && chip(!!e?.etiqueta, 'Etiqueta')}
      {envio && chip(!!e?.postadoEm, 'Postado')}
      {envio && chip(!!e?.entregueEm, 'Entregue')}
      {!envio && chip(!!e?.prontoEm, 'Pronto')}
      {!envio && chip(!!e?.retiradoEm, 'Retirado')}
      {e?.erro && <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-800">⚠ {e.erro.etapa}</span>}
    </span>
  );
}
