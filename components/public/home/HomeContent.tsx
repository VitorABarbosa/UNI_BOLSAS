'use client';

import { useState } from 'react';
import { Catalog } from '@/components/public/home/Catalog';
import { Featured } from '@/components/public/home/Featured';
import type { CategoryOption } from '@/components/public/home/Catalog/CategoryFilter';
import { QuickView } from '@/components/public/quickview/QuickView';
import type { ProductWithRelations } from '@/lib/queries/products';
type HomeContentProps = {
  products: ProductWithRelations[];
  featured: ProductWithRelations[];
  categories: CategoryOption[];
};

type QuickViewState = {
  product: ProductWithRelations;
  colorIdx: number;
} | null;

export function HomeContent({
  products,
  featured,
  categories,
}: HomeContentProps) {
  const [quickView, setQuickView] = useState<QuickViewState>(null);

  return (
    <>
      {/* Antes do catálogo: é a seleção da casa, e quem chega do hero deve
          bater o olho nela antes de encarar a grade inteira. */}
      <Featured
        products={featured}
        onOpenQuickView={(product, colorIdx) =>
          setQuickView({ product, colorIdx })
        }
      />
      <Catalog
        products={products}
        categories={categories}
        onOpenQuickView={(product, colorIdx) =>
          setQuickView({ product, colorIdx })
        }
      />
      {quickView && (
        <QuickView
          product={quickView.product}
          initialColorIdx={quickView.colorIdx}
          onClose={() => setQuickView(null)}
        />
      )}
    </>
  );
}
