'use client';

import { Fragment, type ReactNode } from 'react';
import { ArrowIcon } from '@/components/public/icons';
import { WhatsAppButton } from '@/components/public/primitives/WhatsAppButton';
import { HeroCarousel } from '@/components/public/home/HeroCarousel';
import { PEDIDO_MINIMO, PEDIDO_MINIMO_FRASE } from '@/lib/content/atacado';
import { waGeneral, waWholesale } from '@/lib/whatsapp';
import { COMPRA_NO_SITE } from '@/lib/contas/ligado';

/**
 * O título é montado em linhas explícitas, não deixado quebrar sozinho: a
 * quebra natural mudava conforme a largura. Cada linha é uma máscara e as
 * palavras sobem de dentro dela.
 */
const LINES: ReadonlyArray<ReadonlyArray<string | ReactNode>> = [
  ['Bolsas', 'no', 'atacado,'],
  [<em key="e">direto do Brás.</em>],
];

/** Atraso entre uma palavra e a seguinte, em segundos. */
const WORD_STEP = 0.07;

/**
 * No desktop o texto vem ANTES do filme: título à esquerda, regra de venda e
 * botões à direita, e a imagem logo abaixo. Antes a primeira tela era só o
 * carrossel — pra saber o que a loja vende e como comprar era preciso rolar.
 * No celular a ordem se inverte (CSS): o filme é baixo e abre a página.
 */
export function Hero() {
  return (
    <section className="uni-hero" id="hero">
      <div className="uni-hero-bg" />
      <div className="uni-container">
        <div className="uni-hero-inner">
          <div className="uni-hero-title">
            <span className="uni-eyebrow uni-hero-eyebrow">
              Shopping 900 · Brás · São Paulo
            </span>
            <h1 className="uni-h1 uni-hero-h1">
              {LINES.map((line, li) => {
                // Posição da palavra no título inteiro, pra escada de atrasos
                // continuar de uma linha pra outra.
                const before = LINES.slice(0, li).reduce(
                  (total, l) => total + l.length,
                  0,
                );
                return (
                  <span className="uni-hero-line" key={li}>
                    {line.map((word, wi) => (
                      <Fragment key={wi}>
                        <span
                          className="uni-word"
                          style={{
                            animationDelay: `${0.15 + (before + wi) * WORD_STEP}s`,
                          }}
                        >
                          {word}
                        </span>
                        {wi < line.length - 1 ? ' ' : ''}
                      </Fragment>
                    ))}
                  </span>
                );
              })}
            </h1>
          </div>
          <div className="uni-hero-aside">
            {COMPRA_NO_SITE ? (
              <>
                <p className="uni-hero-lede">
                  Compre bolsas, mochilas e malas <strong>no atacado, direto pelo site</strong>,{' '}
                  {PEDIDO_MINIMO_FRASE}. Pague com Pix, cartão ou boleto e receba em todo o
                  Brasil, com nota fiscal.
                </p>
                <div className="uni-hero-ctas">
                  <a className="uni-hero-buy" href="#catalogo">
                    Comprar agora <ArrowIcon size={14} />
                  </a>
                  <WhatsAppButton href={waGeneral} variant="outline">
                    Tirar dúvidas
                  </WhatsAppButton>
                </div>
                <ul className="uni-hero-facts">
                  <li>
                    <strong>{PEDIDO_MINIMO} peças</strong>
                    pedido mínimo
                  </li>
                  <li>
                    <strong>Pix · cartão · boleto</strong>
                    pagamento seguro
                  </li>
                  <li>
                    <strong>Todo o Brasil</strong>
                    envio com rastreio
                  </li>
                </ul>
              </>
            ) : (
              <>
                <p className="uni-hero-lede">
                  Bolsas, mochilas e malas vendidas <strong>só no atacado</strong>,{' '}
                  {PEDIDO_MINIMO_FRASE} por pedido. Escolha no catálogo e feche
                  direto pelo WhatsApp.
                </p>
                <div className="uni-hero-ctas">
                  <WhatsAppButton href={waWholesale} variant="default">
                    Pedir no atacado
                  </WhatsAppButton>
                  <a className="uni-secondary-btn" href="#catalogo">
                    Ver catálogo <ArrowIcon size={14} />
                  </a>
                </div>
                <ul className="uni-hero-facts">
                  <li>
                    <strong>{PEDIDO_MINIMO} peças</strong>
                    pedido mínimo
                  </li>
                  <li>
                    <strong>Todo o Brasil</strong>
                    por transportadora
                  </li>
                  <li>
                    <strong>+25 anos</strong>
                    no Brás
                  </li>
                </ul>
              </>
            )}
          </div>
          <div className="uni-hero-image-frame">
            <HeroCarousel />
          </div>
        </div>
      </div>
    </section>
  );
}
