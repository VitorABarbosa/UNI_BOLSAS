'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Reveal } from '@/components/public/primitives/Reveal';
import { ProductCard } from '@/components/public/home/Catalog/ProductCard';
import type { ProductWithRelations } from '@/lib/queries/products';

/**
 * Vitrine das peças escolhidas a dedo no painel ("as que mais vendem").
 *
 * Reusa o card do catálogo de propósito: o cliente reconhece o mesmo objeto,
 * com as mesmas cores, o mesmo preço e o mesmo botão. O que muda é a moldura —
 * um trilho horizontal, não uma grade, porque a seção é uma seleção curta e
 * deve parecer uma vitrine, não um segundo catálogo.
 *
 * Não renderiza nada quando não há destaques: quem não escolheu nenhuma peça
 * no painel simplesmente não ganha uma seção vazia no meio da home.
 *
 * No desktop o trilho ganha setas: mouse não rola de lado, e a barra de
 * rolagem está escondida — sem elas, os cards fora da tela eram inalcançáveis
 * pra quem navega sem trackpad. No celular as setas somem: o dedo já arrasta.
 */
export function Featured({
  products,
  onOpenQuickView,
}: {
  products: ProductWithRelations[];
  onOpenQuickView: (product: ProductWithRelations, colorIdx: number) => void;
}) {
  const [selectedColors, setSelectedColors] = useState<Record<string, number>>(
    {},
  );
  const [previewColors, setPreviewColors] = useState<
    Record<string, number | null>
  >({});
  const railRef = useRef<HTMLDivElement>(null);
  const [nav, setNav] = useState({ prev: false, next: false });

  // As setas refletem a posição real: somem na ponta em que não há mais nada.
  const syncNav = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    setNav({
      prev: el.scrollLeft > 8,
      next: el.scrollLeft + el.clientWidth < el.scrollWidth - 8,
    });
  }, []);

  useEffect(() => {
    syncNav();
    window.addEventListener('resize', syncNav);
    return () => window.removeEventListener('resize', syncNav);
  }, [syncNav, products.length]);

  const slide = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  if (products.length === 0) return null;

  return (
    <section className="uni-featured uni-section" id="destaques">
      <div className="uni-container">
        <Reveal>
          <div className="uni-section-head">
            <div className="uni-eyebrow uni-eyebrow-wide">
              As mais pedidas
            </div>
            <h2 className="uni-h2">
              Destaques <em>da casa.</em>
            </h2>
            <p className="uni-section-lede">
              As peças que mais saem do nosso stand no Brás — escolhidas a
              dedo, não por algoritmo.
            </p>
          </div>
        </Reveal>
        <div className="uni-featured-frame">
          {nav.prev && (
            <button
              type="button"
              className="uni-featured-arrow is-prev"
              onClick={() => slide(-1)}
              aria-label="Peças anteriores"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
          )}
          {nav.next && (
            <button
              type="button"
              className="uni-featured-arrow is-next"
              onClick={() => slide(1)}
              aria-label="Próximas peças"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          )}
          <div className="uni-featured-rail" ref={railRef} onScroll={syncNav}>
          {products.map((p, i) => (
            <Reveal key={p.id} delay={i * 80}>
              <ProductCard
                product={p}
                selectedColorIdx={selectedColors[p.id] ?? 0}
                previewColorIdx={previewColors[p.id] ?? null}
                onSelectColor={(id, idx) =>
                  setSelectedColors((s) => ({ ...s, [id]: idx }))
                }
                onPreviewColor={(id, idx) =>
                  setPreviewColors((s) => ({ ...s, [id]: idx }))
                }
                onOpenQuickView={onOpenQuickView}
                // A animação de entrada/saída é do filtro do catálogo; aqui a
                // lista é fixa, então nunca há peça entrando nem saindo.
                isLeaving={false}
                isEntering={false}
              />
            </Reveal>
          ))}
          </div>
        </div>
      </div>
    </section>
  );
}
