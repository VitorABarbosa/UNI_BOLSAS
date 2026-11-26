import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/require-admin';
import { AdminShell } from '@/components/admin/shell/AdminShell';
import { BotaoImprimir, PedidoAcoes } from '@/components/admin/PedidoAcoes';
import { formaDePagamento, pagamentosDoPedido, pecasDoPagamento, statusEmPortugues, type Pagamento } from '@/lib/checkout/mercadopago';
import { REF_PEDIDO } from '@/lib/checkout/tipos';
import { fotosDosPedidos } from '@/lib/checkout/meus-pedidos';
import { atualizarRastreio, lerEstado } from '@/lib/automacao/pedido';
import { linkDeRastreio } from '@/lib/automacao/rastreio-link';
import { erroDeConfiguracao, FILAS, filaDo, whatsDaCliente } from '@/lib/admin/pedidos';
import { formatPriceBRL } from '@/lib/format';
import { publicImageUrl } from '@/lib/supabase/image-url';

export const metadata = { title: 'Pedido · Uni Bolsas Admin' };
export const dynamic = 'force-dynamic';

const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' });
const PESO: Record<string, number> = { approved: 5, authorized: 4, in_process: 3, pending: 3, in_mediation: 2, refunded: 2, charged_back: 2, rejected: 1, cancelled: 1 };

