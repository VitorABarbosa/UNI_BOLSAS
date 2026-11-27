'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { COMPRA_NO_SITE } from '@/lib/contas/ligado';
import { Reveal } from '@/components/public/primitives/Reveal';
import { CategoryFilter, type CategoryOption } from './CategoryFilter';
import { ProductGrid } from './ProductGrid';
import { CatalogFiltros, FAIXAS_PRECO, type Ordem } from './CatalogFiltros';
import { familiasDaCor } from '@/lib/content/cores';
import { productPrice } from '@/lib/product-price';
import type { ProductWithRelations } from '@/lib/queries/products';

/** Sem acento e em minúsculas: "matelasse" acha "Matelassê". */
const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/**
 * Campo de busca do catálogo.
 *
 * Com centenas de peças, categoria sozinha não basta: quem sabe o que quer
 * ("transversal", "croco", "vermelho") não deveria rolar a grade inteira
 * atrás disso. A busca olha nome, descrição curta, categoria e cores.
 */
function CatalogSearch({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className: string;
}) {
  return (
    <label className={'uni-cat-search ' + className}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" /></svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar peça"
        aria-label="Buscar no catálogo"
        enterKeyHint="search"
        autoComplete="off"
      />
      {value && (
        <button
          type="button"
          className="uni-cat-search-clear"
          onClick={() => onChange('')}
          aria-label="Limpar busca"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" /></svg>
        </button>
      )}
    </label>
  );
}

/** Id do filtro de novidades — não é categoria do banco, é por data. */
const NOVIDADES = 'novidades';

/** Quantos produtos entram por lote no grid. */
const PAGE_SIZE = 12;

type CatalogProps = {
  products: ProductWithRelations[];
  categories: CategoryOption[];
  newIds: string[];
  onOpenQuickView: (product: ProductWithRelations, colorIdx: number) => void;
};

