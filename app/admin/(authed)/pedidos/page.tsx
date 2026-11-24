import { requireAdmin } from '@/lib/auth/require-admin';
import { AdminShell } from '@/components/admin/shell/AdminShell';
import {
  formaDePagamento,
  listarPagamentos,
  mercadoPagoConfigurado,
  statusEmPortugues,
  type Pagamento,
} from '@/lib/checkout/mercadopago';
import { REF_PEDIDO } from '@/lib/checkout/tipos';
import { formatPriceBRL } from '@/lib/format';

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
export default async function PedidosPage() {
  const { user } = await requireAdmin();

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

        {erro && <p className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">{erro}</p>}
        {!erro && pagamentos.length === 0 && (
          <p className="text-sm text-stone-500">Nenhum pedido pelo site ainda.</p>
        )}

        <div className="space-y-3">
          {pagamentos.map((p) => {
            const m = p.metadata ?? {};
            const itens = p.additional_info?.items ?? [];
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
                  <span className="text-stone-500">{m.entrega === 'retirada' ? 'Retirada' : 'Envio · frete a combinar'}</span>
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
                    <div>{m.entrega === 'retirada' ? 'Retirada na loja' : m.endereco || '—'}</div>
                    <div className="mt-2 text-xs text-stone-500">Mercado Pago nº {p.id}</div>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </AdminShell>
  );
}
