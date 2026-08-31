'use client';

import { useState } from 'react';
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
        <div className="uni-featured-rail">
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
    </section>
  );
}
