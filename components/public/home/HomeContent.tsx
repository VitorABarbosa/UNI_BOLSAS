'use client';

import { useState } from 'react';
import { Catalog } from '@/components/public/home/Catalog';
import type { CategoryOption } from '@/components/public/home/Catalog/CategoryFilter';
import { QuickView } from '@/components/public/quickview/QuickView';
import type { ProductWithRelations } from '@/lib/queries/products';
import type { PaletteColor } from '@/lib/content/color-palette';

type HomeContentProps = {
  products: ProductWithRelations[];
  categories: CategoryOption[];
  colorPalette: ReadonlyArray<PaletteColor>;
};

type QuickViewState = {
  product: ProductWithRelations;
  colorIdx: number;
} | null;

export function HomeContent({
  products,
  categories,
  colorPalette,
}: HomeContentProps) {
  const [quickView, setQuickView] = useState<QuickViewState>(null);

  return (
    <>
      <Catalog
        products={products}
        categories={categories}
        colorPalette={colorPalette}
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
