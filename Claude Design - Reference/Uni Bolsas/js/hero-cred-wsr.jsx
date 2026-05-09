/* =====================================================================
   HERO + CREDIBILITY STRIP + WHOLESALE-VS-RETAIL
   ===================================================================== */
function Hero() {
  const heroImg = (IMG.b12_branding_hero || IMG.matelasse_caramelo);
  const words = ["Bolsas", "que", "carregam", "estilo", <em key="e">e história.</em>];
  return (
    <section className="uni-hero" id="hero">
      <div className="uni-hero-bg" />
      <div className="uni-container">
        <div className="uni-hero-grid">
          {/* TEXT */}
          <div className="uni-hero-text-col">
            <div className="uni-hero-eyebrow-wrap">
              <span className="uni-hero-eyebrow-line" />
              <span className="uni-eyebrow uni-eyebrow-wide" style={{ margin: 0 }}>Coleção · 2026 · Brás · SP</span>
            </div>
            <div className="uni-hero-h1-wrap">
              <h1 className="uni-h1 uni-hero-h1">
                {words.map((w, i) => (
                  <React.Fragment key={i}>
                    <span className="uni-word" style={{ animationDelay: `${0.4 + i * 0.13}s` }}>{w}</span>
                    {i < words.length - 1 ? " " : ""}
                  </React.Fragment>
                ))}
              </h1>
            </div>
            <div className="uni-hero-divider" />
            <p className="uni-hero-lede">
              Catálogo curado de bolsas, mochilas e malas para o dia a dia, atendendo <strong style={{ fontWeight: 500, color: TOKENS.ink }}>atacado</strong> e <strong style={{ fontWeight: 500, color: TOKENS.ink }}>varejo</strong> direto do nosso stand no Shopping 900, no coração do Brás.
            </p>
            <div className="uni-hero-ctas">
              <WhatsAppButton href={waGeneral} variant="default">Falar com a gente</WhatsAppButton>
              <a className="uni-secondary-btn" href="#catalogo">
                Ver catálogo <ArrowIcon size={14} />
              </a>
            </div>
          </div>
          {/* IMAGE */}
          <div className="uni-hero-img-col">
            <div className="uni-hero-img-wrap">
              <img src={heroImg} alt="Composição editorial Uni Bolsas" className="uni-hero-img" />
            </div>
            <div className="uni-hero-badge-1">Coleção · 2026</div>
            <div className="uni-hero-badge-2">Atacado e Varejo</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CredibilityStrip() {
  return (
    <section className="uni-cred" aria-label="Credenciais">
      <div className="uni-container">
        <div className="uni-cred-grid">
          <Reveal className="uni-cred-cell" delay={0}>
            <div className="uni-cred-num">+<CountUp value={10} /><span className="mono-suffix">anos</span></div>
            <div className="uni-cred-label">no Brás</div>
          </Reveal>
          <Reveal className="uni-cred-cell" delay={120}>
            <div className="uni-cred-num">+<CountUp value={500} /></div>
            <div className="uni-cred-label">Modelos no catálogo</div>
          </Reveal>
          <Reveal className="uni-cred-cell" delay={240}>
            <div className="uni-cred-num">+<CountUp value={5000} /></div>
            <div className="uni-cred-label">Lojistas atendidas</div>
          </Reveal>
          <Reveal className="uni-cred-cell" delay={360}>
            <div className="uni-cred-num">2</div>
            <div className="uni-cred-label">Atacado · Varejo · Loja física</div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function WholesaleVsRetail() {
  return (
    <section className="uni-wsr uni-section" id="atacado">
      <div className="uni-container">
        <Reveal>
          <div className="uni-section-head">
            <div className="uni-eyebrow uni-eyebrow-wide">Pra cada perfil · um caminho</div>
            <h2 className="uni-h2">Atacado e <em>varejo</em>, sem mistura.</h2>
            <p className="uni-section-lede">Atendimento direto pelo WhatsApp em duas portas separadas — pra que ninguém espere por uma fila que não é a sua.</p>
          </div>
        </Reveal>
        <div className="uni-wsr-grid">
          <Reveal>
            <article className="uni-wsr-card is-wholesale">
              <div className="uni-wsr-card-icon"><StackBagsIcon size={56} color={TOKENS.leatherDark} /></div>
              <div className="uni-wsr-card-eyebrow">Pra sua loja</div>
              <h3 className="uni-wsr-card-h">Atacado <em>direto da fonte</em></h3>
              <ul className="uni-wsr-card-bullets">
                <li>Pedido mínimo a partir de <strong>6 peças</strong> por referência</li>
                <li>Tabela de preço enviada por WhatsApp · cadastro em 24h</li>
                <li>Pagamento em <strong>boleto, pix, cartão</strong> · prazo combinado por porte</li>
                <li>Frete por transportadora ou retirada no Brás</li>
                <li>PDF do mix sazonal pra repor estoque sem dor</li>
              </ul>
              <WhatsAppButton href={waWholesale} variant="dark" full>Receber tabela de atacado</WhatsAppButton>
            </article>
          </Reveal>
          <Reveal delay={120}>
            <article className="uni-wsr-card">
              <div className="uni-wsr-card-icon"><SingleBagIcon size={56} color={TOKENS.leatherDark} /></div>
              <div className="uni-wsr-card-eyebrow">Pra você</div>
              <h3 className="uni-wsr-card-h">Varejo <em>com calma</em></h3>
              <ul className="uni-wsr-card-bullets">
                <li>Atendimento <strong>1-pra-1</strong> com fotos extras pelo WhatsApp</li>
                <li>Retirada presencial no Shopping 900 · Brás</li>
                <li>Pix, cartão em até <strong>6x sem juros</strong>, débito e dinheiro</li>
                <li>Cupom <strong>UNI5</strong> · 5% OFF na primeira compra</li>
                <li>Troca em até 7 dias após o recebimento</li>
              </ul>
              <WhatsAppButton href={waRetail} full>Quero comprar uma bolsa</WhatsAppButton>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

window.Hero = Hero;
window.CredibilityStrip = CredibilityStrip;
window.WholesaleVsRetail = WholesaleVsRetail;
