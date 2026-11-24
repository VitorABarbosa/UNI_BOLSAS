import type { Metadata } from 'next';
import Link from 'next/link';
import { STORE } from '@/lib/content/store';
import { waLink } from '@/lib/whatsapp';

export const metadata: Metadata = {
  title: 'Trocas e devoluções · Uni Bolsas',
  description: 'Como funciona a troca de peça com defeito nas compras de atacado da Uni Bolsas.',
  alternates: { canonical: '/trocas' },
};

/** Atualize junto com qualquer mudança na regra de trocas. */
const ATUALIZADO_EM = '24 de novembro de 2026';
const PRAZO_DIAS = 7;
const CONTATO = waLink('Olá! Quero falar sobre a troca de uma peça do meu pedido.');

export default function TrocasPage() {
  return (
    <div className="uni-legal uni-section">
      <div className="uni-container">
        <div className="uni-legal-head">
          <div className="uni-eyebrow uni-eyebrow-wide">Pós-venda</div>
          <h1 className="uni-h1">
            Trocas e <em>devoluções.</em>
          </h1>
          <p className="uni-legal-lede">
            Vendemos no atacado, para lojistas. Por isso a troca é para peça com defeito de fabricação: se alguma
            chegar com problema, a gente resolve.
          </p>
          <p className="uni-legal-date">Atualizada em {ATUALIZADO_EM}</p>
        </div>

        <div className="uni-legal-body">
          <section>
            <h2>1. Peça com defeito</h2>
            <p>
              Se uma peça tiver <strong>defeito de fabricação</strong> (costura aberta, zíper ou fecho que não funciona,
              alça solta, material danificado), avise em até <strong>{PRAZO_DIAS} dias corridos</strong> depois de
              receber ou retirar o pedido.
            </p>
            <p>Como avisar:</p>
            <ul>
              <li>
                chame a gente{' '}
                <a href={CONTATO} target="_blank" rel="noopener noreferrer">
                  no WhatsApp
                </a>
                ;
              </li>
              <li>mande o número do pedido (começa com “UB-”, está no e-mail de confirmação e em Minha conta);</li>
              <li>mande fotos ou um vídeo curto mostrando o defeito.</li>
            </ul>
            <p>
              Confirmado o defeito, você escolhe: <strong>trocamos pela mesma peça</strong>, por{' '}
              <strong>outra de mesmo valor</strong>, ou <strong>devolvemos o valor da peça</strong> (no mesmo meio de
              pagamento, pelo Mercado Pago). Peça com defeito confirmado tem o frete da troca por nossa conta.
            </p>
          </section>

          <section>
            <h2>2. O que não é defeito</h2>
            <ul>
              <li>desgaste natural do uso, ou dano por uso inadequado, queda, umidade ou calor;</li>
              <li>
                pequenas diferenças de tom entre a foto e a peça (a cor muda de tela para tela) ou entre lotes de
                fabricação;
              </li>
              <li>peça que foi alterada, lavada ou personalizada depois de entregue.</li>
            </ul>
          </section>

          <section>
            <h2>3. Desistência</h2>
            <p>
              Compras de atacado feitas por empresa (CNPJ) para revenda não são uma relação de consumo, então não há
              troca ou devolução por desistência. Confira as peças, cores e quantidades antes de pagar.
            </p>
            <p>
              Se você comprou como <strong>consumidor final</strong>, para uso próprio, o Código de Defesa do
              Consumidor (art. 49) garante desistir em até 7 dias do recebimento em compras feitas fora da loja. É só
              falar com a gente nesse prazo, com a peça sem uso e na embalagem.
            </p>
          </section>

          <section>
            <h2>4. Cancelar antes de receber</h2>
            <p>
              Pagou e mudou de ideia antes de a gente separar ou enviar o pedido? Fale com a gente{' '}
              <a href={CONTATO} target="_blank" rel="noopener noreferrer">
                pelo WhatsApp
              </a>{' '}
              o quanto antes. Se o pedido ainda não saiu, cancelamos e o valor volta inteiro pelo Mercado Pago. O prazo
              para o dinheiro aparecer depende do meio de pagamento (no cartão, pode levar até 2 faturas).
            </p>
          </section>

          <section>
            <h2>5. Quem vende</h2>
            <p>
              {STORE.razaoSocial} · CNPJ {STORE.cnpj} · {STORE.name}, {STORE.unitText} · {STORE.street},{' '}
              {STORE.district}, {STORE.city}, CEP {STORE.cep}.
            </p>
            <p>
              Veja também os <Link href="/termos">Termos de compra</Link> e a{' '}
              <Link href="/privacidade">Política de Privacidade</Link>.
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
