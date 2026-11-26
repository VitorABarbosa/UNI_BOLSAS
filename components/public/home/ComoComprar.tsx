import Link from 'next/link';
import { Reveal } from '@/components/public/primitives/Reveal';
import { WhatsAppButton } from '@/components/public/primitives/WhatsAppButton';
import { PEDIDO_MINIMO } from '@/lib/content/atacado';
import { waGeneral, waWholesale } from '@/lib/whatsapp';
import { COMPRA_NO_SITE } from '@/lib/contas/ligado';

const PASSOS_ALL = () => (COMPRA_NO_SITE ? PASSOS_SITE : PASSOS_WHATS);

/**
 * Como se compra na Uni Bolsas — e só existe um jeito: atacado.
 *
 * Antes esta seção eram dois cartões lado a lado, atacado e varejo, cada um
 * com o seu botão. Com a venda só no atacado, o que a pessoa precisa aqui não
 * é escolher um caminho, é entender o caminho: por isso virou uma sequência
 * de três passos (numerada porque É uma sequência) com as condições ao lado.
 */
const PASSOS_SITE = [
  {
    titulo: 'Escolha as peças',
    texto: `Coloque na sacola, com no mínimo ${PEDIDO_MINIMO} peças. Pode misturar modelos e cores; os preços de atacado já estão no site.`,
  },
  {
    titulo: 'Finalize aqui no site',
    texto:
      'Crie sua conta de lojista com o CNPJ e escolha: retirar grátis no Brás ou receber pelo correio, com o frete calculado pelo CEP.',
  },
  {
    titulo: 'Pague e acompanhe',
    texto:
      'Pix, cartão ou boleto pelo Mercado Pago. Separamos em até 1 dia útil, e você acompanha o pedido, a nota e o rastreio na sua conta.',
  },
] as const;

const CONDICOES_SITE = [
  ['Pedido mínimo', `${PEDIDO_MINIMO} peças`],
  ['Compra', 'Pelo site, com conta de lojista (CNPJ)'],
  ['Pagamento', 'Pix, cartão ou boleto'],
  ['Entrega', 'Correio/transportadora ou retirada no Brás'],
] as const;

/** Quando a compra pelo site está desligada (interruptor de emergência). */
const PASSOS_WHATS = [
  {
    titulo: 'Escolha as peças',
    texto: `Monte o pedido no catálogo, com no mínimo ${PEDIDO_MINIMO} peças.`,
  },
  {
    titulo: 'Mande pelo WhatsApp',
    texto:
      'Cada peça tem um botão que já abre a conversa com o nome, a cor e o preço. A gente confirma a disponibilidade e calcula o frete pelo CEP.',
  },
  {
    titulo: 'Pague e receba',
    texto:
      'Pix, cartão ou boleto. O pedido segue por transportadora ou fica separado pra retirada no Brás.',
  },
] as const;

const CONDICOES_WHATS = [
  ['Pedido mínimo', `${PEDIDO_MINIMO} peças`],
  ['Tabela de preço', 'Enviada pelo WhatsApp'],
  ['Pagamento', 'Pix, cartão ou boleto'],
  ['Entrega', 'Transportadora ou retirada no Brás'],
] as const;

export function ComoComprar() {
  const PASSOS = PASSOS_ALL();
  const CONDICOES = COMPRA_NO_SITE ? CONDICOES_SITE : CONDICOES_WHATS;
  return (
    <section className="uni-how uni-section" id="atacado">
      <div className="uni-container">
        <div className="uni-how-grid">
          <Reveal className="uni-how-intro">
            <h2 className="uni-h2">
              Só atacado,
              <br />
              <em>a partir de {PEDIDO_MINIMO} peças.</em>
            </h2>
            <p className="uni-how-lede">
              {COMPRA_NO_SITE
                ? 'Não vendemos peça avulsa. Monte o pedido aqui no site e pague com Pix, cartão ou boleto. Dúvida sobre alguma peça? A gente responde no WhatsApp.'
                : 'Não vendemos peça avulsa. O pedido é fechado direto com a gente pelo WhatsApp, sem carrinho e sem cadastro no site.'}
            </p>
            <dl className="uni-how-terms">
              {CONDICOES.map(([termo, valor]) => (
                <div key={termo} className="uni-how-term">
                  <dt>{termo}</dt>
                  <dd>{valor}</dd>
                </div>
              ))}
            </dl>
            <div className="uni-how-ctas">
              {COMPRA_NO_SITE ? (
                <>
                  <Link href="/#catalogo" className="uni-how-cta-site">
                    Ver o catálogo e comprar
                  </Link>
                  <WhatsAppButton href={waGeneral} variant="dark">
                    Tirar dúvidas no WhatsApp
                  </WhatsAppButton>
                </>
              ) : (
                <WhatsAppButton href={waWholesale} variant="dark">
                  Receber tabela de atacado
                </WhatsAppButton>
              )}
              <Link href="/catalogo" className="uni-how-link">
                Catálogo pra compartilhar ou salvar em PDF
              </Link>
            </div>
          </Reveal>
          <ol className="uni-how-steps">
            {PASSOS.map((p, i) => (
              <li key={p.titulo} className="uni-how-step">
                <span className="uni-how-step-n" aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <h3 className="uni-how-step-h">{p.titulo}</h3>
                  <p className="uni-how-step-p">{p.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
