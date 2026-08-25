'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Reveal } from '@/components/public/primitives/Reveal';
import { CategoryFilter, type CategoryOption } from './CategoryFilter';
import { ProductGrid } from './ProductGrid';
import type { ProductWithRelations } from '@/lib/queries/products';

/** Quantos produtos entram por lote no grid. */
const PAGE_SIZE = 12;

type CatalogProps = {
  products: ProductWithRelations[];
  categories: CategoryOption[];
  onOpenQuickView: (product: ProductWithRelations, colorIdx: number) => void;
};

export function Catalog({
  products,
  categories,
  onOpenQuickView,
}: CatalogProps) {
  const [activeCat, setActiveCat] = useState('todos');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedColors, setSelectedColors] = useState<Record<string, number>>(
    () => Object.fromEntries(products.map((p) => [p.id, 0])),
  );
  const [previewColors, setPreviewColors] = useState<
    Record<string, number | null>
  >({});
  const [renderedIds, setRenderedIds] = useState<string[]>(() =>
    products.map((p) => p.id),
  );
  const [leavingIds, setLeavingIds] = useState<string[]>([]);
  const [enteringIds, setEnteringIds] = useState<string[]>([]);
  const filterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevFilteredRef = useRef<string[]>(products.map((p) => p.id));

  const filtered = useMemo(() => {
    return products.filter((p) => {
      return activeCat === 'todos' || p.category?.slug === activeCat;
    });
  }, [products, activeCat]);

  useEffect(() => {
    const prev = prevFilteredRef.current;
    const curr = filtered.map((p) => p.id);
    const leaving = prev.filter((id) => !curr.includes(id));
    const entering = curr.filter((id) => !prev.includes(id));
    if (leaving.length === 0 && entering.length === 0) {
      prevFilteredRef.current = curr;
      return;
    }
    setLeavingIds(leaving);
    if (filterTimerRef.current) clearTimeout(filterTimerRef.current);
    filterTimerRef.current = setTimeout(() => {
      setRenderedIds(curr);
      setLeavingIds([]);
      setEnteringIds(entering);
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
      enterTimerRef.current = setTimeout(() => setEnteringIds([]), 700);
      prevFilteredRef.current = curr;
    }, 220);
    return () => {
      if (filterTimerRef.current) clearTimeout(filterTimerRef.current);
    };
  }, [filtered]);

  // Volta pro topo da paginação sempre que o filtro muda.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeCat]);

  const displayedIds = leavingIds.length
    ? prevFilteredRef.current
    : renderedIds;
  const displayedAll = displayedIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is ProductWithRelations => p != null);
  // Renderiza em lotes: com o catálogo inteiro na tela, um celular baixava uma
  // imagem por produto de uma vez só.
  const displayed = displayedAll.slice(0, visibleCount);
  const remaining = displayedAll.length - displayed.length;

  const onSelectColor = (id: string, idx: number) =>
    setSelectedColors((s) => ({ ...s, [id]: idx }));
  const onPreviewColor = (id: string, idx: number | null) =>
    setPreviewColors((s) => ({ ...s, [id]: idx }));

  const counts = useMemo(() => {
    const m: Record<string, number> = { todos: products.length };
    categories.forEach((c) => {
      if (c.id !== 'todos')
        m[c.id] = products.filter((p) => p.category?.slug === c.id).length;
    });
    return m;
  }, [products, categories]);

  const onClearFilters = () => {
    setActiveCat('todos');
  };

  return (
    <section className="uni-catalog uni-section" id="catalogo">
      <div className="uni-container">
        <Reveal>
          <div className="uni-section-head">
            <div className="uni-eyebrow uni-eyebrow-wide">O catálogo</div>
            <h2 className="uni-h2">
              Bolsas <em>em foco.</em>
            </h2>
            <p className="uni-section-lede">
              Filtre por categoria, abra cada peça pra ver dimensões,
              material e galeria, e peça direto pelo WhatsApp.
            </p>
          </div>
        </Reveal>
        {/* O wrapper (e não o filtro) é sticky: dentro de um Reveal o filtro
            não teria espaço pra grudar, porque sticky só desliza dentro do
            pai direto — e o pai seria o próprio Reveal, do tamanho dele. */}
        <div className="uni-cat-sticky">
          <Reveal>
            <CategoryFilter
              categories={categories}
              activeCat={activeCat}
              counts={counts}
              onChange={setActiveCat}
            />
          </Reveal>
        </div>
        <ProductGrid
          displayed={displayed}
          selectedColors={selectedColors}
          previewColors={previewColors}
          leavingIds={leavingIds}
          enteringIds={enteringIds}
          onSelectColor={onSelectColor}
          onPreviewColor={onPreviewColor}
          onOpenQuickView={onOpenQuickView}
          onClearFilters={onClearFilters}
        />
        {remaining > 0 && (
          <div className="uni-load-more-wrap">
            <button
              type="button"
              className="uni-load-more"
              onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
            >
              Carregar mais
              <span className="uni-load-more-count">
                {remaining} {remaining === 1 ? 'peça' : 'peças'}
              </span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
