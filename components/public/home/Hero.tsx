'use client';

import { Fragment, type ReactNode } from 'react';
import { ArrowIcon } from '@/components/public/icons';
import { WhatsAppButton } from '@/components/public/primitives/WhatsAppButton';
import { HeroIllustration } from '@/components/public/home/HeroIllustration';
import { TOKENS } from '@/lib/tokens';
import { waGeneral } from '@/lib/whatsapp';

const words: ReadonlyArray<string | ReactNode> = [
  'Bolsas',
  'que',
  'carregam',
  'estilo',
  <em key="e">e história.</em>,
];

export function Hero() {
  return (
    <section className="uni-hero" id="hero">
      <div className="uni-hero-bg" />
      <div className="uni-container">
        <div className="uni-hero-grid">
          <div className="uni-hero-text-col">
            <div className="uni-hero-eyebrow-wrap">
              <span className="uni-hero-eyebrow-line" />
              <span
                className="uni-eyebrow uni-eyebrow-wide"
                style={{ margin: 0 }}
              >
                Coleção · 2026 · Brás · SP
              </span>
            </div>
            <div className="uni-hero-h1-wrap">
              <h1 className="uni-h1 uni-hero-h1">
                {words.map((w, i) => (
                  <Fragment key={i}>
                    <span
                      className="uni-word"
                      style={{ animationDelay: `${0.4 + i * 0.13}s` }}
                    >
                      {w}
                    </span>
                    {i < words.length - 1 ? ' ' : ''}
                  </Fragment>
                ))}
              </h1>
            </div>
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
          <div className="uni-hero-img-col">
            <div className="uni-hero-img-wrap">
              <HeroIllustration />
            </div>
            <div className="uni-hero-badge-1">Coleção · 2026</div>
            <div className="uni-hero-badge-2">Atacado e Varejo</div>
          </div>
        </div>
      </div>
    </section>
  );
}
