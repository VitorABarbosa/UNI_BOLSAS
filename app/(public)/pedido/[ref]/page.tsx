import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { contasLiberadas } from '@/lib/contas/acesso';
import { clienteAtual } from '@/lib/contas/sessao';
import { Caixa } from '@/components/public/conta/Caixa';
import { LimparSacola } from '@/components/public/checkout/LimparSacola';
import { formaDePagamento, melhorPagamento, mercadoPagoConfigurado, pagamentosDoPedido, type Pagamento } from '@/lib/checkout/mercadopago';
import { REF_PEDIDO } from '@/lib/checkout/tipos';
import { atualizarRastreio, lerEstado } from '@/lib/automacao/pedido';
import { formatPriceBRL } from '@/lib/format';
import { STORE } from '@/lib/content/store';
import { waLink } from '@/lib/whatsapp';
import { DetalhePedido } from '@/components/public/conta/DetalhePedido';
import { fotosDosPedidos } from '@/lib/checkout/meus-pedidos';

export const metadata: Metadata = {
  title: 'Seu pedido · Uni Bolsas',
  robots: { index: false, follow: false },
};

/**
 * Para onde o Mercado Pago devolve a cliente. O status vem da API do
 * Mercado Pago (não dos parâmetros do endereço, que qualquer um pode
 * editar) e só aparece pra dona do pedido.
 */
export default async function PedidoPage({ params }: { params: Promise<{ ref: string }> }) {
  if (!(await contasLiberadas())) notFound();
  const { ref } = await params;
  if (!REF_PEDIDO.test(ref)) notFound();
  const cliente = await clienteAtual();
  if (!cliente) redirect(`/conta/entrar?next=/pedido/${ref}`);

  let pagamento: Pagamento | null = null;
  let falhou = false;
  if (mercadoPagoConfigurado()) {
    try {
      pagamento = melhorPagamento(await pagamentosDoPedido(ref), cliente.id);
    } catch (e) {
      console.error('[pedido] consulta falhou:', e instanceof Error ? e.message : e);
      falhou = true;
    }
  } else falhou = true;

  const status = pagamento?.status;
  const ajuda = waLink(`Olá! É sobre o meu pedido ${ref} no site.`);
  const retirada = pagamento?.metadata?.entrega === 'retirada';

  if (falhou) {
    return (
      <Caixa rotulo={`Pedido ${ref}`} titulo={<>Quase lá</>}>
        <p className="uni-conta-feito">Não conseguimos consultar o pagamento agora. Atualize a página em instantes.</p>
      </Caixa>
    );
  }

  if (status === 'approved' || status === 'authorized') {
    const bruto = await lerEstado(ref).catch(() => null);
    const andamento = bruto ? await atualizarRastreio(bruto) : null;
    const fotos = await fotosDosPedidos([pagamento!]);
    return (
      <Caixa largo rotulo={`Pedido ${ref}`} titulo={<>Pedido <em>confirmado.</em></>} sub={`${formaDePagamento(pagamento!)} aprovado · ${formatPriceBRL(pagamento!.transaction_amount)}`}>
        <LimparSacola />
        <div className="uni-conta-feito">
          <p>Recebemos seu pagamento. Mandamos o comprovante para <strong>{cliente.email}</strong>.</p>
          <ol className="uni-pedido-passos">
            <li>Separamos suas peças no Brás em até 1 dia útil.</li>
            {retirada ? (
              <li>Avisamos no seu WhatsApp quando estiver pronto para retirar no {STORE.name}, {STORE.unitText}.</li>
            ) : pagamento?.metadata?.entrega === 'envio' ? (
              <li>Postamos pelo {pagamento.metadata.frete} e mandamos o código de rastreio no seu WhatsApp.</li>
            ) : (
              <li>Chamamos você no WhatsApp para combinar o frete e mandar o código de rastreio.</li>
            )}
          </ol>
          <Link className="uni-conta-btn is-linha" href="/#catalogo">Voltar ao catálogo</Link>
          <p className="uni-conta-pequeno">Dúvidas? <a href={ajuda} target="_blank" rel="noopener noreferrer">Fale com a gente no WhatsApp</a></p>
        </div>
        <DetalhePedido p={pagamento!} andamento={andamento} fotos={fotos} />
      </Caixa>
    );
  }

  if (status === 'pending' || status === 'in_process') {
    return (
      <Caixa largo rotulo={`Pedido ${ref}`} titulo={<>Aguardando pagamento</>} sub={pagamento ? `${formaDePagamento(pagamento)} · ${formatPriceBRL(pagamento.transaction_amount)}` : undefined}>
        <LimparSacola />
        <div className="uni-conta-feito">
          <p>
            {pagamento?.payment_type_id === 'ticket'
              ? 'Assim que o boleto compensar (até 2 dias úteis), seu pedido entra em separação.'
              : 'Assim que o pagamento for confirmado, seu pedido entra em separação. Avisamos por e-mail.'}
          </p>
          <Link className="uni-conta-btn is-linha" href="/#catalogo">Voltar ao catálogo</Link>
          <p className="uni-conta-pequeno">Dúvidas? <a href={ajuda} target="_blank" rel="noopener noreferrer">Fale com a gente no WhatsApp</a></p>
        </div>
        <DetalhePedido p={pagamento!} andamento={null} fotos={await fotosDosPedidos([pagamento!])} />
      </Caixa>
    );
  }

  return (
    <Caixa rotulo={`Pedido ${ref}`} titulo={<>Pagamento não concluído</>}>
      <div className="uni-conta-feito">
        <p>
          {status === 'rejected'
            ? 'O pagamento foi recusado. Nada foi cobrado. Você pode tentar de novo, com outra forma de pagamento se preferir.'
            : 'Não encontramos o pagamento deste pedido. Nada foi cobrado. Suas peças continuam na sacola.'}
        </p>
        <Link className="uni-conta-btn" href="/finalizar">Tentar de novo</Link>
        <p className="uni-conta-pequeno">Precisa de ajuda? <a href={ajuda} target="_blank" rel="noopener noreferrer">Fale com a gente no WhatsApp</a></p>
      </div>
    </Caixa>
  );
}
