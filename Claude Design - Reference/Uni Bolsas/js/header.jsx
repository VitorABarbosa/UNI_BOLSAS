/* =====================================================================
   PROMO STRIP + HEADER + MOBILE MENU
   ===================================================================== */
function PromoStrip() {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="uni-promo-strip" role="region" aria-label="Promoção">
      <div className="uni-promo-strip-inner">
        <span>Primeira compra</span>
        <em>5% OFF</em>
        <span>com o cupom</span>
        <span className="uni-promo-strip-cup">UNI5</span>
        <button className="uni-promo-strip-close" onClick={() => setOpen(false)} aria-label="Fechar promoção">
          <CloseIcon size={14} />
        </button>
      </div>
    </div>
  );
}

function Header({ onOpenMenu }) {
  return (
    <header className="uni-header" id="top">
      <div className="uni-header-inner">
        <Logo size={22} />
        <nav className="uni-header-nav" aria-label="Navegação principal">
          <a href="#catalogo" className="uni-header-link">Catálogo</a>
          <a href="#atacado" className="uni-header-link">Atacado</a>
          <a href="#visite"  className="uni-header-link">Visite</a>
        </nav>
        <div className="uni-header-right">
          <a href={waGeneral} className="uni-header-cta" target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon size={14} />
            <span>WhatsApp</span>
          </a>
          <button className="uni-header-menu-btn" onClick={onOpenMenu} aria-label="Abrir menu">
            <MenuIcon />
          </button>
        </div>
      </div>
    </header>
  );
}

function MobileMenu({ onClose }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  const close = () => onClose();
  return (
    <div className="uni-mobile-menu" role="dialog" aria-modal="true">
      <div className="uni-mobile-menu-head">
        <Logo size={22} />
        <button onClick={close} className="uni-promo-strip-close" style={{ position: "static", color: TOKENS.ink, transform: "none" }} aria-label="Fechar menu">
          <CloseIcon size={20} />
        </button>
      </div>
      <div className="uni-mobile-menu-links">
        <a href="#catalogo" onClick={close} className="uni-mobile-menu-link">Cat<em>á</em>logo</a>
        <a href="#atacado"  onClick={close} className="uni-mobile-menu-link">At<em>a</em>cado</a>
        <a href="#visite"   onClick={close} className="uni-mobile-menu-link">V<em>i</em>site a loja</a>
        <a href="#faq"      onClick={close} className="uni-mobile-menu-link">F<em>A</em>Q</a>
      </div>
      <div style={{ marginTop: "auto" }}>
        <WhatsAppButton href={waGeneral} variant="dark" full>Falar pelo WhatsApp</WhatsAppButton>
      </div>
    </div>
  );
}

window.PromoStrip = PromoStrip;
window.Header = Header;
window.MobileMenu = MobileMenu;
