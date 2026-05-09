import React, { useState, useEffect, useRef, useMemo } from "react";

/* =====================================================================
   UNI BOLSAS — MINI CATÁLOGO v3
   Editorial single-page · Catalog · Manifesto · Map · WhatsApp
   ===================================================================== */

const TOKENS = {
  bone: "#F4EFE6",
  boneLight: "#FAF7F1",
  ink: "#111111",
  charcoal: "#2A2724",
  stone: "#6E665C",
  whisper: "#E5DECF",
  pearl: "#FFFFFF",
  leather: "#8B5A3C",
  leatherDark: "#6B4326",
  caramel: "#C9934A",
  whatsapp: "#25D366",
  whatsappDark: "#128C7E",
};

const WHATSAPP = "5511988063432";
const INSTAGRAM = "uni_bolsas";

const STORE = {
  name: "Shopping 900",
  street: "Rua Monsenhor de Andrade, 900",
  district: "Brás",
  city: "São Paulo — SP",
  cep: "03009-100",
  hours: "Segunda a Sexta · 4h às 10h",
  hoursShort: "Seg-Sex · 4h-10h",
  lat: -23.5326,
  lng: -46.6126,
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Shopping+900+Rua+Monsenhor+de+Andrade+900+Br%C3%A1s+S%C3%A3o+Paulo",
  directionsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=Shopping+900+Rua+Monsenhor+de+Andrade+900+Br%C3%A1s+S%C3%A3o+Paulo",
};

const PRODUCTS = [
  {
    id: "matelasse-mini",
    name: "Matelassê Mini",
    tagline: "Acolchoada com fecho duplo dourado e alça de corrente trançada",
    category: "bolsas",
    badge: "Mais vendida",
    colors: [
      { name: "Preto", hex: "#0F0F0F", images: [IMG.matelasse_preto] },
      { name: "Caramelo", hex: "#A47551", images: [IMG.matelasse_caramelo] },
      { name: "Vinho", hex: "#5C1A2B", images: [IMG.matelasse_vinho] },
      { name: "Off-White", hex: "#EFE9DC", images: [IMG.matelasse_offwhite] },
      { name: "Nude", hex: "#C9A98C", images: [IMG.matelasse_nude] },
    ],
  },
  {
    id: "lartlune-kit",
    name: "Kit L'ART&LUNE",
    tagline: "Bolsa transversal estruturada + carteira combinando · alça superior",
    category: "kits",
    badge: "Combo",
    colors: [
      { name: "Caramelo", hex: "#A47551", images: [IMG.lartlune_caramelo] },
      { name: "Off-White", hex: "#EFE9DC", images: [IMG.lartlune_offwhite] },
      { name: "Preto", hex: "#0F0F0F", images: [IMG.lartlune_preto] },
      { name: "Marinho", hex: "#1A2B4A", images: [IMG.lartlune_marinho] },
      { name: "Rosa", hex: "#E5B5B0", images: [IMG.lartlune_rosa] },
      { name: "Cinza Taupe", hex: "#8C7E72", images: [IMG.lartlune_taupe] },
    ],
  },
  {
    id: "mochila-mini-bicolor",
    name: "Mochila Mini Bicolor",
    tagline: "Mochila compacta com vivo contrastante · 22 × 27 cm",
    category: "mochilas",
    badge: "Volta às aulas",
    colors: [
      { name: "Preto / Branco", hex: "#0F0F0F", accent: "#FFFFFF", images: [IMG.mochila_preto_branco, IMG.mochila_preto_branco_lifestyle] },
      { name: "Marinho / Branco", hex: "#1A2B4A", accent: "#FFFFFF", images: [IMG.mochila_marinho_branco] },
      { name: "Cinza / Branco", hex: "#7A7C80", accent: "#FFFFFF", images: [IMG.mochila_cinza_branco] },
      { name: "Preto / Pink", hex: "#0F0F0F", accent: "#FF1493", images: [IMG.mochila_preto_pink] },
      { name: "Marinho / Pink", hex: "#1A2B4A", accent: "#FF1493", images: [IMG.mochila_marinho_pink] },
    ],
  },
  {
    id: "fitness",
    name: "Bolsa Fitness",
    tagline: "Mala esportiva fluída · ideal pra academia · 39 × 27 cm",
    category: "esportivas",
    badge: "Promoção",
    colors: [
      { name: "Grafite", hex: "#3A3D40", images: [IMG.fitness_grafite] },
      { name: "Vermelho", hex: "#A82238", images: [IMG.fitness_vermelho] },
      { name: "Pink", hex: "#C73C7E", images: [IMG.fitness_pink] },
      { name: "Marinho", hex: "#1A2B4A", images: [IMG.fitness_marinho] },
      { name: "Preto", hex: "#0F0F0F", images: [IMG.fitness_preto] },
    ],
  },
  {
    id: "sport",
    name: "Mala Sport",
    tagline: "Mala esportiva clássica · estrutura reforçada · 60 × 30 cm",
    category: "esportivas",
    badge: "Novidade",
    colors: [
      { name: "Preto", hex: "#0F0F0F", images: [IMG.sport_preto_front, IMG.sport_preto_open] },
      { name: "Marinho", hex: "#1A2B4A", images: [IMG.sport_marinho_front, IMG.sport_marinho_open] },
    ],
  },
];

const CATEGORIES = [
  { id: "todos", label: "Todos" },
  { id: "bolsas", label: "Bolsas" },
  { id: "mochilas", label: "Mochilas" },
  { id: "kits", label: "Kits" },
  { id: "esportivas", label: "Esportivas" },
];

/* ---------- WhatsApp helpers ---------- */
function waLink(message) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
}
const waGeneral = waLink(
  "Olá! Vim pelo catálogo Uni Bolsas e gostaria de mais informações."
);
function waProduct(product, color) {
  const colorPart = color ? ` na cor ${color.name}` : "";
  const priceMsg = product.price ? ` (${product.price})` : "";
  return waLink(
    `Olá! Tenho interesse na ${product.name}${colorPart}${priceMsg}. Está disponível?`
  );
}

/* ---------- Icons ---------- */
function WhatsAppIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/>
    </svg>
  );
}
function InstagramIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
function PinIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function ArrowIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
function ClockIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

/* ---------- Logo ---------- */
function Logo({ height = 44, inverted = false }) {
  return (
    <img
      src={IMG.logo}
      alt="Uni Bolsas"
      style={{
        height,
        width: "auto",
        display: "block",
        filter: inverted ? "invert(1) brightness(1.1)" : "none",
      }}
    />
  );
}

/* ---------- Reveal on scroll ---------- */
function Reveal({ children, delay = 0, from = "bottom" }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setShown(true), delay);
          obs.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  const translate = {
    bottom: "translateY(28px)",
    left: "translateX(-28px)",
    right: "translateX(28px)",
  }[from];
  return (
    <div
      ref={ref}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : translate,
        transition: "opacity 0.9s ease, transform 0.9s ease",
      }}
    >
      {children}
    </div>
  );
}