export function Catalog({
  products,
  categories,
  newIds,
  onOpenQuickView,
}: CatalogProps) {
  const [activeCat, setActiveCat] = useState('todos');
  const [query, setQuery] = useState('');
  const [cor, setCor] = useState<string | null>(null);
  const [faixa, setFaixa] = useState<string | null>(null);
  const [ordem, setOrdem] = useState<Ordem>('relevancia');
  const gridTopRef = useRef<HTMLDivElement>(null);
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

  // O texto pesquisável de cada peça, montado uma vez — não a cada tecla.
  const haystacks = useMemo(
    () =>
      new Map(
        products.map((p) => [
          p.id,
          normalize(
            [
              p.name,
              p.tagline ?? '',
              p.category?.label ?? '',
              ...p.colors.map((c) => c.name),
            ].join(' '),
          ),
        ]),
      ),
    [products],
  );

  // Preço por peça (com campanha/promoção) e famílias de cor de cada peça.
  const precos = useMemo(() => new Map(products.map((p) => [p.id, productPrice(p).current])), [products]);
  const familias = useMemo(
    () => new Map(products.map((p) => [p.id, new Set(p.colors.flatMap((c) => familiasDaCor(c.name)))])),
    [products],
  );
  const naFaixa = (id: string, f: string | null) => {
    const fx = FAIXAS_PRECO.find((x) => x.id === f);
    if (!fx) return true;
    const v = precos.get(id) ?? 0;
    return v >= fx.min && v < fx.max;
  };

  // Categoria + busca: a base sobre a qual cor e preço contam e filtram.
  const base = useMemo(() => {
    // Todas as palavras precisam aparecer, em qualquer ordem.
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    return products.filter((p) => {
      if (activeCat === NOVIDADES) {
        if (!newIds.includes(p.id)) return false;
      } else if (activeCat !== 'todos' && p.category?.slug !== activeCat) {
        return false;
      }
      const hay = haystacks.get(p.id) ?? '';
      return terms.every((t) => hay.includes(t));
    });
  }, [products, activeCat, query, haystacks, newIds]);

  const filtered = useMemo(() => {
    const lista = base.filter((p) => (!cor || familias.get(p.id)?.has(cor)) && naFaixa(p.id, faixa));
    if (ordem === 'relevancia') return lista;
    const preco = (p: ProductWithRelations) => precos.get(p.id) ?? 0;
    if (ordem === 'menor') return [...lista].sort((a, b) => preco(a) - preco(b));
    if (ordem === 'maior') return [...lista].sort((a, b) => preco(b) - preco(a));
    return [...lista].sort((a, b) => Number(newIds.includes(b.id)) - Number(newIds.includes(a.id)) || Date.parse(b.created_at) - Date.parse(a.created_at));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, cor, faixa, ordem, familias, precos, newIds]);

  // Quantas peças cada cor/faixa traria, respeitando os outros filtros.
  const contagemCor = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of base) if (naFaixa(p.id, faixa)) for (const f of familias.get(p.id) ?? []) m[f] = (m[f] ?? 0) + 1;
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, faixa, familias, precos]);
  const contagemFaixa = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of base) {
      if (cor && !familias.get(p.id)?.has(cor)) continue;
      for (const f of FAIXAS_PRECO) if (naFaixa(p.id, f.id)) m[f.id] = (m[f.id] ?? 0) + 1;
    }
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, cor, familias, precos]);

  /**
   * Quem filtra lá do meio da grade volta pro começo dela. Sem isso a lista
   * encolhia debaixo do dedo e a pessoa ficava olhando pro rodapé, ou pra
   * uma tela vazia, sem saber se o filtro tinha funcionado.
   */
  const backToGridTop = () => {
    requestAnimationFrame(() => {
      const el = gridTopRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      if (top < 0) window.scrollTo({ top: window.scrollY + top });
    });
  };
  const changeCat = (id: string) => {
    setActiveCat(id);
    backToGridTop();
  };
  const changeQuery = (value: string) => {
    setQuery(value);
    backToGridTop();
  };

  useEffect(() => {
    const prev = prevFilteredRef.current;
    const curr = filtered.map((p) => p.id);
    const leaving = prev.filter((id) => !curr.includes(id));
    const entering = curr.filter((id) => !prev.includes(id));
    if (leaving.length === 0 && entering.length === 0) {
      // Mesmas peças em outra ordem (mudou a ordenação): só reordena.
      prevFilteredRef.current = curr;
      setRenderedIds(curr);
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
  }, [activeCat, query, cor, faixa, ordem]);

  // Filtrou por cor: o cartão já mostra a peça nessa cor.
  useEffect(() => {
    if (!cor) return;
    setSelectedColors((s) => {
      const novo = { ...s };
      for (const p of products) {
        const i = p.colors.findIndex((c) => familiasDaCor(c.name).includes(cor));
        if (i >= 0) novo[p.id] = i;
      }
      return novo;
    });
  }, [cor, products]);

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
    const m: Record<string, number> = {
      todos: products.length,
      [NOVIDADES]: newIds.length,
    };
    categories.forEach((c) => {
      if (c.id !== 'todos')
        m[c.id] = products.filter((p) => p.category?.slug === c.id).length;
    });
    return m;
  }, [products, categories, newIds]);

  // "Novidades" entra logo depois de "Todos", e só quando há alguma.
  // Categoria sem peça à venda (ex.: Kits com 0) não aparece.
  const categoriesWithNew = useMemo(() => {
    const comPeca = categories.filter((c, i) => i === 0 || (counts[c.id] ?? 0) > 0);
    return newIds.length > 0
      ? [comPeca[0]!, { id: NOVIDADES, label: 'Novidades' }, ...comPeca.slice(1)]
      : comPeca;
  }, [categories, counts, newIds.length]);

  const limparFiltros = () => {
    setCor(null);
    setFaixa(null);
    setOrdem('relevancia');
    backToGridTop();
  };
  const onClearFilters = () => {
    setActiveCat('todos');
    setQuery('');
    limparFiltros();
  };
  const comFiltroExtra = !!(cor || faixa);

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
              {COMPRA_NO_SITE
                ? 'Busque pelo nome ou filtre por categoria, abra cada peça pra ver medidas e fotos, monte o pedido e finalize a compra aqui mesmo.'
                : 'Busque pelo nome ou filtre por categoria, abra cada peça pra ver medidas e fotos, e monte o pedido pelo WhatsApp.'}
            </p>
          </div>
        </Reveal>
        {/* O wrapper (e não o filtro) é sticky: dentro de um Reveal o filtro
            não teria espaço pra grudar, porque sticky só desliza dentro do
            pai direto — e o pai seria o próprio Reveal, do tamanho dele. */}
        {/* Âncora de "voltar pro começo da grade" — fica acima da barra pra
            ela não cobrir a primeira fileira depois do salto. */}
        <div ref={gridTopRef} className="uni-cat-anchor" />
        {/* No celular a busca fica solta, acima da barra que gruda: os dois
            juntos tomariam um quinto da tela durante a rolagem inteira. */}
        <CatalogSearch
          value={query}
          onChange={changeQuery}
          className="is-standalone"
        />
        <div className="uni-cat-sticky">
          <div className="uni-cat-bar">
            <CategoryFilter
              categories={categoriesWithNew}
              activeCat={activeCat}
              counts={counts}
              onChange={changeCat}
            />
            <CatalogSearch
              value={query}
              onChange={changeQuery}
              className="is-inline"
            />
          </div>
        </div>
        <CatalogFiltros
          cor={cor}
          faixa={faixa}
          ordem={ordem}
          contagemCor={contagemCor}
          contagemFaixa={contagemFaixa}
          onCor={(v) => {
            setCor(v);
            backToGridTop();
          }}
          onFaixa={(v) => {
            setFaixa(v);
            backToGridTop();
          }}
          onOrdem={(v) => {
            setOrdem(v);
            backToGridTop();
          }}
          onLimpar={limparFiltros}
        />
        {(query.trim() !== '' || comFiltroExtra) && (
          <p className="uni-cat-result" role="status">
            {filtered.length === 0
              ? 'Nenhuma peça encontrada'
              : `${filtered.length} ${filtered.length === 1 ? 'peça' : 'peças'}`}
            {query.trim() !== '' ? ` para “${query.trim()}”` : ''}
          </p>
        )}
        <ProductGrid
          displayed={displayed}
          newIds={newIds}
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
