'use client';

import { useEffect, useState } from 'react';
import { Reveal } from '@/components/public/primitives/Reveal';
import { ArrowIcon } from '@/components/public/icons';
import { MANIFESTO_PHOTOS } from './ManifestoIllustrations';
import { TIMELINE } from '@/lib/content/timeline';
import { TOKENS } from '@/lib/tokens';
import { waGeneral } from '@/lib/whatsapp';

export function Manifesto() {
  const [pIdx, setPIdx] = useState(0);

  useEffect(() => {
    if (MANIFESTO_PHOTOS.length < 2) return;
    const t = setInterval(
      () => setPIdx((i) => (i + 1) % MANIFESTO_PHOTOS.length),
      6000,
    );
    return () => clearInterval(t);
  }, []);

  return (
    <section className="uni-manifesto" id="manifesto">
      <div className="uni-manifesto-grain" />
      <div className="uni-manifesto-layout">
        <div className="uni-manifesto-photo-col">
          <div className="uni-manifesto-photo-wrap">
            {MANIFESTO_PHOTOS.map((Photo, i) => (
              <Photo
                key={i}
                className={
                  'uni-manifesto-photo ' +
                  (i === pIdx ? 'is-active' : 'is-inactive')
                }
              />
            ))}
            <div className="uni-manifesto-badge">
              <span className="uni-manifesto-badge-num">+10 anos</span>
              <span className="uni-manifesto-badge-sub">Brás · São Paulo</span>
            </div>
          </div>
        </div>
        <div className="uni-manifesto-text-col">
          <Reveal>
            <div
              className="uni-eyebrow uni-eyebrow-wide uni-eyebrow-light"
              style={{ color: TOKENS.caramel }}
            >
              O manifesto
            </div>
            <div className="uni-manifesto-quote-mark" aria-hidden="true">
              “
            </div>
            <blockquote className="uni-manifesto-quote">
              A gente acredita em <em>bolsa que dura</em> e em atendimento que
              olha no olho — mesmo quando o olho é uma tela.
            </blockquote>
            <p className="uni-manifesto-body">
              Começamos em 2014 com um stand pequeno, atendendo uma a uma. Hoje
              somos uma família que escolhe cada fornecedor pessoalmente, testa
              cada modelo no dia a dia, e segue respondendo lojistas e clientes
              finais pelo mesmo WhatsApp.
            </p>
            <p className="uni-manifesto-body">
              O Brás é nossa origem e nossa escola: aqui se aprende a vender
              bem porque se aprende a comprar bem. Nossa curadoria é de quem
              está dentro do mercado há tempo suficiente pra reconhecer um bom
              couro pelo cheiro e um bom fornecedor pela palavra.
            </p>
          </Reveal>
          <div className="uni-manifesto-rule" />
          <Reveal>
            <div
              className="uni-manifesto-timeline"
              aria-label="Linha do tempo Uni Bolsas"
            >
              {TIMELINE.map((t) => (
                <div key={t.year} className="uni-tl-cell">
                  <div className="uni-tl-year">{t.year}</div>
                  <div className="uni-tl-label">{t.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
          <a
            className="uni-manifesto-cta"
            href={waGeneral}
            target="_blank"
            rel="noopener noreferrer"
          >
            Conheça a equipe <ArrowIcon size={14} />
          </a>
        </div>
      </div>
    </section>
  );
}
