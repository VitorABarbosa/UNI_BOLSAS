import { Reveal } from '@/components/public/primitives/Reveal';
import { WhatsAppButton } from '@/components/public/primitives/WhatsAppButton';
import { SingleBagIcon, StackBagsIcon } from '@/components/public/icons';
import { TOKENS } from '@/lib/tokens';
import { waRetail, waWholesale } from '@/lib/whatsapp';

export function WholesaleVsRetail() {
  return (
    <section className="uni-wsr uni-section" id="atacado">
      <div className="uni-container">
        <Reveal>
          <div className="uni-section-head">
            <div className="uni-eyebrow uni-eyebrow-wide">
              Pra cada perfil · um caminho
            </div>
            <h2 className="uni-h2">
              Atacado e <em>varejo</em>, sem mistura.
            </h2>
            <p className="uni-section-lede">
              Atendimento direto pelo WhatsApp em duas portas separadas — pra
              que ninguém espere por uma fila que não é a sua.
            </p>
          </div>
        </Reveal>
        <div className="uni-wsr-grid">
          <Reveal>
            <article className="uni-wsr-card is-wholesale">
              <div className="uni-wsr-card-icon">
                <StackBagsIcon size={56} color={TOKENS.leatherDark} />
              </div>
              <div className="uni-wsr-card-eyebrow">Pra sua loja</div>
              <h3 className="uni-wsr-card-h">
                Atacado <em>direto da fonte</em>
              </h3>
              <ul className="uni-wsr-card-bullets">
                <li>
                  Pedido mínimo a partir de <strong>6 peças</strong> por
                  referência
                </li>
                <li>
                  Tabela de preço enviada por WhatsApp · cadastro em 24h
                </li>
                <li>
                  Pagamento em <strong>boleto, pix, cartão</strong> · prazo
                  combinado por porte
                </li>
                <li>Frete por transportadora ou retirada no Brás</li>
                <li>PDF do mix sazonal pra repor estoque sem dor</li>
              </ul>
              <WhatsAppButton href={waWholesale} variant="dark" full>
                Receber tabela de atacado
              </WhatsAppButton>
            </article>
          </Reveal>
          <Reveal delay={120}>
            <article className="uni-wsr-card">
              <div className="uni-wsr-card-icon">
                <SingleBagIcon size={56} color={TOKENS.leatherDark} />
              </div>
              <div className="uni-wsr-card-eyebrow">Pra você</div>
              <h3 className="uni-wsr-card-h">
                Varejo <em>com calma</em>
              </h3>
              <ul className="uni-wsr-card-bullets">
                <li>
                  Atendimento <strong>1-pra-1</strong> com fotos extras pelo
                  WhatsApp
                </li>
                <li>Retirada presencial no Shopping 900 · Brás</li>
                <li>
                  Pix, cartão em até <strong>6x sem juros</strong>, débito e
                  dinheiro
                </li>
                <li>
                  Cupom <strong>UNI5</strong> · 5% OFF na primeira compra
                </li>
                <li>Troca em até 7 dias após o recebimento</li>
              </ul>
              <WhatsAppButton href={waRetail} full>
                Quero comprar uma bolsa
              </WhatsAppButton>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
