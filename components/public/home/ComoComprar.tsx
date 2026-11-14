import { Reveal } from '@/components/public/primitives/Reveal';
import { WhatsAppButton } from '@/components/public/primitives/WhatsAppButton';
import { PEDIDO_MINIMO } from '@/lib/content/atacado';
import { waWholesale } from '@/lib/whatsapp';

/**
 * Como se compra na Uni Bolsas — e só existe um jeito: atacado.
 *
 * Antes esta seção eram dois cartões lado a lado, atacado e varejo, cada um
 * com o seu botão. Com a venda só no atacado, o que a pessoa precisa aqui não
 * é escolher um caminho, é entender o caminho: por isso virou uma sequência
 * de três passos (numerada porque É uma sequência) com as condições ao lado.
 */
const PASSOS = [
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

const CONDICOES = [
  ['Pedido mínimo', `${PEDIDO_MINIMO} peças`],
  ['Tabela de preço', 'Enviada pelo WhatsApp'],
  ['Pagamento', 'Pix, cartão ou boleto'],
  ['Entrega', 'Transportadora ou retirada no Brás'],
] as const;

export function ComoComprar() {
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
              Não vendemos peça avulsa. O pedido é fechado direto com a gente
              pelo WhatsApp, sem carrinho e sem cadastro no site.
            </p>
            <dl className="uni-how-terms">
              {CONDICOES.map(([termo, valor]) => (
                <div key={termo} className="uni-how-term">
                  <dt>{termo}</dt>
                  <dd>{valor}</dd>
                </div>
              ))}
            </dl>
            <WhatsAppButton href={waWholesale} variant="dark">
              Receber tabela de atacado
            </WhatsAppButton>
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
