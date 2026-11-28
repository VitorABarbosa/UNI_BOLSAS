'use client';

import { useEffect, useRef } from 'react';

export type Passo = { titulo: string; texto: string; icone: 'sacola' | 'checkout' | 'caminhao' | 'whats' };

function Icone({ nome }: { nome: Passo['icone'] }) {
  const p = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  if (nome === 'sacola')
    return (
      <svg {...p}>
        <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z" />
        <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
        <path d="M9.5 12.5a2.6 2.6 0 0 0 5 0" />
      </svg>
    );
  if (nome === 'checkout')
    return (
      <svg {...p}>
        <rect x="3" y="5.5" width="18" height="13" rx="2.2" />
        <path d="M3 9.5h18M7 14.5h4" />
      </svg>
    );
  if (nome === 'whats')
    return (
      <svg {...p}>
        <path d="M4 20l1.3-3.9A8 8 0 1 1 8 18.7L4 20Z" />
        <path d="M9 9.5c.3 2.2 2.3 4.2 4.5 4.5l1-1.3 2 .8-.4 1.6c-3.5.4-7.7-3.8-7.3-7.3L10.4 7l.8 2-1.2 1" />
      </svg>
    );
  return (
    <svg {...p}>
      <path d="M2.5 6.5h11v9h-11z" />
      <path d="M13.5 9.5h4l3 3v3h-7" />
      <circle cx="6.5" cy="17.5" r="1.8" />
      <circle cx="16.5" cy="17.5" r="1.8" />
    </svg>
  );
}

/**
 * Os três passos como uma linha do tempo que se preenche com a rolagem:
 * cada passo "acende" quando a linha chega nele. Horizontal no computador,
 * vertical no celular. Com "reduzir movimento", tudo já aparece aceso.
 */
export function ComoComprarPassos({ passos }: { passos: Passo[] }) {
  const ref = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const itens = Array.from(el.querySelectorAll<HTMLElement>('.uni-passo'));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.setProperty('--p', '1');
      itens.forEach((i) => i.classList.add('is-on'));
      return;
    }
    let raf = 0;
    const ler = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 quando o topo da lista chega a 80% da tela; 1 quando o fim passa de 55%.
      const p = Math.min(1, Math.max(0, (vh * 0.8 - r.top) / (r.height + vh * 0.25)));
      el.style.setProperty('--p', p.toFixed(3));
      itens.forEach((it, i) => it.classList.toggle('is-on', p >= (i / passos.length) * 0.92 + 0.04));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(ler);
    };
    ler();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [passos.length]);

  return (
    <ol className="uni-passos" ref={ref}>
      <span className="uni-passos-trilho" aria-hidden="true">
        <span className="uni-passos-fill" />
      </span>
      {passos.map((p, i) => (
        <li key={p.titulo} className="uni-passo">
          <span className="uni-passo-no" aria-hidden="true">
            <Icone nome={p.icone} />
          </span>
          <span className="uni-passo-n">{String(i + 1).padStart(2, '0')}</span>
          <h3 className="uni-passo-h">{p.titulo}</h3>
          <p className="uni-passo-p">{p.texto}</p>
        </li>
      ))}
    </ol>
  );
}