function Bloco({ titulo, children, className = '' }: { titulo: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border bg-white p-4 text-sm ${className}`}>
      <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">{titulo}</h2>
      {children}
    </section>
  );
}

export default async function PedidoAdminPage({ params }: { params: Promise<{ ref: string }> }) {
  const { user } = await requireAdmin();
  const { ref } = await params;
  if (!REF_PEDIDO.test(ref)) notFound();

  let pagamentos: Pagamento[] = [];
  try {
    pagamentos = await pagamentosDoPedido(ref);
  } catch (e) {
    console.error('[admin/pedido]', e instanceof Error ? e.message : e);
  }
  const p = [...pagamentos].sort((a, b) => (PESO[b.status] ?? 0) - (PESO[a.status] ?? 0))[0];
  if (!p) {
    return (
      <AdminShell user={{ email: user.email ?? '' }} title={`Pedido ${ref}`}>
        <div className="p-6 text-sm">
          Não encontramos pagamento para este pedido (ou o Mercado Pago não respondeu).{' '}
          <Link className="underline" href="/admin/pedidos">
            Voltar aos pedidos
          </Link>
        </div>
      </AdminShell>
    );
  }

  const m = p.metadata ?? {};
  const pago = p.status === 'approved' || p.status === 'authorized';
  const bruto = pago ? await lerEstado(ref).catch(() => null) : null;
  const e = bruto ? await atualizarRastreio(bruto) : null;
  const fila = FILAS.find((f) => f.id === filaDo(p, e))!;
  const pecas = pecasDoPagamento(p);
  const totalPecas = pecas.reduce((s, i) => s + Number(i.quantity), 0);
  const subtotal = pecas.reduce((s, i) => s + Number(i.unit_price) * Number(i.quantity), 0);
  const fotos = await fotosDosPedidos([p]).catch(() => new Map<string, string>());
  const retirada = m.entrega === 'retirada';
  const whats = whatsDaCliente(m.telefone, `Olá, ${String(m.cliente_nome ?? '').split(' ')[0] || 'tudo bem'}! Aqui é da Uni Bolsas, sobre o seu pedido ${ref}.`);

  const etapas: { feito: boolean; titulo: string; quando?: string }[] = [
    { feito: true, titulo: 'Pedido feito', quando: dataHora.format(new Date(p.date_created)) },
    { feito: pago, titulo: pago ? `Pago · ${formaDePagamento(p)}` : statusEmPortugues(p.status), quando: p.date_approved ? dataHora.format(new Date(p.date_approved)) : undefined },
    { feito: !!e?.nota, titulo: e?.nota ? `Nota fiscal nº ${e.nota.numero}` : 'Nota fiscal' },
    ...(retirada
      ? [
          { feito: !!e?.prontoEm, titulo: 'Pronto para retirar (cliente avisada)', quando: e?.prontoEm ? dataHora.format(new Date(e.prontoEm)) : undefined },
          { feito: !!e?.retiradoEm, titulo: 'Retirado', quando: e?.retiradoEm ? dataHora.format(new Date(e.retiradoEm)) : undefined },
        ]
      : [
          { feito: !!e?.etiqueta, titulo: 'Etiqueta', quando: e?.etiqueta ? dataHora.format(new Date(e.etiqueta.em)) : undefined },
          { feito: !!e?.postadoEm, titulo: 'Postado', quando: e?.postadoEm ? dataHora.format(new Date(e.postadoEm)) : undefined },
          { feito: !!e?.entregueEm, titulo: 'Entregue', quando: e?.entregueEm ? dataHora.format(new Date(e.entregueEm)) : undefined },
        ]),
  ];

  return (
    <AdminShell
      user={{ email: user.email ?? '' }}
      title={`Pedido ${ref}`}
      actions={
        <span className="flex gap-2 print:hidden">
          <Link href="/admin/pedidos" className="rounded-md border bg-white px-3 py-2 text-xs">
            ← Pedidos
          </Link>
          {pago && <BotaoImprimir>Imprimir lista de separação</BotaoImprimir>}
        </span>
      }
    >
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xl font-semibold">{m.empresa || m.cliente_nome}</span>
          <span className="rounded bg-stone-900 px-2 py-0.5 text-xs font-semibold text-white">{pago ? fila.selo : statusEmPortugues(p.status)}</span>
          <span className="text-sm text-stone-500">{fila.dica}</span>
        </div>

        {e?.erro && (
          <p className={`rounded-md border p-3 text-sm print:hidden ${erroDeConfiguracao(e) ? 'border-stone-300 bg-stone-50 text-stone-700' : 'border-red-300 bg-red-50 text-red-800'}`}>
            {erroDeConfiguracao(e) ? 'ℹ ' : '⚠ '}
            {e.erro.mensagem}
            {erroDeConfiguracao(e) && !retirada ? ' Enquanto isso, você pode enviar por fora e informar o código de rastreio abaixo.' : ''}
          </p>
        )}

        {pago && fila.id !== 'concluido' && (
          <Bloco titulo="O que fazer" className="print:hidden">
            <PedidoAcoes
              refPedido={ref}
              s={{
                entrega: retirada ? 'retirada' : 'envio',
                temEtiqueta: !!e?.etiqueta,
                temErro: !!e?.erro || !e,
                postado: !!e?.postadoEm,
                entregue: !!e?.entregueEm,
                pronto: !!e?.prontoEm,
                retirado: !!e?.retiradoEm,
              }}
            />
          </Bloco>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <Bloco titulo={`Peças para separar · ${totalPecas}`} className="lg:col-span-2">
            <ul className="divide-y">
              {pecas.map((i, k) => {
                const [nome, ...resto] = i.title.split(' · ');
                const foto = fotos.get(String(i.id ?? ''));
                return (
                  <li key={k} className="flex items-center gap-3 py-2">
                    <span className="hidden h-5 w-5 shrink-0 border-2 border-stone-500 print:inline-block" aria-hidden="true" />
                    <span className="relative h-16 w-12 shrink-0 overflow-hidden rounded border bg-stone-100">
                      {foto && <Image src={publicImageUrl(foto)} alt="" fill sizes="48px" className="object-cover" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{nome}</span>
                      <span className="block text-xs text-stone-500">{resto.join(' · ')}</span>
                    </span>
                    <span className="text-lg font-semibold">{Number(i.quantity)}×</span>
                    <span className="w-24 text-right text-stone-600">{formatPriceBRL(Number(i.unit_price) * Number(i.quantity))}</span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 space-y-1 border-t pt-3">
              <div className="flex justify-between">
                <span>Peças</span>
                <span>{formatPriceBRL(subtotal)}</span>
              </div>
              {Number(m.frete_valor) > 0 && (
                <div className="flex justify-between">
                  <span>Frete · {m.frete}</span>
                  <span>{formatPriceBRL(Number(m.frete_valor))}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatPriceBRL(p.transaction_amount)}</span>
              </div>
            </div>
          </Bloco>

          <Bloco titulo="Andamento">
            <ol className="space-y-2">
              {etapas.map((t) => (
                <li key={t.titulo} className="flex gap-2">
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${t.feito ? 'bg-green-700 text-white' : 'border border-stone-300'}`}>
                    {t.feito ? '✓' : ''}
                  </span>
                  <span>
                    <span className={t.feito ? 'font-medium' : 'text-stone-500'}>{t.titulo}</span>
                    {t.quando && <span className="block text-xs text-stone-500">{t.quando}</span>}
                  </span>
                </li>
              ))}
            </ol>
            {(e?.nota || e?.rastreio?.length) && (
              <div className="mt-3 space-y-1 border-t pt-3 text-xs">
                {e?.nota?.danfe && (
                  <a className="block underline" href={e.nota.danfe} target="_blank" rel="noopener noreferrer">
                    Ver nota (DANFE)
                  </a>
                )}
                {e?.nota && <div className="break-all font-mono text-stone-500">{e.nota.chave}</div>}
                {e?.rastreio?.map((c) => (
                  <a key={c} className="block underline" href={linkDeRastreio(c)} target="_blank" rel="noopener noreferrer">
                    Rastreio {c}
                  </a>
                ))}
              </div>
            )}
          </Bloco>

          <Bloco titulo="Cliente">
            <div className="font-medium">{m.empresa}</div>
            <div>CNPJ {m.cnpj}</div>
            <div>{m.cliente_nome}</div>
            <div>{m.telefone}</div>
            <div className="break-all">{m.cliente_email}</div>
            <div className="mt-3 flex flex-wrap gap-2 print:hidden">
              {whats && (
                <a href={whats} target="_blank" rel="noopener noreferrer" className="rounded-md bg-green-600 px-3 py-2 text-xs font-medium text-white">
                  WhatsApp
                </a>
              )}
              {m.cliente_email && (
                <a href={`mailto:${m.cliente_email}?subject=${encodeURIComponent(`Pedido ${ref} · Uni Bolsas`)}`} className="rounded-md border px-3 py-2 text-xs">
                  E-mail
                </a>
              )}
              {m.cliente_email && (
                <Link href={`/admin/pedidos?aba=todos&q=${encodeURIComponent(m.cliente_email)}`} className="rounded-md border px-3 py-2 text-xs">
                  Outros pedidos
                </Link>
              )}
            </div>
          </Bloco>

          <Bloco titulo="Entrega">
            {retirada ? (
              <div>Retirada na loja</div>
            ) : (
              <>
                <div className="font-medium">{m.frete || 'Envio'}</div>
                <div className="mt-1">{m.endereco}</div>
                {m.caixas && <div className="mt-1 text-stone-500">Caixas: {m.caixas}</div>}
              </>
            )}
          </Bloco>

          <Bloco titulo="Pagamento">
            <div>
              {statusEmPortugues(p.status)} · {formaDePagamento(p)}
            </div>
            <div className="text-stone-500">Mercado Pago nº {p.id}</div>
            {pagamentos.length > 1 && <div className="mt-1 text-xs text-stone-500">{pagamentos.length - 1} tentativa(s) anterior(es) de pagamento.</div>}
          </Bloco>
        </div>
      </div>
    </AdminShell>
  );
}
