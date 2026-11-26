import type { Metadata } from 'next';
import Link from 'next/link';
import { STORE } from '@/lib/content/store';
import { PEDIDO_MINIMO } from '@/lib/content/atacado';
import { waGeneral } from '@/lib/whatsapp';

export const metadata: Metadata = {
  title: 'Termos de compra · Uni Bolsas',
  description: 'Como funciona a compra no atacado pelo site da Uni Bolsas: pedido mínimo, pagamento, separação, retirada e envio.',
  alternates: { canonical: '/termos' },
};

/** Atualize junto com qualquer mudança na forma de vender. */
const ATUALIZADO_EM = '24 de novembro de 2026';

/**
 * Termos de compra. Escritos a partir do que o checkout realmente faz
 * (`app/(public)/finalizar`): mínimo conferido no servidor, preço recalculado
 * no fechamento, Mercado Pago, retirada ou envio com frete calculado. Se o checkout
 * mudar, este texto muda no mesmo commit.
 */
export default function TermosPage() {
  return (
    <div className="uni-legal uni-section">
      <div className="uni-container">
        <div className="uni-legal-head">
          <div className="uni-eyebrow uni-eyebrow-wide">Compra no atacado</div>
          <h1 className="uni-h1">
            Termos de <em>compra.</em>
          </h1>
          <p className="uni-legal-lede">
            Como funciona comprar no atacado pelo nosso site, do pedido até as peças chegarem na sua loja.
          </p>
          <p className="uni-legal-date">Atualizados em {ATUALIZADO_EM}</p>
        </div>

        <div className="uni-legal-body">
          <section>
            <h2>1. Quem vende</h2>
            <p>
              <strong>{STORE.razaoSocial}</strong> (Uni Bolsas), CNPJ {STORE.cnpj}, Inscrição Estadual {STORE.inscricaoEstadual}, com stand no {STORE.name} ({STORE.unitText}),{' '}
              {STORE.street}, {STORE.district}, {STORE.city}, CEP {STORE.cep}. Atendimento pelo{' '}
              <a href={waGeneral} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
              .
            </p>
          </section>

          <section>
            <h2>2. Venda só no atacado</h2>
            <ul>
              <li>
                O pedido mínimo é de <strong>{PEDIDO_MINIMO} peças</strong>, que podem ser de modelos e cores diferentes.
              </li>
              <li>
                Para comprar pelo site é preciso ter uma conta com seus dados (nome, CPF ou CNPJ, WhatsApp e, se tiver loja, a razão social).
                Esses dados vão no pedido e na nota fiscal.
              </li>
            </ul>
          </section>

          <section>
            <h2>3. Preços e fotos</h2>
            <ul>
              <li>
                Vale o preço que aparece na tela de finalizar compra, conferido na hora de pagar. Se um preço ou uma
                peça mudar enquanto você monta o pedido, a tela avisa antes do pagamento.
              </li>
              <li>
                As fotos são das nossas peças, mas a cor pode variar um pouco de tela para tela e entre lotes de
                fabricação.
              </li>
            </ul>
          </section>

          <section>
            <h2>4. Pagamento</h2>
            <ul>
              <li>
                O pagamento é feito no <strong>Mercado Pago</strong>, com Pix, cartão de crédito ou boleto. Os dados do
                cartão são digitados na tela do Mercado Pago e não passam pelo nosso site.
              </li>
              <li>
                O pedido é confirmado quando o pagamento é aprovado. Pix aprova na hora; boleto compensa em até 2 dias
                úteis. O link de pagamento de cada pedido vale por 3 dias.
              </li>
              <li>Você recebe a confirmação por e-mail e acompanha o pedido em Minha conta.</li>
            </ul>
          </section>

          <section>
            <h2>5. Separação</h2>
            <p>
              Separamos o pedido em até <strong>1 dia útil</strong> depois da aprovação do pagamento. Se, por algum
              motivo, uma peça paga não estiver disponível, avisamos pelo WhatsApp e você escolhe: trocar por outra de
              mesmo valor ou receber o valor dela de volta.
            </p>
          </section>

          <section>
            <h2>6. Retirada ou envio</h2>
            <ul>
              <li>
                <strong>Retirada na loja (grátis):</strong> no {STORE.name}, {STORE.unitText}, {STORE.street},{' '}
                {STORE.district}. Avisamos pelo WhatsApp quando estiver separado. Horário: {STORE.hours.join(' · ')}.
              </li>
              <li>
                <strong>Envio pelo correio ou transportadora:</strong> o frete é calculado pelo CEP na hora de
                fechar o pedido (Correios, Jadlog e outras, pelo Melhor Envio) e pago junto com as peças, com seguro
                pelo valor delas. Os pedidos saem de São Paulo/SP; o prazo mostrado já conta o dia de separação.
                Mandamos o código de rastreio. Se nenhuma transportadora atender o seu CEP, a retirada na loja continua
                disponível.
              </li>
              <li>
                Confira o endereço de entrega antes de pagar. Se o pacote voltar por endereço errado ou ausência, o
                novo envio é combinado e cobrado à parte.
              </li>
            </ul>
          </section>

          <section>
            <h2>7. Nota fiscal</h2>
            <p>A nota fiscal sai com os dados cadastrados na sua conta. Confira nome, CPF ou CNPJ e endereço antes de pagar.</p>
          </section>

          <section>
            <h2>8. Trocas, cancelamento e privacidade</h2>
            <p>
              Peça com defeito, desistência e cancelamento antes do envio seguem a nossa{' '}
              <Link href="/trocas">Política de trocas e devoluções</Link>. O que fazemos com os seus dados está na{' '}
              <Link href="/privacidade">Política de Privacidade</Link>.
            </p>
          </section>

          <section>
            <h2>9. Foro</h2>
            <p>
              Preferimos sempre resolver direto com você pelo WhatsApp. Se não for possível, fica eleito o foro da
              comarca de São Paulo/SP, ressalvado o direito do consumidor de escolher o foro do seu domicílio.
            </p>
          </section>
        </div>

        <p className="uni-legal-back">
          <Link href="/">← Voltar pro catálogo</Link>
        </p>
      </div>
    </div>
  );
}
