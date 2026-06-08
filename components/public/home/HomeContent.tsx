'use client';

import { useState } from 'react';
import { Catalog } from '@/components/public/home/Catalog';
import type { CategoryOption } from '@/components/public/home/Catalog/CategoryFilter';
import { QuickView } from '@/components/public/quickview/QuickView';
import type { ProductWithRelations } from '@/lib/queries/products';
type HomeContentProps = {
  products: ProductWithRelations[];
  categories: CategoryOption[];
};

type QuickViewState = {
  product: ProductWithRelations;
  colorIdx: number;
} | null;

export function HomeContent({
  products,
  categories,
}: HomeContentProps) {
  const [quickView, setQuickView] = useState<QuickViewState>(null);

  return (
    <>
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