/* ---------- WhatsApp Button ---------- */
function WhatsAppButton({ message, label = "Falar no WhatsApp", variant = "primary", fullWidth = false }) {
  const url = typeof message === "string" ? waLink(message) : message;
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "14px 24px",
    fontFamily: "DM Sans, sans-serif",
    fontSize: 14,
    fontWeight: 500,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    textDecoration: "none",
    transition: "all 0.25s ease",
    cursor: "pointer",
    border: "1px solid transparent",
    width: fullWidth ? "100%" : "auto",
  };
  const styles = {
    primary: { ...base, background: TOKENS.whatsapp, color: TOKENS.pearl },
    dark: { ...base, background: TOKENS.ink, color: TOKENS.bone },
    outline: { ...base, background: "transparent", color: TOKENS.ink, border: `1px solid ${TOKENS.ink}` },
  };
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={styles[variant]} className="uni-wa-btn">
      <WhatsAppIcon size={16} color={variant === "outline" ? TOKENS.ink : TOKENS.pearl} />
      {label}
    </a>
  );
}

/* ---------- Sticky Header ---------- */
function Header() {
  return (
    <header className="uni-header">
      <div className="uni-header-inner">
        <Logo height={36} />
        <a
          href={waGeneral}
          target="_blank"
          rel="noopener noreferrer"
          className="uni-header-cta"
        >
          <WhatsAppIcon size={15} color={TOKENS.pearl} />
          <span className="uni-header-cta-label">WhatsApp</span>
        </a>
      </div>
    </header>
  );
}

/* ---------- Hero Carousel (2 slides, animated) ---------- */
const HERO_SLIDES = [
  {
    key: "branding",
    src: () => IMG.b12_branding_hero,
    alt: "Uni Bolsas — Elegância que acompanha seu ritmo",
    tag: "Coleção · 2026",
    objectPosition: "center center",
  },
  {
    key: "promo",
    src: () => IMG.b13_promo_5off,
    alt: "Uni Bolsas — 5% OFF na primeira compra",
    tag: "Oferta · Exclusiva",
    objectPosition: "center center",
  },
];

function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState(null);
  const [dir, setDir] = useState(1); // 1 = forward, -1 = back
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef(null);

  const goTo = (idx, direction) => {
    if (transitioning || idx === active) return;
    setDir(direction);
    setPrev(active);
    setActive(idx);
    setTransitioning(true);
    setTimeout(() => {
      setPrev(null);
      setTransitioning(false);
    }, 900);
  };

  const next = () => goTo((active + 1) % HERO_SLIDES.length, 1);
  const goIdx = (i) => goTo(i, i > active ? 1 : -1);

  // Auto-advance every 5s
  useEffect(() => {
    timerRef.current = setInterval(next, 5000);
    return () => clearInterval(timerRef.current);
  }, [active, transitioning]);

  const resetTimer = (fn) => {
    clearInterval(timerRef.current);
    fn();
  };

  return (
    <div className="uni-carousel">
      {/* Slides */}
      {HERO_SLIDES.map((slide, i) => {
        const isActive = i === active;
        const isPrev = i === prev;
        if (!isActive && !isPrev) return null;
        return (
          <div
            key={slide.key}
            className={[
              "uni-carousel-slide",
              isActive ? "is-active" : "",
              isPrev ? "is-prev" : "",
            ].join(" ")}
            style={{
              "--slide-dir": dir,
            }}
          >
            <img
              src={slide.src()}
              alt={slide.alt}
              className="uni-carousel-img"
            />
            {/* Overlay gradient */}
            <div className="uni-carousel-overlay" />
            {/* Tag */}
            <div className="uni-carousel-tag">{slide.tag}</div>
          </div>
        );
      })}

      {/* Dot indicators */}
      <div className="uni-carousel-dots">
        {HERO_SLIDES.map((slide, i) => (
          <button
            key={slide.key}
            className={"uni-carousel-dot" + (i === active ? " is-active" : "")}
            onClick={() => resetTimer(() => goIdx(i))}
            aria-label={`Slide ${i + 1}`}
          >
            <span className="uni-carousel-dot-fill" />
          </button>
        ))}
      </div>

      {/* Arrow buttons */}
      <button
        className="uni-carousel-arrow uni-carousel-arrow-prev"
        onClick={() => resetTimer(() => goTo((active - 1 + HERO_SLIDES.length) % HERO_SLIDES.length, -1))}
        aria-label="Anterior"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <button
        className="uni-carousel-arrow uni-carousel-arrow-next"
        onClick={() => resetTimer(next)}
        aria-label="Próximo"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Progress bar */}
      <div className="uni-carousel-progress">
        <div key={active} className="uni-carousel-progress-fill" />
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="uni-hero">
      <div className="uni-hero-bg" aria-hidden="true" />
      <div className="uni-hero-orb uni-hero-orb-1" aria-hidden="true" />
      <div className="uni-hero-orb uni-hero-orb-2" aria-hidden="true" />

      <div className="uni-container uni-hero-inner">
        <div className="uni-hero-image-frame">
          <HeroCarousel />
        </div>

        <div className="uni-eyebrow uni-center uni-anim-eyebrow">
          · Atacado e varejo · Brás SP ·
        </div>

        <h1 className="uni-h1 uni-center uni-h1-anim">
          <span className="uni-word" style={{ animationDelay: "0.55s" }}>Sua</span>
          {" "}
          <span className="uni-word" style={{ animationDelay: "0.68s" }}>rotina.</span>
          <br />
          <em>
            <span className="uni-word" style={{ animationDelay: "0.85s" }}>Seu</span>
            {" "}
            <span className="uni-word" style={{ animationDelay: "0.98s" }}>estilo.</span>
          </em>
          <br />
          <span className="uni-word" style={{ animationDelay: "1.15s" }}>Sua</span>
          {" "}
          <span className="uni-word" style={{ animationDelay: "1.28s" }}>bolsa.</span>
        </h1>

        <div className="uni-hero-divider uni-anim-divider" />

        <p className="uni-hero-lede uni-center uni-anim-lede">
          Bolsas e mochilas selecionadas pra te acompanhar todos os dias. Atendimento direto pelo WhatsApp e loja física no Shopping 900, no coração do Brás.
        </p>

        <div className="uni-hero-ctas uni-anim-ctas">
          <WhatsAppButton
            message="Olá! Vim pelo catálogo Uni Bolsas e gostaria de mais informações."
            label="Falar no WhatsApp"
            variant="primary"
          />
          <a href="#catalogo" className="uni-secondary-btn">
            Ver coleção <ArrowIcon size={14} />
          </a>
        </div>
      </div>
    </section>
  );
}

