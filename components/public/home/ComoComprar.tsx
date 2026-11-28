import Link from 'next/link';
import { Reveal } from '@/components/public/primitives/Reveal';
import { WaLink } from '@/components/public/primitives/WaLink';
import { PEDIDO_MINIMO } from '@/lib/content/atacado';
import { waGeneral, waWholesale } from '@/lib/whatsapp';
import { COMPRA_NO_SITE } from '@/lib/contas/ligado';
import { ComoComprarPassos, type Passo } from '@/components/public/home/ComoComprarPassos';
import { WhatsAppIcon } from '@/components/public/icons';

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
    texto: `No mínimo ${PEDIDO_MINIMO} peças, misturando modelos e cores. O preço de atacado já está no site.`,
    icone: 'sacola',
  },
  {
    titulo: 'Finalize aqui no site',
    texto:
      'Crie sua conta com CPF ou CNPJ. Retire grátis no Brás ou receba com o frete calculado pelo CEP.',
    icone: 'checkout',
  },
  {
    titulo: 'Pague e acompanhe',
    texto:
      'Pix, cartão ou boleto. Separamos em até 1 dia útil, e você acompanha tudo na sua conta.',
    icone: 'caminhao',
  },
] satisfies Passo[];

const CONDICOES_SITE = [
  ['Pedido mínimo', `${PEDIDO_MINIMO} peças`],
  ['Compra', 'Pelo site, com CPF ou CNPJ'],
  ['Pagamento', 'Pix, cartão ou boleto'],
  ['Entrega', 'Envio ou retirada no Brás'],
] as const;

/** Quando a compra pelo site está desligada (interruptor de emergência). */
const PASSOS_WHATS = [
  {
    titulo: 'Escolha as peças',
    texto: `Monte o pedido no catálogo, com no mínimo ${PEDIDO_MINIMO} peças.`,
    icone: 'sacola',
  },
  {
    titulo: 'Mande pelo WhatsApp',
    texto:
      'Cada peça tem um botão que já abre a conversa com o nome, a cor e o preço. A gente confirma a disponibilidade e calcula o frete pelo CEP.',
    icone: 'whats',
  },
  {
    titulo: 'Pague e receba',
    texto:
      'Pix, cartão ou boleto. O pedido segue por transportadora ou fica separado pra retirada no Brás.',
    icone: 'caminhao',
  },
] satisfies Passo[];

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
    <section className="uni-como uni-section" id="atacado">
      <div className="uni-container">
        <Reveal className="uni-como-topo">
          <div>
            <p className="uni-como-ey">Como comprar</p>
            <h2 className="uni-como-h">
              Só atacado, <em>a partir de {PEDIDO_MINIMO} peças.</em>
            </h2>
          </div>
          <div className="uni-como-ctas">
            {COMPRA_NO_SITE ? (
              <>
                <Link href="/#catalogo" className="uni-como-btn is-cheio">
                  Ver o catálogo <span aria-hidden="true">→</span>
                </Link>
                <WaLink href={waGeneral} className="uni-como-btn">
                  <WhatsAppIcon size={16} /> Dúvidas
                </WaLink>
              </>
            ) : (
              <WaLink href={waWholesale} className="uni-como-btn is-cheio">
                <WhatsAppIcon size={16} /> Receber tabela de atacado
              </WaLink>
            )}
          </div>
        </Reveal>

        <ComoComprarPassos passos={PASSOS} />

        <p className="uni-como-resumo">
          {CONDICOES.map(([termo, valor], i) => (
            <span key={termo}>
              {i > 0 && <b aria-hidden="true">·</b>}
              <span className="uni-como-resumo-t">{termo}:</span> {valor}
            </span>
          ))}
          <Link href="/catalogo" className="uni-como-pdf">
            Catálogo em PDF ↗
          </Link>
        </p>
      </div>
    </section>
  );
}
