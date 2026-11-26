import { rotuloDocumento } from '@/lib/contas/regras';
import Image from 'next/image';
import Link from 'next/link';
import { formaDePagamento, pecasDoPagamento, type Pagamento } from '@/lib/checkout/mercadopago';
import type { EstadoPedido } from '@/lib/automacao/pedido';
import { formatPriceBRL } from '@/lib/format';
import { publicImageUrl } from '@/lib/supabase/image-url';
import { STORE } from '@/lib/content/store';
import { linkDeRastreio } from '@/lib/automacao/rastreio-link';

const quando = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });

/** "Nome · Cor · Tam. X" (título do item no Mercado Pago) → nome e variação. */
function partes(titulo: string) {
  const [nome, ...resto] = titulo.split(' · ');
  return { nome: nome ?? titulo, variacao: resto.join(' · ') };
}

/**
 * O pedido por inteiro, como a cliente quer ver: em que pé está, o que
 * comprou, quanto pagou e como vai receber.
 */
export function DetalhePedido({ p, andamento, fotos }: { p: Pagamento; andamento: EstadoPedido | null; fotos: Map<string, string> }) {
  const m = p.metadata ?? {};
  const pecas = pecasDoPagamento(p);
  const pago = p.status === 'approved' || p.status === 'authorized';
  const retirada = m.entrega === 'retirada';
  const frete = Number(m.frete_valor ?? 0);
  const subtotal = pecas.reduce((s, i) => s + Number(i.unit_price) * Number(i.quantity), 0);

  const etapas = [
    { feito: true, titulo: 'Pedido feito', detalhe: quando.format(new Date(p.date_created)) },
    {
      feito: pago,
      titulo: pago ? 'Pagamento aprovado' : 'Aguardando pagamento',
      detalhe: pago && p.date_approved ? `${formaDePagamento(p)} · ${quando.format(new Date(p.date_approved))}` : formaDePagamento(p),
    },
    {
      feito: !!andamento?.nota && !andamento.nota.cancelada,
      titulo: 'Nota fiscal',
      detalhe: andamento?.nota
        ? `NF-e nº ${andamento.nota.numero}${andamento.nota.cancelada ? ' (cancelada)' : ''}`
        : 'Emitida depois do pagamento',
    },
    ...(retirada
      ? [
          {
            feito: !!andamento?.prontoEm,
            titulo: 'Pronto para retirar',
            detalhe: andamento?.prontoEm
              ? `${STORE.name}, ${STORE.unitText} · desde ${quando.format(new Date(andamento.prontoEm))}`
              : `Avisamos por e-mail quando estiver separado · ${STORE.name}, ${STORE.unitText}`,
          },
          {
            feito: !!andamento?.retiradoEm,
            titulo: 'Retirado',
            detalhe: andamento?.retiradoEm ? quando.format(new Date(andamento.retiradoEm)) : 'Informe o número do pedido na loja',
          },
        ]
      : [
          {
            feito: !!andamento?.postadoEm,
            titulo: andamento?.postadoEm ? 'Enviado' : 'Envio',
            detalhe: andamento?.postadoEm
              ? `${m.frete ? `${String(m.frete).split(' · ')[0]} · ` : ''}${quando.format(new Date(andamento.postadoEm))}`
              : andamento?.rastreio?.length
                ? 'Etiqueta pronta · postamos em breve'
                : 'Separamos em até 1 dia útil e postamos',
          },
          {
            feito: !!andamento?.entregueEm,
            titulo: 'Entregue',
            detalhe: andamento?.entregueEm ? quando.format(new Date(andamento.entregueEm)) : 'Avisamos por e-mail a cada etapa',
          },
        ]),
  ];

  return (
    <div className="uni-detalhe">
      <ol className="uni-detalhe-etapas">
        {etapas.map((e) => (
          <li key={e.titulo} className={e.feito ? 'is-feito' : ''}>
            <span aria-hidden="true">{e.feito ? '✓' : ''}</span>
            <div>
              <strong>{e.titulo}</strong>
              <small>{e.detalhe}</small>
            </div>
          </li>
        ))}
      </ol>

      {(andamento?.nota?.danfe || andamento?.rastreio?.length) && (
        <div className="uni-detalhe-docs">
          {andamento?.nota?.danfe && !andamento.nota.cancelada && (
            <a href={andamento.nota.danfe} target="_blank" rel="noopener noreferrer">
              Ver nota fiscal (PDF)
            </a>
          )}
          {andamento?.nota?.xml && !andamento.nota.cancelada && <a href={andamento.nota.xml}>Baixar XML da nota</a>}
          {andamento?.rastreio?.length ? (
            <span>
              Código de rastreio: <strong>{andamento.rastreio.join(', ')}</strong> ·{' '}
              <a href={linkDeRastreio(andamento.rastreio[0]!)} target="_blank" rel="noopener noreferrer">
                Rastrear entrega
              </a>
            </span>
          ) : null}
        </div>
      )}

      <h2>Peças</h2>
      <ul className="uni-detalhe-pecas">
        {pecas.map((i, k) => {
          const { nome, variacao } = partes(i.title);
          const foto = fotos.get(String(i.id ?? ''));
          return (
            <li key={k}>
              <span className="uni-detalhe-foto">{foto && <Image src={publicImageUrl(foto)} alt="" fill sizes="64px" />}</span>
              <span className="uni-detalhe-nome">
                <strong>{nome}</strong>
                <small>
                  {variacao ? `${variacao} · ` : ''}
                  {Number(i.quantity)} × {formatPriceBRL(Number(i.unit_price))}
                </small>
              </span>
              <b>{formatPriceBRL(Number(i.unit_price) * Number(i.quantity))}</b>
            </li>
          );
        })}
      </ul>

      <div className="uni-checkout-total uni-detalhe-total">
        <div>
          <span>Peças</span>
          <span>{formatPriceBRL(subtotal)}</span>
        </div>
        <div>
          <span>Frete{m.frete ? ` · ${m.frete}` : ''}</span>
          <span>{retirada ? 'Grátis (retirada)' : formatPriceBRL(frete)}</span>
        </div>
        <div className="is-grande">
          <span>Total</span>
          <span>{formatPriceBRL(p.transaction_amount)}</span>
        </div>
      </div>

      <div className="uni-detalhe-grade">
        <div>
          <h3>Entrega</h3>
          <p>{retirada ? `Retirada na loja · ${STORE.name}, ${STORE.unitText}, ${STORE.street}, ${STORE.district}` : `${m.frete ? `${m.frete} · ` : ''}${m.endereco || '—'}`}</p>
        </div>
        <div>
          <h3>Seus dados</h3>
          <p>
            {[m.empresa, `${rotuloDocumento(m.cnpj)} ${m.cnpj}`].filter(Boolean).join(' · ')}
            <br />
            {m.cliente_nome} · {m.telefone}
          </p>
        </div>
      </div>
      <p className="uni-conta-pequeno">
        <Link href="/conta/pedidos">← Todos os meus pedidos</Link>
      </p>
    </div>
  );
}