/* ---------- Product Card ---------- */
function ProductCard({ product, index }) {
  const [colorIdx, setColorIdx] = useState(0);
  const [imgIdx, setImgIdx] = useState(0);
  const [hovered, setHovered] = useState(false);

  const color = product.colors[colorIdx];
  const images = color.images;
  const hasMultiple = images.length > 1;

  // Reset image index when color changes
  useEffect(() => { setImgIdx(0); }, [colorIdx]);

  // Cycle images on hover (when current color has multiple shots)
  useEffect(() => {
    if (!hovered || !hasMultiple) return;
    const t = setInterval(() => {
      setImgIdx((i) => (i + 1) % images.length);
    }, 1400);
    return () => clearInterval(t);
  }, [hovered, hasMultiple, images.length]);

  return (
    <Reveal delay={(index % 2) * 100}>
      <div
        className="uni-card"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <a
          href={waProduct(product, color)}
          target="_blank"
          rel="noopener noreferrer"
          className="uni-card-img-wrap"
          aria-label={`Pedir ${product.name} ${color.name} no WhatsApp`}
        >
          {images.map((src, i) => (
            <img
              key={`${colorIdx}-${i}`}
              src={src}
              alt={`${product.name} - ${color.name}`}
              className="uni-card-img"
              style={{
                opacity: i === imgIdx ? 1 : 0,
                transform: hovered && i === imgIdx ? "scale(1.04)" : "scale(1)",
              }}
            />
          ))}

          {product.badge && <div className="uni-card-badge">{product.badge}</div>}

          {hasMultiple && (
            <div className="uni-card-dots">
              {images.map((_, i) => (
                <span
                  key={i}
                  className="uni-card-dot"
                  style={{
                    opacity: i === imgIdx ? 1 : 0.35,
                    width: i === imgIdx ? 18 : 6,
                  }}
                />
              ))}
            </div>
          )}

          <div className="uni-card-overlay" style={{ opacity: hovered ? 1 : 0 }}>
            <div className="uni-card-overlay-cta">
              <WhatsAppIcon size={16} color={TOKENS.pearl} />
              Pedir no WhatsApp
            </div>
          </div>
        </a>

        <div className="uni-card-body">
          <h3 className="uni-card-name">{product.name}</h3>
          <p className="uni-card-tagline">{product.tagline}</p>

          <div className="uni-card-colors">
            <div className="uni-card-colors-label">
              <span>Cor:</span> <strong>{color.name}</strong>
              <span className="uni-card-colors-count">{product.colors.length} opções</span>
            </div>
            <div className="uni-card-swatches">
              {product.colors.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setColorIdx(i); }}
                  aria-label={c.name}
                  title={c.name}
                  className={"uni-swatch" + (i === colorIdx ? " is-selected" : "")}
                  style={{
                    background: c.hex,
                    ...(c.accent && {
                      borderColor: c.accent,
                      borderWidth: "2.5px",
                    }),
                  }}
                />
              ))}
            </div>
          </div>

          <div className="uni-card-pricerow">
            <div className="uni-card-price">{product.price || "Sob consulta"}</div>
          </div>

          <a
            href={waProduct(product, color)}
            target="_blank"
            rel="noopener noreferrer"
            className="uni-card-cta"
          >
            <WhatsAppIcon size={14} color={TOKENS.pearl} />
            Tenho interesse
          </a>
        </div>
      </div>
    </Reveal>
  );
}

