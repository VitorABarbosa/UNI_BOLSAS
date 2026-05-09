/* =====================================================================
   CATALOG — color filter + category filter + product cards
   ===================================================================== */
function ProductCard({ product, selectedColorIdx, onSelectColor, onPreviewColor, previewColorIdx, onOpenQuickView, isLeaving, isEntering }) {
  const selected = product.colors[selectedColorIdx] || product.colors[0];
  const previewing = previewColorIdx != null ? product.colors[previewColorIdx] : null;
  const [imgIdx, setImgIdx] = useState(0);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  const activeColor = previewing || selected;
  const baseImg = activeColor.images[Math.min(imgIdx, activeColor.images.length - 1)] || activeColor.images[0];

  // Cycle imgs of selected color on hover (only when not previewing)
  useEffect(() => {
    if (previewing) return;
    if (selected.images.length <= 1) return;
  }, [previewing, selected]);

  const onMouseMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const cx = (e.clientX - r.left) / r.width - 0.5;
    const cy = (e.clientY - r.top) / r.height - 0.5;
    setParallax({ x: -cx * 4, y: -cy * 4 });
  };
  const onMouseLeave = () => { setParallax({ x: 0, y: 0 }); setImgIdx(0); };

  return (
    <article
      className={"uni-card " + (isLeaving ? "is-leaving " : "") + (isEntering ? "is-entering" : "")}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <button
        className="uni-card-img-wrap"
        onClick={() => onOpenQuickView(product, selectedColorIdx)}
        onMouseEnter={() => { if (selected.images.length > 1) setImgIdx(1); }}
        aria-label={`Ver detalhes ${product.name} cor ${selected.name}`}
      >
        {product.badge && (
          <div className={"uni-card-badge cat-" + product.category}>{product.badge}</div>
        )}
        <img
          src={baseImg}
          alt={`${product.name} ${activeColor.name}`}
          className="uni-card-img"
          style={{ transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0) scale(1.02)` }}
        />
        {selected.images.length > 1 && !previewing && (
          <div className="uni-card-dots" aria-hidden="true">
            {selected.images.map((_, i) => (
              <span key={i} className="uni-card-dot" style={{
                width: i === imgIdx ? 18 : 6,
                opacity: i === imgIdx ? 1 : 0.45,
              }} />
            ))}
          </div>
        )}
      </button>
      <div className="uni-card-body">
        <div className="uni-card-head-row">
          <h3 className="uni-card-name">{product.name}</h3>
          <div className="uni-card-price">{product.price}</div>
        </div>
        <p className="uni-card-tagline">{product.tagline}</p>
        {product.sizes && product.sizes.length > 1 && (
          <div className="uni-card-sizes" aria-label="Tamanhos disponíveis">
            {product.sizes.map((s) => (
              <span key={s} className="uni-card-size-chip">{s}</span>
            ))}
          </div>
        )}
        <div className="uni-card-colors">
          <div className="uni-card-colors-label">
            <span>Cor:</span>
            <strong>{(previewing || selected).name}</strong>
            <span className="uni-card-colors-count">{product.colors.length} {product.colors.length === 1 ? "cor" : "cores"}</span>
          </div>
          <div className="uni-card-swatches">
            {product.colors.map((c, i) => (
              <button
                key={c.name}
                className={"uni-swatch " + (selectedColorIdx === i ? "is-selected" : "")}
                style={{
                  background: c.accent
                    ? `linear-gradient(135deg, ${c.hex} 0% 60%, ${c.accent} 60% 100%)`
                    : c.hex,
                }}
                onClick={() => onSelectColor(product.id, i)}
                onMouseEnter={() => onPreviewColor(product.id, i)}
                onMouseLeave={() => onPreviewColor(product.id, null)}
                aria-label={`Cor ${c.name}${selectedColorIdx === i ? " (selecionada)" : ""}`}
              />
            ))}
          </div>
        </div>
        <div className="uni-card-cta-row">
          <button className="uni-card-cta-detail" onClick={() => onOpenQuickView(product, selectedColorIdx)}>
            Ver detalhes <ArrowIcon size={12} />
          </button>
          <a className="uni-card-cta-wa" href={waProduct(product, selected)} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon size={12} />
            WhatsApp
          </a>
        </div>
      </div>
    </article>
  );
}

function Catalog({ onOpenQuickView }) {
  const [activeCat, setActiveCat] = useState("todos");
  const [activeColor, setActiveColor] = useState(null);
  const [selectedColors, setSelectedColors] = useState(() => {
    const m = {}; PRODUCTS.forEach((p) => { m[p.id] = 0; }); return m;
  });
  const [previewColors, setPreviewColors] = useState({});
  const [renderedIds, setRenderedIds] = useState(() => PRODUCTS.map((p) => p.id));
  const filterTimerRef = useRef(null);

  const filtered = useMemo(() => {
    return PRODUCTS.filter((p) => {
      const catOK = activeCat === "todos" || p.category === activeCat;
      const colorOK = !activeColor || productHasColor(p, activeColor);
      return catOK && colorOK;
    });
  }, [activeCat, activeColor]);

  // Animate filter transition (leave + enter)
  const [leavingIds, setLeavingIds] = useState([]);
  const [enteringIds, setEnteringIds] = useState([]);
  const prevFilteredRef = useRef(filtered.map((p) => p.id));
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
      setTimeout(() => setEnteringIds([]), 700);
      prevFilteredRef.current = curr;
    }, 220);
    return () => clearTimeout(filterTimerRef.current);
  }, [filtered]);

  // displayed list combines renderedIds (so leaving items still render briefly)
  const displayedIds = leavingIds.length
    ? prevFilteredRef.current
    : renderedIds;
  const displayed = displayedIds.map((id) => PRODUCTS.find((p) => p.id === id)).filter(Boolean);

  const onSelectColor = (id, idx) => setSelectedColors((s) => ({ ...s, [id]: idx }));
  const onPreviewColor = (id, idx) => setPreviewColors((s) => ({ ...s, [id]: idx }));

  // counts per cat
  const counts = useMemo(() => {
    const m = { todos: PRODUCTS.length };
    CATEGORIES.forEach((c) => { if (c.id !== "todos") m[c.id] = PRODUCTS.filter((p) => p.category === c.id).length; });
    return m;
  }, []);

  return (
    <section className="uni-catalog uni-section" id="catalogo">
      <div className="uni-container">
        <Reveal>
          <div className="uni-section-head">
            <div className="uni-eyebrow uni-eyebrow-wide">O catálogo</div>
            <h2 className="uni-h2">Bolsas <em>em foco.</em></h2>
            <p className="uni-section-lede">Filtre por cor ou categoria, abra cada peça pra ver dimensões, material e galeria, e peça direto pelo WhatsApp.</p>
          </div>
        </Reveal>
        <Reveal>
          <div className="uni-color-filter" role="toolbar" aria-label="Filtrar por cor">
            <span className="uni-color-filter-label">Cor:</span>
            <button
              className={"uni-color-swatch-big is-clear " + (!activeColor ? "is-selected" : "")}
              onClick={() => setActiveColor(null)}
              aria-label="Todas as cores"
            >Todas</button>
            {COLOR_PALETTE.map((c) => (
              <button
                key={c.name}
                className={"uni-color-swatch-big " + (activeColor === c.hex ? "is-selected" : "")}
                style={{ background: c.hex }}
                onClick={() => setActiveColor(activeColor === c.hex ? null : c.hex)}
                aria-label={`Cor ${c.name}`}
                title={c.name}
              />
            ))}
          </div>
        </Reveal>
        <Reveal>
          <div className="uni-cat-filter" role="tablist" aria-label="Filtrar por categoria">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                role="tab"
                aria-selected={activeCat === c.id}
                className={"uni-cat-btn " + (activeCat === c.id ? "is-active" : "")}
                onClick={() => setActiveCat(c.id)}
              >
                {c.label}
                <span className="uni-cat-count">{counts[c.id]}</span>
              </button>
            ))}
          </div>
        </Reveal>
        <div className="uni-product-grid">
          {displayed.length === 0 ? (
            <div className="uni-product-grid-empty">
              Nenhuma peça nessa combinação. <button onClick={() => { setActiveCat("todos"); setActiveColor(null); }} style={{ background: "transparent", border: "none", color: TOKENS.leatherDark, fontFamily: "inherit", fontSize: "inherit", cursor: "pointer", fontStyle: "italic", textDecoration: "underline" }}>Limpar filtros.</button>
            </div>
          ) : (
            displayed.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                selectedColorIdx={selectedColors[p.id] || 0}
                previewColorIdx={previewColors[p.id]}
                onSelectColor={onSelectColor}
                onPreviewColor={onPreviewColor}
                onOpenQuickView={onOpenQuickView}
                isLeaving={leavingIds.includes(p.id)}
                isEntering={enteringIds.includes(p.id)}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

window.Catalog = Catalog;
window.ProductCard = ProductCard;
