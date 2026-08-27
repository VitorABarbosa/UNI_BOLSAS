'use client';

import { Fragment, type ReactNode } from 'react';
import { ArrowIcon } from '@/components/public/icons';
import { WhatsAppButton } from '@/components/public/primitives/WhatsAppButton';
import { HeroCarousel } from '@/components/public/home/HeroCarousel';
import { TOKENS } from '@/lib/tokens';
import { waGeneral } from '@/lib/whatsapp';

/**
 * O título é montado em linhas explícitas, não deixado quebrar sozinho: a
 * quebra natural dava três linhas desalinhadas e mudava conforme a largura.
 * Cada linha é uma máscara e as palavras sobem de dentro dela.
 */
const LINES: ReadonlyArray<ReadonlyArray<string | ReactNode>> = [
  ['Bolsas', 'que', 'carregam'],
  ['estilo', <em key="e">e história.</em>],
];

/** Atraso entre uma palavra e a seguinte, em segundos. */
const WORD_STEP = 0.09;

export function Hero({
  videoPosters,
}: {
  /** Poster (frame do vídeo) por `key` de slide — ver HeroCarousel. */
  videoPosters?: Record<string, string>;
}) {
  return (
    <section className="uni-hero" id="hero">
      <div className="uni-hero-bg" />
      <div className="uni-container">
        <div className="uni-hero-inner">
          <div className="uni-hero-image-frame">
            <HeroCarousel videoPosters={videoPosters} />
          </div>
          <span className="uni-eyebrow uni-eyebrow-wide uni-hero-eyebrow">
            Coleção · 2026 · Brás · SP
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
                          animationDelay: `${0.35 + (before + wi) * WORD_STEP}s`,
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
          <div className="uni-hero-divider" />
          <p className="uni-hero-lede">
            Catálogo curado de bolsas, mochilas e malas para o dia a dia,
            atendendo{' '}
            <strong style={{ fontWeight: 500, color: TOKENS.ink }}>
              atacado
            </strong>{' '}
            e{' '}
            <strong style={{ fontWeight: 500, color: TOKENS.ink }}>
              varejo
            </strong>{' '}
            direto do nosso stand no Shopping 900, no coração do Brás.
          </p>
          <div className="uni-hero-ctas">
            <WhatsAppButton href={waGeneral} variant="default">
              Falar com a gente
            </WhatsAppButton>
            <a className="uni-secondary-btn" href="#catalogo">
              Ver catálogo <ArrowIcon size={14} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