/* ---------- Catalog ---------- */
function Catalog() {
  const [activeCat, setActiveCat] = useState("todos");
  const filtered = useMemo(
    () => activeCat === "todos" ? PRODUCTS : PRODUCTS.filter((p) => p.category === activeCat),
    [activeCat]
  );

  return (
    <section id="catalogo" className="uni-section uni-catalog">
      <div className="uni-container">
        <div className="uni-section-head">
          <Reveal>
            <div className="uni-eyebrow">· Catálogo ·</div>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="uni-h2">Nossas peças.</h2>
          </Reveal>
          <Reveal delay={180}>
            <p className="uni-section-lede">
              Toque em qualquer peça pra falar diretamente com a gente no WhatsApp. Atacado e varejo disponíveis.
            </p>
          </Reveal>
        </div>

        <Reveal delay={220}>
          <div className="uni-cat-filter">
            {CATEGORIES.map((c) => {
              const count = c.id === "todos"
                ? PRODUCTS.length
                : PRODUCTS.filter((p) => p.category === c.id).length;
              const active = activeCat === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.id)}
                  className="uni-cat-btn"
                  style={{
                    background: active ? TOKENS.ink : "transparent",
                    color: active ? TOKENS.bone : TOKENS.ink,
                    borderColor: active ? TOKENS.ink : TOKENS.whisper,
                  }}
                >
                  {c.label} <span className="uni-cat-count">{count}</span>
                </button>
              );
            })}
          </div>
        </Reveal>

        <div className="uni-product-grid">
          {filtered.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Manifesto (text-only) ---------- */
function Manifesto() {
  const stats = [
    { num: "500+", label: "Modelos disponíveis" },
    { num: "5★",   label: "Avaliação dos clientes" },
    { num: "10+",  label: "Anos no Brás" },
  ];

  return (
    <section className="uni-manifesto">
      {/* Decorative grain overlay */}
      <div className="uni-manifesto-grain" aria-hidden="true" />

      <div className="uni-container uni-manifesto-layout">

        {/* LEFT — Photo column */}
        <Reveal from="left">
          <div className="uni-manifesto-photo-col">
            <div className="uni-manifesto-photo-wrap">
              <img
                src={IMG.b12_branding_hero}
                alt="Modelo Uni Bolsas — Elegância que acompanha seu ritmo"
                className="uni-manifesto-photo"
              />
              {/* Floating badge */}
              <div className="uni-manifesto-badge">
                <span className="uni-manifesto-badge-num">Brás</span>
                <span className="uni-manifesto-badge-sub">São Paulo</span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* RIGHT — Text column */}
        <div className="uni-manifesto-text-col">
          <Reveal delay={120}>
            <div className="uni-eyebrow uni-eyebrow-light">· Manifesto ·</div>
          </Reveal>

          {/* Giant decorative quote mark */}
          <Reveal delay={200}>
            <div className="uni-manifesto-quote-mark" aria-hidden="true">"</div>
          </Reveal>

          <Reveal delay={260}>
            <blockquote className="uni-manifesto-quote">
              Uma bolsa boa é a que combina com a sua rotina{" "}
              <em>sem esforço.</em>
            </blockquote>
          </Reveal>

          <Reveal delay={360}>
            <p className="uni-manifesto-body">
              A gente acredita em peças que duram, cores que combinam com quem você é, e atendimento de quem realmente entende do produto. Atacado ou varejo — a experiência é a mesma.
            </p>
          </Reveal>

          {/* Divider */}
          <Reveal delay={440}>
            <div className="uni-manifesto-rule" />
          </Reveal>

          {/* Stats row */}
          <Reveal delay={520}>
            <div className="uni-manifesto-stats">
              {stats.map((s, i) => (
                <div key={i} className="uni-manifesto-stat">
                  <div className="uni-manifesto-stat-num">{s.num}</div>
                  <div className="uni-manifesto-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* CTA */}
          <Reveal delay={600}>
            <a
              href={waGeneral}
              target="_blank"
              rel="noopener noreferrer"
              className="uni-manifesto-cta"
            >
              <WhatsAppIcon size={16} color={TOKENS.ink} />
              Fale com a gente
            </a>
          </Reveal>
        </div>

      </div>
    </section>
  );
}

/* ---------- Illustrated Map (stylized SVG, 100% local) ---------- */
function IllustratedMap() {
  return (
    <svg
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "100%", display: "block", background: TOKENS.boneLight }}
      aria-label="Mapa estilizado mostrando a localização da Uni Bolsas no Shopping 900, Brás"
    >
      <defs>
        <pattern id="uni-map-dots" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="11" cy="11" r="0.9" fill={TOKENS.whisper} opacity="0.7" />
        </pattern>
        <radialGradient id="uni-map-vignette" cx="50%" cy="50%" r="65%">
          <stop offset="60%" stopColor={TOKENS.boneLight} stopOpacity="0" />
          <stop offset="100%" stopColor={TOKENS.bone} stopOpacity="0.7" />
        </radialGradient>
      </defs>

      {/* Dot grid texture */}
      <rect width="800" height="600" fill="url(#uni-map-dots)" />

      {/* Avenida Cruzeiro do Sul (large avenue, top) */}
      <g>
        <line x1="-20" y1="100" x2="820" y2="100" stroke={TOKENS.whisper} strokeWidth="34" strokeLinecap="round" />
        <line x1="-20" y1="100" x2="820" y2="100" stroke={TOKENS.boneLight} strokeWidth="2" strokeDasharray="6 8" opacity="0.7" />
      </g>
      <text x="400" y="78" fontFamily="DM Sans, sans-serif" fontSize="11" letterSpacing="0.32em"
            textAnchor="middle" fill={TOKENS.stone} fontWeight="500">
        AV. CRUZEIRO DO SUL
      </text>

      {/* R. Monsenhor de Andrade (main street, mid horizontal) */}
      <line x1="-20" y1="350" x2="820" y2="350" stroke={TOKENS.whisper} strokeWidth="20" strokeLinecap="round" />
      <text x="400" y="382" fontFamily="DM Sans, sans-serif" fontSize="11" letterSpacing="0.28em"
            textAnchor="middle" fill={TOKENS.stone} fontWeight="500">
        R. MONSENHOR DE ANDRADE
      </text>

      {/* Vertical cross streets */}
      <line x1="170" y1="-20" x2="170" y2="620" stroke={TOKENS.whisper} strokeWidth="11" strokeLinecap="round" />
      <line x1="500" y1="-20" x2="500" y2="620" stroke={TOKENS.whisper} strokeWidth="11" strokeLinecap="round" />
      <line x1="660" y1="-20" x2="660" y2="620" stroke={TOKENS.whisper} strokeWidth="11" strokeLinecap="round" />

      {/* Building blocks (subtle rounded squares) */}
      <g fill={TOKENS.bone} opacity="0.55">
        {/* Top row (between Cruzeiro do Sul and Monsenhor de Andrade) */}
        <rect x="20" y="125" width="138" height="210" rx="3" />
        <rect x="184" y="125" width="304" height="210" rx="3" />
        <rect x="514" y="125" width="134" height="210" rx="3" />
        <rect x="676" y="125" width="124" height="210" rx="3" />
        {/* Bottom row (below Monsenhor de Andrade) */}
        <rect x="20" y="368" width="138" height="200" rx="3" />
        <rect x="514" y="368" width="134" height="200" rx="3" />
        <rect x="676" y="368" width="124" height="200" rx="3" />
      </g>

      {/* SHOPPING 900 highlighted block */}
      <g>
        <rect x="184" y="368" width="304" height="200" rx="3" fill={TOKENS.leather} opacity="0.16" />
        <rect x="184" y="368" width="304" height="200" rx="3" fill="none"
              stroke={TOKENS.leatherDark} strokeWidth="1.5" strokeDasharray="5 4" opacity="0.85" />
        <text x="336" y="552" fontFamily="Fraunces, Georgia, serif" fontStyle="italic" fontSize="20"
              textAnchor="middle" fill={TOKENS.leatherDark} fontWeight="400">
          Shopping 900
        </text>
        <text x="336" y="530" fontFamily="DM Sans, sans-serif" fontSize="10" letterSpacing="0.3em"
              textAnchor="middle" fill={TOKENS.stone} fontWeight="500">
          Nº 900
        </text>
      </g>

      {/* Pin marker with animated pulse rings */}
      <g transform="translate(336, 444)">
        {/* Pulse rings */}
        <circle r="20" fill="none" stroke={TOKENS.ink} strokeWidth="1.5" opacity="0">
          <animate attributeName="r" from="18" to="80" dur="2.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.5" to="0" dur="2.6s" repeatCount="indefinite" />
        </circle>
        <circle r="20" fill="none" stroke={TOKENS.ink} strokeWidth="1.5" opacity="0">
          <animate attributeName="r" from="18" to="80" dur="2.6s" begin="1.3s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.5" to="0" dur="2.6s" begin="1.3s" repeatCount="indefinite" />
        </circle>

        {/* Pin shadow */}
        <ellipse cx="2" cy="6" rx="14" ry="4" fill={TOKENS.ink} opacity="0.18" />

        {/* Pin pole */}
        <line x1="0" y1="0" x2="0" y2="-26" stroke={TOKENS.ink} strokeWidth="2.5" strokeLinecap="round" />

        {/* Pin head circle */}
        <circle cx="0" cy="-44" r="20" fill={TOKENS.ink} />
        <circle cx="0" cy="-44" r="20" fill="none" stroke={TOKENS.bone} strokeWidth="1.5" opacity="0.4" />

        {/* "U" letterform in pin */}
        <text x="0" y="-37" fontFamily="Fraunces, Georgia, serif" fontSize="20" fontWeight="500"
              textAnchor="middle" fill={TOKENS.bone}>U</text>

        {/* Base anchor dot */}
        <circle cx="0" cy="0" r="3.5" fill={TOKENS.ink} />
      </g>

      {/* Compass rose top right */}
      <g transform="translate(740, 60)" opacity="0.55">
        <circle r="22" fill={TOKENS.boneLight} stroke={TOKENS.stone} strokeWidth="0.8" />
        <text y="-5" fontFamily="Fraunces, Georgia, serif" fontStyle="italic" fontSize="14"
              textAnchor="middle" fill={TOKENS.stone} fontWeight="500">N</text>
        <line x1="0" y1="-19" x2="0" y2="-13" stroke={TOKENS.stone} strokeWidth="1.4" strokeLinecap="round" />
        <line x1="0" y1="13" x2="0" y2="19" stroke={TOKENS.stone} strokeWidth="1.4" strokeLinecap="round" />
        <line x1="-19" y1="0" x2="-13" y2="0" stroke={TOKENS.stone} strokeWidth="1.4" strokeLinecap="round" />
        <line x1="13" y1="0" x2="19" y2="0" stroke={TOKENS.stone} strokeWidth="1.4" strokeLinecap="round" />
      </g>

      {/* Bottom-left district label */}
      <text x="40" y="582" fontFamily="DM Sans, sans-serif" fontSize="10" letterSpacing="0.32em"
            fill={TOKENS.stone} fontWeight="500">
        BRÁS · SÃO PAULO
      </text>

      {/* Scale indicator bottom-right */}
      <g transform="translate(660, 575)" opacity="0.55">
        <line x1="0" y1="0" x2="80" y2="0" stroke={TOKENS.stone} strokeWidth="1.3" />
        <line x1="0" y1="-4" x2="0" y2="4" stroke={TOKENS.stone} strokeWidth="1.3" />
        <line x1="40" y1="-3" x2="40" y2="3" stroke={TOKENS.stone} strokeWidth="1.3" />
        <line x1="80" y1="-4" x2="80" y2="4" stroke={TOKENS.stone} strokeWidth="1.3" />
        <text x="80" y="-8" fontFamily="DM Sans, sans-serif" fontSize="9" letterSpacing="0.15em"
              textAnchor="end" fill={TOKENS.stone}>100m</text>
      </g>

      {/* Subtle vignette */}
      <rect width="800" height="600" fill="url(#uni-map-vignette)" pointerEvents="none" />
    </svg>
  );
}

/* ---------- Location with Illustrated Map ---------- */
function Location() {
  return (
    <section id="localizacao" className="uni-section uni-location-section">
      <div className="uni-container">
        <div className="uni-section-head">
          <Reveal>
            <div className="uni-eyebrow">· Visite a loja ·</div>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="uni-h2">Estamos no Brás.</h2>
          </Reveal>
        </div>

        <div className="uni-location-grid">
          <Reveal from="left">
            <div className="uni-map-wrap">
              <IllustratedMap />
              <a
                href={STORE.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="uni-map-pill"
              >
                Ver no Google Maps <ArrowIcon size={14} />
              </a>
            </div>
          </Reveal>

          <div className="uni-location-info">
            <Reveal delay={160}>
              <div className="uni-location-tag">
                <PinIcon size={18} color={TOKENS.leatherDark} />
                <span>Loja física</span>
              </div>
            </Reveal>
            <Reveal delay={220}>
              <h3 className="uni-store-name">{STORE.name}</h3>
            </Reveal>
            <Reveal delay={280}>
              <div className="uni-store-addr">
                <div>{STORE.street}</div>
                <div>{STORE.district} · {STORE.city}</div>
                <div className="uni-store-cep">CEP {STORE.cep}</div>
              </div>
            </Reveal>
            <Reveal delay={340}>
              <div className="uni-store-hours">
                <div className="uni-store-hours-head">
                  <ClockIcon size={14} color={TOKENS.stone} />
                  <span>Horário</span>
                </div>
                <div className="uni-store-hours-body">{STORE.hours}</div>
              </div>
            </Reveal>
            <Reveal delay={400}>
              <div className="uni-location-ctas">
                <a
                  href={STORE.directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="uni-loc-btn-dark"
                >
                  <PinIcon size={15} color={TOKENS.bone} /> Como chegar
                </a>
                <WhatsAppButton
                  message="Olá! Quero saber se vocês estão na loja agora."
                  label="Confirmar atendimento"
                  variant="primary"
                  fullWidth
                />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */
function Footer() {
  return (
    <footer className="uni-footer">
      <div className="uni-container">
        <div className="uni-footer-grid">
          <div>
            <Logo height={42} inverted />
            <p className="uni-footer-blurb">
              Atacado e varejo · Atendimento personalizado · Brás, São Paulo
            </p>
          </div>
          <div>
            <div className="uni-footer-head">Contato</div>
            <div className="uni-footer-list">
              <a href={waGeneral} target="_blank" rel="noopener noreferrer" className="uni-footer-link">
                <WhatsAppIcon size={16} color={TOKENS.bone} />
                (11) 98806-3432
              </a>
              <a href={`https://instagram.com/${INSTAGRAM}`} target="_blank" rel="noopener noreferrer" className="uni-footer-link">
                <InstagramIcon size={16} color={TOKENS.bone} />
                @{INSTAGRAM}
              </a>
            </div>
          </div>
          <div>
            <div className="uni-footer-head">Loja</div>
            <div className="uni-footer-store">
              {STORE.name}
              <br />
              {STORE.street}
              <br />
              {STORE.district} · {STORE.city}
              <br />
              <span className="uni-footer-hours">{STORE.hours}</span>
            </div>
          </div>
        </div>
        <div className="uni-footer-bottom">
          © {new Date().getFullYear()} Uni Bolsas · Todos os direitos reservados
        </div>
      </div>
    </footer>
  );
}

/* ---------- Floating WhatsApp ---------- */
function FloatingWA() {
  return (
    <a
      href={waGeneral}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="uni-float-wa"
    >
      <WhatsAppIcon size={28} color={TOKENS.pearl} />
    </a>
  );
}

/* ---------- App ---------- */
export default function App() {
  return (
    <div className="uni-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@400;500;700&display=swap');

        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; scroll-behavior: smooth; }

        .uni-root {
          background: ${TOKENS.bone};
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          color: ${TOKENS.ink};
        }

        .uni-container {
          width: 100%;
          max-width: 1320px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .uni-section { padding: 100px 0; }

        .uni-eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: ${TOKENS.stone};
          margin-bottom: 16px;
        }
        .uni-eyebrow-light { color: ${TOKENS.whisper}; }
        .uni-center { text-align: center; }

        .uni-h1 {
          font-family: 'Fraunces', Georgia, serif;
          font-size: clamp(48px, 8.5vw, 96px);
          line-height: 1.0;
          letter-spacing: -0.03em;
          font-weight: 400;
          color: ${TOKENS.ink};
          margin: 0 0 32px;
        }
        .uni-h1 em { font-style: italic; color: ${TOKENS.leatherDark}; }

        .uni-h2 {
          font-family: 'Fraunces', Georgia, serif;
          font-size: clamp(36px, 5vw, 56px);
          line-height: 1.05;
          letter-spacing: -0.02em;
          font-weight: 400;
          color: ${TOKENS.ink};
          margin: 0 0 18px;
        }
        .uni-h2 em { font-style: italic; color: ${TOKENS.leatherDark}; }
        .uni-h2-light { color: ${TOKENS.bone}; }
        .uni-h2-light em { color: ${TOKENS.whisper}; }

        .uni-section-head { text-align: center; margin-bottom: 56px; }
        .uni-section-lede {
          font-family: 'DM Sans', sans-serif;
          font-size: 16px;
          line-height: 1.6;
          color: ${TOKENS.charcoal};
          max-width: 540px;
          margin: 0 auto;
        }

        /* Header */
        .uni-header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(244, 239, 230, 0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid ${TOKENS.whisper};
        }
        .uni-header-inner {
          width: 100%;
          max-width: 1320px;
          margin: 0 auto;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .uni-header-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: ${TOKENS.whatsapp};
          color: ${TOKENS.pearl};
          padding: 10px 18px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          text-decoration: none;
          transition: background 0.25s ease;
        }
        .uni-header-cta:hover { background: ${TOKENS.whatsappDark}; }

        /* Hero (text-only) */
        .uni-hero {
          padding: 90px 0 120px;
          background: ${TOKENS.bone};
          position: relative;
          overflow: hidden;
        }
        /* Atmospheric background */
        .uni-hero-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 40% at 25% 20%, rgba(164, 117, 81, 0.10), transparent 60%),
            radial-gradient(ellipse 50% 35% at 75% 75%, rgba(92, 26, 43, 0.07), transparent 60%);
          pointer-events: none;
          animation: uni-bg-drift 18s ease-in-out infinite alternate;
        }
        @keyframes uni-bg-drift {
          0% { transform: scale(1) translate(0, 0); opacity: 0.7; }
          50% { opacity: 1; }
          100% { transform: scale(1.08) translate(2%, -1.5%); opacity: 0.85; }
        }
        /* Floating decorative orbs */
        .uni-hero-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(60px);
          opacity: 0.3;
        }
        .uni-hero-orb-1 {
          width: 280px;
          height: 280px;
          background: ${TOKENS.leather};
          top: 8%;
          left: -80px;
          animation: uni-orb-float-1 14s ease-in-out infinite alternate;
        }
        .uni-hero-orb-2 {
          width: 220px;
          height: 220px;
          background: ${TOKENS.wine};
          bottom: 12%;
          right: -60px;
          animation: uni-orb-float-2 16s ease-in-out infinite alternate;
        }
        @keyframes uni-orb-float-1 {
          0% { transform: translate(0, 0); opacity: 0.25; }
          100% { transform: translate(40px, -30px); opacity: 0.4; }
        }
        @keyframes uni-orb-float-2 {
          0% { transform: translate(0, 0); opacity: 0.2; }
          100% { transform: translate(-30px, 20px); opacity: 0.35; }
        }

        .uni-hero-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 980px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        /* Image — bigger, with reveal animation, ken burns, and hover lift */
        .uni-hero-image-frame {
          position: relative;
          width: 100%;
          max-width: 760px;
          margin: 0 0 56px;
          animation: uni-frame-rise 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        .uni-hero-image {
          width: 100%;
          overflow: hidden;
          background: ${TOKENS.boneLight};
          position: relative;
          box-shadow:
            0 30px 80px -24px rgba(17, 17, 17, 0.22),
            0 6px 16px -8px rgba(17, 17, 17, 0.08),
            0 1px 3px rgba(17, 17, 17, 0.04);
          animation: uni-image-reveal 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
          transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.6s ease;
        }
        .uni-hero-image:hover {
          transform: translateY(-6px);
          box-shadow:
            0 50px 120px -30px rgba(17, 17, 17, 0.32),
            0 10px 28px -12px rgba(17, 17, 17, 0.14),
            0 2px 4px rgba(17, 17, 17, 0.06);
        }
        .uni-hero-image img {
          width: 100%;
          height: auto;
          display: block;
          object-fit: cover;
          animation: uni-ken-burns 22s ease-in-out infinite alternate;
          transform-origin: center center;
        }
        @keyframes uni-frame-rise {
          0% { opacity: 0; transform: translateY(28px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes uni-image-reveal {
          0% {
            opacity: 0;
            transform: scale(0.94);
            clip-path: inset(12% 12% 12% 12%);
          }
          100% {
            opacity: 1;
            transform: scale(1);
            clip-path: inset(0% 0% 0% 0%);
          }
        }
        @keyframes uni-ken-burns {
          0% { transform: scale(1.0) translate(0, 0); }
          50% { transform: scale(1.045) translate(-1%, -0.8%); }
          100% { transform: scale(1.02) translate(0.8%, 0.5%); }
        }
        /* Coleção tag floating top-right */
        .uni-hero-image-tag {
          position: absolute;
          top: 18px;
          right: -14px;
          background: ${TOKENS.ink};
          color: ${TOKENS.bone};
          padding: 7px 16px;
          font-size: 10px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          z-index: 2;
          opacity: 0;
          animation: uni-tag-pop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 1.6s both;
          box-shadow: 0 8px 20px rgba(17, 17, 17, 0.18);
        }
        @keyframes uni-tag-pop {
          0% { opacity: 0; transform: translateY(-8px) scale(0.85); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Eyebrow letter-spread on entry */
        .uni-anim-eyebrow {
          opacity: 0;
          animation: uni-letter-spread 1.4s ease 0.35s both;
        }
        @keyframes uni-letter-spread {
          0% { letter-spacing: 0.1em; opacity: 0; }
          100% { letter-spacing: 0.4em; opacity: 1; }
        }

        /* H1 word-by-word reveal with blur */
        .uni-h1-anim .uni-word {
          display: inline-block;
          opacity: 0;
          will-change: transform, opacity, filter;
          animation: uni-word-rise 1.1s cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        @keyframes uni-word-rise {
          0% {
            opacity: 0;
            transform: translateY(38px);
            filter: blur(8px);
          }
          60% {
            filter: blur(0);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        /* Divider grows from 0 to 80px */
        .uni-hero-divider {
          width: 80px;
          height: 1px;
          background: ${TOKENS.leatherDark};
          margin: 0 0 32px;
          opacity: 0.6;
          transform-origin: center;
        }
        .uni-anim-divider {
          width: 0;
          opacity: 0;
          animation: uni-divider-grow 1s cubic-bezier(0.65, 0.05, 0.36, 1) 1.45s both;
        }
        @keyframes uni-divider-grow {
          0% { width: 0; opacity: 0; }
          100% { width: 80px; opacity: 0.6; }
        }

        /* Lede & CTAs fade up */
        .uni-hero-lede {
          font-family: 'DM Sans', sans-serif;
          font-size: 17px;
          line-height: 1.65;
          color: ${TOKENS.charcoal};
          max-width: 580px;
          margin: 0 0 48px;
        }
        .uni-anim-lede {
          opacity: 0;
          animation: uni-fade-up 0.9s ease 1.7s both;
        }
        .uni-hero-ctas {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .uni-anim-ctas {
          opacity: 0;
          animation: uni-fade-up 0.9s ease 1.95s both;
        }
        @keyframes uni-fade-up {
          0% { opacity: 0; transform: translateY(18px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .uni-secondary-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 24px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          text-decoration: none;
          color: ${TOKENS.ink};
          border: 1px solid ${TOKENS.ink};
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
        }
        .uni-secondary-btn:hover {
          background: ${TOKENS.ink};
          color: ${TOKENS.bone};
          transform: translateY(-1px);
        }


        /* ---- Hero Carousel ---- */
        .uni-carousel {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 3;
          overflow: hidden;
          background: ${TOKENS.boneLight};
          box-shadow:
            0 30px 80px -24px rgba(17, 17, 17, 0.22),
            0 6px 16px -8px rgba(17, 17, 17, 0.08);
          transition: box-shadow 0.6s ease;
        }
        .uni-carousel:hover {
          box-shadow:
            0 50px 120px -30px rgba(17, 17, 17, 0.32),
            0 10px 28px -12px rgba(17, 17, 17, 0.14);
        }

        .uni-carousel-slide {
          position: absolute;
          inset: 0;
          will-change: transform, opacity, clip-path;
        }

        /* Enter: slide coming in from the right (dir=1) or left (dir=-1) */
        @keyframes uni-slide-in-right {
          0%   { opacity: 0; clip-path: inset(0 100% 0 0); transform: scale(1.04); }
          100% { opacity: 1; clip-path: inset(0 0% 0 0);   transform: scale(1); }
        }
        @keyframes uni-slide-in-left {
          0%   { opacity: 0; clip-path: inset(0 0 0 100%); transform: scale(1.04); }
          100% { opacity: 1; clip-path: inset(0 0 0 0%);   transform: scale(1); }
        }
        /* Exit: prev slide fades away */
        @keyframes uni-slide-out {
          0%   { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.97); }
        }

        .uni-carousel-slide.is-active {
          z-index: 2;
          animation: uni-slide-in-right 0.9s cubic-bezier(0.3, 0.8, 0.2, 1) both;
        }
        .uni-carousel-slide.is-active[style*="--slide-dir: -1"] {
          animation-name: uni-slide-in-left;
        }
        .uni-carousel-slide.is-prev {
          z-index: 1;
          animation: uni-slide-out 0.9s ease both;
        }

        .uni-carousel-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        /* Subtle dark vignette at bottom so text overlays are legible */
        .uni-carousel-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            transparent 55%,
            rgba(17, 17, 17, 0.32) 100%
          );
          pointer-events: none;
        }

        /* Slide tag (top right) */
        .uni-carousel-tag {
          position: absolute;
          top: 16px;
          right: 16px;
          background: ${TOKENS.ink};
          color: ${TOKENS.bone};
          padding: 6px 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          font-weight: 500;
          z-index: 3;
          box-shadow: 0 4px 14px rgba(17, 17, 17, 0.22);
          animation: uni-tag-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s both;
        }

        /* Arrow buttons */
        .uni-carousel-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(244, 239, 230, 0.88);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(17, 17, 17, 0.08);
          color: ${TOKENS.ink};
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.25s ease, box-shadow 0.25s ease;
          box-shadow: 0 4px 16px rgba(17, 17, 17, 0.14);
          padding: 0;
        }
        .uni-carousel-arrow:hover {
          background: ${TOKENS.bone};
          transform: translateY(-50%) scale(1.08);
          box-shadow: 0 8px 24px rgba(17, 17, 17, 0.22);
        }
        .uni-carousel-arrow-prev { left: 14px; }
        .uni-carousel-arrow-next { right: 14px; }

        /* Dot indicators */
        .uni-carousel-dots {
          position: absolute;
          bottom: 18px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 10px;
          z-index: 10;
        }
        .uni-carousel-dot {
          width: 28px;
          height: 6px;
          border-radius: 3px;
          background: rgba(244, 239, 230, 0.35);
          border: none;
          cursor: pointer;
          padding: 0;
          transition: background 0.3s ease, width 0.4s ease;
          overflow: hidden;
          position: relative;
        }
        .uni-carousel-dot.is-active {
          width: 56px;
          background: rgba(244, 239, 230, 0.5);
        }
        .uni-carousel-dot-fill {
          position: absolute;
          inset: 0;
          background: ${TOKENS.bone};
          transform-origin: left;
          transform: scaleX(0);
        }
        .uni-carousel-dot.is-active .uni-carousel-dot-fill {
          animation: uni-dot-fill 5s linear both;
        }
        @keyframes uni-dot-fill {
          0%   { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }

        /* Progress bar at bottom edge */
        .uni-carousel-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: rgba(244, 239, 230, 0.15);
          z-index: 10;
          overflow: hidden;
        }
        .uni-carousel-progress-fill {
          height: 100%;
          background: ${TOKENS.bone};
          opacity: 0.7;
          transform-origin: left;
          animation: uni-progress 5s linear both;
        }
        @keyframes uni-progress {
          0%   { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .uni-hero-bg,
          .uni-hero-orb,
          .uni-hero-image img {
            animation: none !important;
          }
          .uni-anim-eyebrow,
          .uni-anim-divider,
          .uni-anim-lede,
          .uni-anim-ctas,
          .uni-h1-anim .uni-word,
          .uni-hero-image,
          .uni-hero-image-frame,
          .uni-hero-image-tag {
            animation-duration: 0.4s !important;
            animation-delay: 0s !important;
          }
        }

        /* Catalog filter */
        .uni-cat-filter {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: 56px;
        }
        .uni-cat-btn {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 11px 22px;
          border: 1px solid ${TOKENS.whisper};
          background: transparent;
          color: ${TOKENS.ink};
          cursor: pointer;
          transition: all 0.25s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .uni-cat-btn:hover { border-color: ${TOKENS.ink}; }
        .uni-cat-count { font-size: 11px; opacity: 0.6; }

        /* Product grid */
        .uni-product-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 36px;
          max-width: 1100px;
          margin: 0 auto;
        }
        .uni-card {
          background: ${TOKENS.pearl};
          display: flex;
          flex-direction: column;
          transition: transform 0.4s ease, box-shadow 0.4s ease;
        }
        .uni-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 18px 38px rgba(17,17,17,0.10);
        }
        .uni-card-img-wrap {
          position: relative;
          display: block;
          aspect-ratio: 1 / 1;
          overflow: hidden;
          background: ${TOKENS.whisper};
          text-decoration: none;
        }
        .uni-card-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          transition: transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .uni-card-badge {
          position: absolute;
          top: 14px;
          left: 14px;
          background: ${TOKENS.ink};
          color: ${TOKENS.bone};
          padding: 6px 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          font-weight: 500;
          z-index: 2;
        }
        .uni-card-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 24px;
          background: linear-gradient(to top, rgba(17,17,17,0.55), transparent 60%);
          transition: opacity 0.4s ease;
          z-index: 2;
          pointer-events: none;
        }
        .uni-card-overlay-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: ${TOKENS.whatsapp};
          color: ${TOKENS.pearl};
          padding: 11px 20px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .uni-card-body { padding: 24px; }
        .uni-card-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 6px;
        }
        .uni-card-name {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 22px;
          line-height: 1.15;
          letter-spacing: -0.01em;
          font-weight: 400;
          color: ${TOKENS.ink};
          margin: 0;
        }
        .uni-card-colors {
          margin-bottom: 18px;
          padding-top: 14px;
          border-top: 1px solid ${TOKENS.whisper};
        }
        .uni-card-colors-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: ${TOKENS.stone};
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .uni-card-colors-label strong {
          color: ${TOKENS.ink};
          font-weight: 500;
          letter-spacing: 0.04em;
          text-transform: none;
          font-size: 13px;
        }
        .uni-card-colors-count {
          margin-left: auto;
          font-size: 10px;
          color: ${TOKENS.stone};
        }
        .uni-card-swatches {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }
        .uni-swatch {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 1px solid ${TOKENS.whisper};
          display: inline-block;
          cursor: pointer;
          padding: 0;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          position: relative;
        }
        .uni-swatch:hover {
          transform: scale(1.12);
        }
        .uni-swatch.is-selected {
          box-shadow: 0 0 0 2px ${TOKENS.bone}, 0 0 0 4px ${TOKENS.ink};
        }
        .uni-card-swatch-more {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          color: ${TOKENS.stone};
          margin-left: 2px;
        }
        .uni-card-tagline {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          line-height: 1.5;
          color: ${TOKENS.stone};
          margin: 0 0 16px;
          min-height: 38px;
        }
        .uni-card-pricerow {
          display: flex;
          align-items: baseline;
          gap: 10px;
          margin-bottom: 16px;
        }
        .uni-card-price {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 18px;
          color: ${TOKENS.ink};
          font-weight: 500;
        }
        .uni-card-price-old {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: ${TOKENS.stone};
          text-decoration: line-through;
        }
        .uni-card-cta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px 18px;
          background: ${TOKENS.ink};
          color: ${TOKENS.pearl};
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          transition: background 0.3s ease;
        }
        .uni-card:hover .uni-card-cta { background: ${TOKENS.whatsapp}; }

        /* Manifesto (text-only) */
        /* ── Manifesto ── */
        .uni-manifesto {
          background: ${TOKENS.ink};
          color: ${TOKENS.bone};
          padding: 0;
          position: relative;
          overflow: hidden;
        }
        /* Subtle noise grain */
        .uni-manifesto-grain {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-size: 200px 200px;
        }
        /* Split layout */
        .uni-manifesto-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 640px;
          position: relative;
          z-index: 1;
        }
        /* LEFT photo column */
        .uni-manifesto-photo-col {
          position: relative;
          overflow: hidden;
        }
        .uni-manifesto-photo-wrap {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 540px;
        }
        .uni-manifesto-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          display: block;
          filter: brightness(0.88) contrast(1.04);
          transition: filter 0.6s ease, transform 0.9s cubic-bezier(0.2,0.8,0.2,1);
        }
        .uni-manifesto-photo-wrap:hover .uni-manifesto-photo {
          filter: brightness(0.95) contrast(1.02);
          transform: scale(1.03);
        }
        /* Floating location badge */
        .uni-manifesto-badge {
          position: absolute;
          bottom: 32px;
          left: 32px;
          background: rgba(17,17,17,0.72);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(229,222,207,0.18);
          padding: 14px 22px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .uni-manifesto-badge-num {
          font-family: 'Fraunces', Georgia, serif;
          font-style: italic;
          font-size: 22px;
          color: ${TOKENS.bone};
          line-height: 1;
        }
        .uni-manifesto-badge-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: ${TOKENS.whisper};
        }
        /* RIGHT text column */
        .uni-manifesto-text-col {
          padding: 80px 60px 80px 64px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
        }
        /* Giant decorative quote mark */
        .uni-manifesto-quote-mark {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 160px;
          line-height: 0.7;
          color: ${TOKENS.leatherDark};
          opacity: 0.4;
          margin-bottom: -24px;
          margin-left: -8px;
          user-select: none;
          pointer-events: none;
        }
        /* Main quote */
        .uni-manifesto-quote {
          font-family: 'Fraunces', Georgia, serif;
          font-size: clamp(26px, 3vw, 40px);
          line-height: 1.18;
          letter-spacing: -0.02em;
          font-weight: 400;
          color: ${TOKENS.bone};
          margin: 0 0 28px;
          border: none;
          padding: 0;
        }
        .uni-manifesto-quote em {
          font-style: italic;
          color: ${TOKENS.caramel};
        }
        .uni-manifesto-body {
          font-family: 'DM Sans', sans-serif;
          font-size: 16px;
          line-height: 1.72;
          color: ${TOKENS.whisper};
          margin: 0;
          max-width: 460px;
        }
        /* Horizontal rule */
        .uni-manifesto-rule {
          width: 100%;
          height: 1px;
          background: rgba(229,222,207,0.15);
          margin: 36px 0;
        }
        /* Stats row */
        .uni-manifesto-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          margin-bottom: 40px;
        }
        .uni-manifesto-stat {
          padding-right: 24px;
          border-right: 1px solid rgba(229,222,207,0.15);
        }
        .uni-manifesto-stat:last-child { border-right: none; padding-right: 0; padding-left: 24px; }
        .uni-manifesto-stat:not(:first-child):not(:last-child) { padding: 0 24px; }
        .uni-manifesto-stat-num {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 32px;
          font-style: italic;
          color: ${TOKENS.bone};
          line-height: 1;
          margin-bottom: 6px;
        }
        .uni-manifesto-stat-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${TOKENS.whisper};
          opacity: 0.75;
          line-height: 1.4;
        }
        /* CTA button */
        .uni-manifesto-cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 28px;
          background: ${TOKENS.bone};
          color: ${TOKENS.ink};
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-decoration: none;
          align-self: flex-start;
          transition: background 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
        }
        .uni-manifesto-cta:hover {
          background: ${TOKENS.pearl};
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(244,239,230,0.18);
        }
        /* Tablet */
        @media (max-width: 980px) {
          .uni-manifesto-layout { grid-template-columns: 1fr; }
          .uni-manifesto-photo-wrap { min-height: 340px; }
          .uni-manifesto-text-col { padding: 60px 24px; }
        }
        /* Mobile */
        @media (max-width: 600px) {
          .uni-manifesto-photo-wrap { min-height: 280px; }
          .uni-manifesto-text-col { padding: 48px 18px; }
          .uni-manifesto-quote-mark { font-size: 100px; }
          .uni-manifesto-stats { grid-template-columns: 1fr 1fr; gap: 20px; }
          .uni-manifesto-stat { border-right: none !important; padding: 0 !important; }
        }

        /* Location */
        .uni-location-section { background: ${TOKENS.bone}; }
        .uni-location-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 48px;
          align-items: stretch;
        }
        .uni-map-wrap {
          position: relative;
          aspect-ratio: 4 / 3;
          overflow: hidden;
          background: ${TOKENS.whisper};
          border: 1px solid ${TOKENS.whisper};
        }
        .uni-map-pill {
          position: absolute;
          bottom: 16px;
          right: 16px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: ${TOKENS.pearl};
          color: ${TOKENS.ink};
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          text-decoration: none;
          box-shadow: 0 8px 24px rgba(17,17,17,0.18);
          transition: transform 0.25s ease;
        }
        .uni-map-pill:hover { transform: translateY(-2px); }
        .uni-location-info {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .uni-location-tag {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: ${TOKENS.stone};
        }
        .uni-store-name {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 36px;
          line-height: 1.1;
          letter-spacing: -0.01em;
          font-weight: 400;
          color: ${TOKENS.ink};
          margin: 0 0 8px;
        }
        .uni-store-addr {
          font-family: 'DM Sans', sans-serif;
          font-size: 16px;
          line-height: 1.7;
          color: ${TOKENS.charcoal};
          margin-bottom: 32px;
        }
        .uni-store-cep {
          font-size: 13px;
          color: ${TOKENS.stone};
          margin-top: 4px;
        }
        .uni-store-hours {
          border-top: 1px solid ${TOKENS.whisper};
          border-bottom: 1px solid ${TOKENS.whisper};
          padding: 20px 0;
          margin-bottom: 32px;
        }
        .uni-store-hours-head {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: ${TOKENS.stone};
          margin-bottom: 8px;
        }
        .uni-store-hours-body {
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          color: ${TOKENS.ink};
        }
        .uni-location-ctas {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .uni-loc-btn-dark {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 24px;
          background: ${TOKENS.ink};
          color: ${TOKENS.bone};
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-decoration: none;
          transition: opacity 0.25s ease;
        }
        .uni-loc-btn-dark:hover { opacity: 0.85; }

        /* Footer */
        .uni-footer {
          background: ${TOKENS.ink};
          color: ${TOKENS.bone};
          padding: 60px 0 40px;
        }
        .uni-footer-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr;
          gap: 48px;
        }
        .uni-footer-blurb {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: ${TOKENS.whisper};
          margin-top: 20px;
          max-width: 320px;
        }
        .uni-footer-head {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: ${TOKENS.whisper};
          margin-bottom: 16px;
        }
        .uni-footer-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .uni-footer-link {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: ${TOKENS.bone};
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          text-decoration: none;
        }
        .uni-footer-store {
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          line-height: 1.7;
          color: ${TOKENS.bone};
        }
        .uni-footer-hours { color: ${TOKENS.whisper}; font-size: 13px; }
        .uni-footer-bottom {
          border-top: 1px solid ${TOKENS.charcoal};
          margin-top: 48px;
          padding-top: 24px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          color: ${TOKENS.whisper};
          text-align: center;
          letter-spacing: 0.05em;
        }

        /* Buttons */
        .uni-wa-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .uni-float-wa {
          position: fixed;
          bottom: 22px;
          right: 22px;
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: ${TOKENS.whatsapp};
          color: ${TOKENS.pearl};
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 24px rgba(37, 211, 102, 0.45);
          z-index: 100;
          text-decoration: none;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .uni-float-wa:hover {
          transform: scale(1.06);
          box-shadow: 0 8px 28px rgba(37, 211, 102, 0.55);
        }

        /* Tablet */
        @media (max-width: 980px) {
          .uni-product-grid { grid-template-columns: repeat(2, 1fr); gap: 24px; }
          .uni-location-grid { grid-template-columns: 1fr; gap: 32px; }
          .uni-footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
          .uni-section, .uni-manifesto { padding: 70px 0; }
        }

        /* Mobile */
        @media (max-width: 600px) {
          .uni-container { padding: 0 18px; }
          .uni-hero { padding: 70px 0 60px; }
          .uni-product-grid { grid-template-columns: 1fr; gap: 24px; }
          .uni-lifestyle-bullets { grid-template-columns: 1fr; gap: 24px; }
          .uni-footer-grid { grid-template-columns: 1fr; gap: 32px; }
          .uni-header-cta-label { display: none; }
          .uni-section, .uni-manifesto { padding: 56px 0; }
          .uni-cat-filter { justify-content: flex-start; overflow-x: auto; flex-wrap: nowrap; padding-bottom: 8px; }
          .uni-cat-btn { flex-shrink: 0; }
        }
      `}</style>

      <Header />
      <Hero />
      <Catalog />
      <Manifesto />
      <Location />
      <Footer />
      <FloatingWA />
    </div>
  );
}
