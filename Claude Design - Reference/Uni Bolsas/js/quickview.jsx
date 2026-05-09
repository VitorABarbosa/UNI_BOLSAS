/* =====================================================================
   QUICK-VIEW MODAL
   ===================================================================== */
function QuickView({ product, initialColorIdx, onClose }) {
  const [colorIdx, setColorIdx] = useState(initialColorIdx || 0);
  const [imgIdx, setImgIdx] = useState(0);
  const [sizeIdx, setSizeIdx] = useState(0);

  const color = product.colors[colorIdx];

  // reset image when color changes
  useEffect(() => { setImgIdx(0); }, [colorIdx]);

  // Lock body scroll + esc handler
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="uni-qv-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={`Detalhes ${product.name}`}>
      <div className="uni-qv-modal" onClick={(e) => e.stopPropagation()}>
        <button className="uni-qv-close" onClick={onClose} aria-label="Fechar">
          <CloseIcon size={16} />
        </button>
        {/* Gallery */}
        <div className="uni-qv-gallery">
          <div className="uni-qv-thumbs" role="tablist" aria-label="Imagens da galeria">
            {color.images.map((src, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={imgIdx === i}
                className={"uni-qv-thumb " + (imgIdx === i ? "is-active" : "")}
                onClick={() => setImgIdx(i)}
              >
                <img src={src} alt={`${product.name} ${color.name} #${i + 1}`} />
              </button>
            ))}
            {/* Placeholders when only 1 image, padding visual */}
            {color.images.length === 1 && Array.from({ length: 2 }).map((_, i) => (
              <div key={"ph" + i} className="uni-qv-thumb" style={{ opacity: 0.4, cursor: "default", background: "repeating-linear-gradient(45deg, " + TOKENS.whisper + ", " + TOKENS.whisper + " 4px, " + TOKENS.boneLight + " 4px, " + TOKENS.boneLight + " 8px)" }} />
            ))}
          </div>
          <div className="uni-qv-main">
            <img key={imgIdx} src={color.images[imgIdx] || color.images[0]} alt={`${product.name} ${color.name}`} />
          </div>
        </div>
        {/* Info */}
        <div className="uni-qv-info">
          <div className="uni-qv-eyebrow">{(CATEGORIES.find((c) => c.id === product.category) || {}).label}{product.badge ? " · " + product.badge : ""}</div>
          <h2 className="uni-qv-name">{product.name}</h2>
          <div className="uni-qv-price-row">
            <span className="uni-qv-price">{product.price}</span>
            {product.priceWholesale && (
              <span className="uni-qv-price-w">Atacado · {product.priceWholesale}</span>
            )}
          </div>
          <p className="uni-qv-desc">{product.description}</p>
          <div className="uni-qv-spec-grid">
            <div>
              <div className="uni-qv-spec-label">Dimensões</div>
              <div className="uni-qv-spec-val">{product.dimensions}</div>
            </div>
            <div>
              <div className="uni-qv-spec-label">Peso</div>
              <div className="uni-qv-spec-val">{product.weight}</div>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <div className="uni-qv-spec-label">Material</div>
              <div className="uni-qv-spec-val is-text">{product.material}</div>
            </div>
          </div>
          <div className="uni-qv-color-section">
            <div className="uni-qv-section-label">
              Cor: <strong>{color.name}</strong>
            </div>
            <div className="uni-qv-swatch-row">
              {product.colors.map((c, i) => (
                <button
                  key={c.name}
                  className={"uni-swatch " + (colorIdx === i ? "is-selected" : "")}
                  style={{
                    width: 26, height: 26,
                    background: c.accent
                      ? `linear-gradient(135deg, ${c.hex} 0% 60%, ${c.accent} 60% 100%)`
                      : c.hex,
                  }}
                  onClick={() => setColorIdx(i)}
                  aria-label={`Cor ${c.name}`}
                  title={c.name}
                />
              ))}
            </div>
          </div>
          {product.sizes && product.sizes.length > 1 && (
            <div className="uni-qv-size-section">
              <div className="uni-qv-section-label">
                Tamanho: <strong>{product.sizes[sizeIdx]}</strong>
              </div>
              <div className="uni-qv-size-row">
                {product.sizes.map((s, i) => (
                  <button
                    key={s}
                    className={"uni-qv-size-chip " + (sizeIdx === i ? "is-selected" : "")}
                    onClick={() => setSizeIdx(i)}
                  >{s}</button>
                ))}
              </div>
            </div>
          )}
          <div className="uni-qv-cta">
            <WhatsAppButton
              href={waProduct(product, color, product.sizes && product.sizes.length > 1 ? product.sizes[sizeIdx] : null)}
              full
            >
              Pedir no WhatsApp · {product.price}
            </WhatsAppButton>
            <p className="uni-qv-cta-note">Atendimento humano · respondemos em até 5min</p>
          </div>
        </div>
      </div>
    </div>
  );
}

window.QuickView = QuickView;
