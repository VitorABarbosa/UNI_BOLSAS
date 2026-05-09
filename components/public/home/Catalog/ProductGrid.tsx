'use client';

import { ProductCard } from './ProductCard';
import type { ProductWithRelations } from '@/lib/queries/products';
import { TOKENS } from '@/lib/tokens';

type ProductGridProps = {
  displayed: ProductWithRelations[];
  selectedColors: Record<string, number>;
  previewColors: Record<string, number | null>;
  leavingIds: string[];
  enteringIds: string[];
  onSelectColor: (productId: string, idx: number) => void;
  onPreviewColor: (productId: string, idx: number | null) => void;
  onOpenQuickView: (product: ProductWithRelations, colorIdx: number) => void;
  onClearFilters: () => void;
};

export function ProductGrid({
  displayed,
  selectedColors,
  previewColors,
  leavingIds,
  enteringIds,
  onSelectColor,
  onPreviewColor,
  onOpenQuickView,
  onClearFilters,
}: ProductGridProps) {
  return (
    <div className="uni-product-grid">
      {displayed.length === 0 ? (
        <div className="uni-product-grid-empty">
          Nenhuma peça nessa combinação.{' '}
          <button
            onClick={onClearFilters}
            style={{
              background: 'transparent',
              border: 'none',
              color: TOKENS.leatherDark,
              fontFamily: 'inherit',
              fontSize: 'inherit',
              cursor: 'pointer',
              fontStyle: 'italic',
              textDecoration: 'underline',
            }}
          >
            Limpar filtros.
          </button>
        </div>
      ) : (
        displayed.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            selectedColorIdx={selectedColors[p.id] ?? 0}
            previewColorIdx={previewColors[p.id] ?? null}
            onSelectColor={onSelectColor}
            onPreviewColor={onPreviewColor}
            onOpenQuickView={onOpenQuickView}
            isLeaving={leavingIds.includes(p.id)}
            isEntering={enteringIds.includes(p.id)}
          />
        ))
      )}
    </div>
  );
}
