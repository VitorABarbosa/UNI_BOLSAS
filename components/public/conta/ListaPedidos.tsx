import Image from 'next/image';
import Link from 'next/link';
import { formaDePagamento, pecasDoPagamento, statusEmPortugues } from '@/lib/checkout/mercadopago';
import type { ResumoPedido } from '@/lib/checkout/meus-pedidos';
import type { EstadoPedido } from '@/lib/automacao/pedido';
import { formatPriceBRL } from '@/lib/format';
import { publicImageUrl } from '@/lib/supabase/image-url';

const data = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Sao_Paulo' });

/** O que a cliente quer saber de relance: em que pé está o pedido. */
function situacao(p: ResumoPedido['pagamento'], e?: EstadoPedido): { texto: string; tom: string } {
  if (p.status === 'approved') {
    if (e?.rastreio?.length) return { texto: 'Enviado', tom: 'is-enviado' };
    if (p.metadata?.entrega === 'retirada') return { texto: 'Pago · separando para retirada', tom: 'is-approved' };
    return { texto: 'Pago · em separação', tom: 'is-approved' };
  }
  return { texto: statusEmPortugues(p.status), tom: `is-${p.status}` };
}

export function ListaPedidos({
  pedidos,
  fotos,
  andamento,
}: {
  pedidos: ResumoPedido[];
  fotos: Map<string, string>;
  andamento: Map<string, EstadoPedido>;
}) {
  return (
    <ul className="uni-historico">
      {pedidos.map(({ ref, pagamento: p }) => {
        const pecas = pecasDoPagamento(p);
        const qtd = pecas.reduce((s, i) => s + Number(i.quantity), 0);
        const s = situacao(p, andamento.get(ref));
        return (
          <li key={ref}>
            <Link href={`/pedido/${ref}`} className="uni-historico-item">
              <div className="uni-historico-topo">
                <span>
                  <strong>{data.format(new Date(p.date_created))}</strong>
                  <small>Pedido {ref}</small>
                </span>
                <em className={s.tom}>{s.texto}</em>
              </div>
              <div className="uni-historico-meio">
                <div className="uni-historico-fotos" aria-hidden="true">
                  {pecas.slice(0, 4).map((i, k) => {
                    const f = fotos.get(String(i.id ?? ''));
                    return <span key={k}>{f ? <Image src={publicImageUrl(f)} alt="" fill sizes="56px" /> : null}</span>;
                  })}
                  {pecas.length > 4 && <span className="is-mais">+{pecas.length - 4}</span>}
                </div>
                <div className="uni-historico-resumo">
                  <span>
                    {qtd} {qtd === 1 ? 'peça' : 'peças'} · {formaDePagamento(p)}
                  </span>
                  <span>{p.metadata?.entrega === 'retirada' ? 'Retirada na loja' : 'Envio'}</span>
                </div>
                <b>{formatPriceBRL(p.transaction_amount)}</b>
              </div>
              <span className="uni-historico-ver">Ver detalhes →</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
