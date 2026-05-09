/* =====================================================================
   MANIFESTO + SOCIAL + FAQ + LOCATION + NEWSLETTER + FOOTER
   ===================================================================== */
function Manifesto() {
  const photos = [IMG.b12_branding_hero || IMG.matelasse_caramelo, IMG.lartlune_caramelo, IMG.sport_marinho_open].filter(Boolean);
  const [pIdx, setPIdx] = useState(0);
  useEffect(() => {
    if (photos.length < 2) return;
    const t = setInterval(() => setPIdx((i) => (i + 1) % photos.length), 6000);
    return () => clearInterval(t);
  }, [photos.length]);
  return (
    <section className="uni-manifesto" id="manifesto">
      <div className="uni-manifesto-grain" />
      <div className="uni-manifesto-layout">
        <div className="uni-manifesto-photo-col">
          <div className="uni-manifesto-photo-wrap">
            {photos.map((src, i) => (
              <img key={i}
                src={src}
                alt="Atelier Uni Bolsas"
                className={"uni-manifesto-photo " + (i === pIdx ? "is-active" : "is-inactive")}
              />
            ))}
            <div className="uni-manifesto-badge">
              <span className="uni-manifesto-badge-num">+10 anos</span>
              <span className="uni-manifesto-badge-sub">Brás · São Paulo</span>
            </div>
          </div>
        </div>
        <div className="uni-manifesto-text-col">
          <Reveal>
            <div className="uni-eyebrow uni-eyebrow-wide uni-eyebrow-light" style={{ color: TOKENS.caramel }}>O manifesto</div>
            <div className="uni-manifesto-quote-mark" aria-hidden="true">“</div>
            <blockquote className="uni-manifesto-quote">
              A gente acredita em <em>bolsa que dura</em> e em atendimento que olha no olho — mesmo quando o olho é uma tela.
            </blockquote>
            <p className="uni-manifesto-body">
              Começamos em 2014 com um stand pequeno, atendendo uma a uma. Hoje somos uma família que escolhe cada fornecedor pessoalmente, testa cada modelo no dia a dia, e segue respondendo lojistas e clientes finais pelo mesmo WhatsApp.
            </p>
            <p className="uni-manifesto-body">
              O Brás é nossa origem e nossa escola: aqui se aprende a vender bem porque se aprende a comprar bem. Nossa curadoria é de quem está dentro do mercado há tempo suficiente pra reconhecer um bom couro pelo cheiro e um bom fornecedor pela palavra.
            </p>
          </Reveal>
          <div className="uni-manifesto-rule" />
          <Reveal>
            <div className="uni-manifesto-timeline" aria-label="Linha do tempo Uni Bolsas">
              {TIMELINE.map((t, i) => (
                <div key={t.year} className="uni-tl-cell">
                  <div className="uni-tl-year">{t.year}</div>
                  <div className="uni-tl-label">{t.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
          <a className="uni-manifesto-cta" href={waGeneral} target="_blank" rel="noopener noreferrer">
            Conheça a equipe <ArrowIcon size={14} />
          </a>
        </div>
      </div>
    </section>
  );
}

function Social() {
  const igPhotos = [
    IMG.matelasse_caramelo, IMG.mochila_preto_branco_lifestyle || IMG.mochila_preto_branco,
    IMG.lartlune_offwhite, IMG.fitness_pink, IMG.sport_marinho_front,
    IMG.matelasse_offwhite,
  ];
  return (
    <section className="uni-social" id="social">
      <div className="uni-container">
        <Reveal>
          <div className="uni-social-head">
            <div>
              <div className="uni-eyebrow uni-eyebrow-wide">Visto por aí</div>
              <h2 className="uni-h2">No <em>feed</em> e na rua.</h2>
            </div>
            <a className="uni-social-handle" href={`https://instagram.com/${INSTAGRAM}`} target="_blank" rel="noopener noreferrer">
              <InstagramIcon size={16} />
              @{INSTAGRAM}
            </a>
          </div>
        </Reveal>
        <Reveal>
          <div className="uni-ig-grid">
            {igPhotos.map((src, i) => (
              <a key={i} href={`https://instagram.com/${INSTAGRAM}`} target="_blank" rel="noopener noreferrer" className="uni-ig-item">
                <img src={src} alt={`Post ${i + 1} do Instagram Uni Bolsas`} loading="lazy" />
                <div className="uni-ig-overlay"><InstagramIcon size={28} color={TOKENS.bone} /></div>
              </a>
            ))}
          </div>
        </Reveal>
        <div className="uni-test-grid">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={i} delay={i * 100}>
              <figure className="uni-test-card">
                <blockquote className="uni-test-quote">{t.quote}</blockquote>
                <figcaption>
                  <div className="uni-test-name">{t.name}</div>
                  <div className="uni-test-role">{t.role}</div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [openIdx, setOpenIdx] = useState(0);
  return (
    <section className="uni-faq uni-section" id="faq">
      <div className="uni-container">
        <Reveal>
          <div className="uni-section-head">
            <div className="uni-eyebrow uni-eyebrow-wide">Perguntas que recebemos</div>
            <h2 className="uni-h2">Resp<em>o</em>stas curtas.</h2>
          </div>
        </Reveal>
        <div className="uni-faq-list">
          {FAQ.map((item, i) => {
            const open = openIdx === i;
            return (
              <Reveal key={i} delay={i * 40}>
                <div className={"uni-faq-item " + (open ? "is-open" : "")}>
                  <button className="uni-faq-q" onClick={() => setOpenIdx(open ? -1 : i)} aria-expanded={open}>
                    <span>{item.q}</span>
                    <span className="uni-faq-q-icon"><PlusIcon size={14} rotated={open} /></span>
                  </button>
                  <div className="uni-faq-a">{item.a}</div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Location() {
  return (
    <section className="uni-location-section uni-section" id="visite">
      <div className="uni-container">
        <Reveal>
          <div className="uni-section-head">
            <div className="uni-eyebrow uni-eyebrow-wide">Visite a loja</div>
            <h2 className="uni-h2">Estamos <em>no Brás.</em></h2>
            <p className="uni-section-lede">No coração comercial de São Paulo, no Shopping 900 — um quarteirão da Estação Brás.</p>
          </div>
        </Reveal>
        <div className="uni-location-grid">
          <Reveal>
            <div className="uni-map-wrap">
              <MapIllustration />
              <a className="uni-map-pill" href={STORE.mapsUrl} target="_blank" rel="noopener noreferrer">
                <PinIcon size={14} /> Abrir no Maps
              </a>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="uni-location-info">
              <div className="uni-location-tag"><PinIcon size={14} color={TOKENS.leatherDark} /> Endereço</div>
              <h3 className="uni-store-name">{STORE.name}</h3>
              <div className="uni-store-addr">
                {STORE.street}<br />
                {STORE.district} · {STORE.city}
                <div className="uni-store-cep">CEP {STORE.cep}</div>
              </div>
              <div className="uni-store-hours">
                <div className="uni-store-hours-head"><ClockIcon size={12} color={TOKENS.leatherDark} /> Horário</div>
                <div className="uni-store-hours-body">{STORE.hours}</div>
              </div>
              <div className="uni-store-transport">
                <div className="uni-store-transport-head">Como chegar</div>
                {STORE.transport.map((t) => (
                  <div key={t.mode} className="uni-store-transport-row">
                    <strong>{t.mode}</strong>
                    <span>{t.time}</span>
                  </div>
                ))}
              </div>
              <div className="uni-location-ctas">
                <a className="uni-loc-btn uni-loc-btn-dark" href={STORE.directionsUrl} target="_blank" rel="noopener noreferrer">
                  <ArrowIcon size={14} /> Como chegar
                </a>
                <a className="uni-loc-btn uni-loc-btn-waze" href={STORE.wazeUrl} target="_blank" rel="noopener noreferrer">
                  <WazeIcon size={16} /> Salvar no Waze
                </a>
                <WhatsAppButton href={waLink("Olá! Quero confirmar atendimento na loja física do Shopping 900 hoje.")} variant="outline" full>
                  Confirmar atendimento
                </WhatsAppButton>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Newsletter() {
  const [type, setType] = useState("retail"); // wholesale | retail
  const [phone, setPhone] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    window.open(waNewsletter(type, phone), "_blank", "noopener,noreferrer");
  };
  return (
    <section className="uni-newsletter">
      <div className="uni-container">
        <div className="uni-news-inner">
          <div>
            <h2 className="uni-news-h">Receba <em>lançamentos</em> antes.</h2>
            <p className="uni-news-sub">Avisamos pelo WhatsApp quando o mix vira — sem flood, sem corrente, sem lista de transmissão. Escolha o seu canal e a gente segmenta.</p>
          </div>
          <form className="uni-news-form" onSubmit={handleSubmit}>
            <div className="uni-news-toggle" role="tablist" aria-label="Tipo de cadastro">
              <button type="button" role="tab" aria-selected={type === "wholesale"} className={"uni-news-toggle-btn " + (type === "wholesale" ? "is-active" : "")} onClick={() => setType("wholesale")}>Sou lojista</button>
              <button type="button" role="tab" aria-selected={type === "retail"} className={"uni-news-toggle-btn " + (type === "retail" ? "is-active" : "")} onClick={() => setType("retail")}>Cliente final</button>
            </div>
            <div className="uni-news-input-row">
              <input
                type="tel"
                inputMode="tel"
                className="uni-news-input"
                placeholder="(11) 9 0000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                aria-label="Seu WhatsApp"
              />
              <button type="submit" className="uni-news-submit">
                Quero receber <ArrowIcon size={12} />
              </button>
            </div>
            <span className="uni-news-tip">Abre o WhatsApp pra confirmar · não criamos cadastro automático.</span>
          </form>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="uni-footer">
      <div className="uni-container">
        <div className="uni-footer-grid">
          <div>
            <Logo size={28} color={TOKENS.bone} />
            <p className="uni-footer-blurb">
              Bolsas, mochilas e malas. Atacado e varejo direto do nosso stand no Shopping 900, Brás · SP. <span style={{ color: TOKENS.caramel }}>Desde 2014.</span>
            </p>
          </div>
          <div>
            <div className="uni-footer-head">Catálogo</div>
            <div className="uni-footer-list">
              <a href="#catalogo" className="uni-footer-link">Bolsas</a>
              <a href="#catalogo" className="uni-footer-link">Mochilas</a>
              <a href="#catalogo" className="uni-footer-link">Esportivas</a>
              <a href="#catalogo" className="uni-footer-link">Kits</a>
            </div>
          </div>
          <div>
            <div className="uni-footer-head">Loja física</div>
            <div className="uni-footer-store">
              {STORE.street}<br />
              {STORE.district} · {STORE.city}<br />
              <span className="uni-footer-hours">{STORE.hoursShort}</span>
            </div>
          </div>
          <div>
            <div className="uni-footer-head">Fale com a gente</div>
            <div className="uni-footer-list">
              <a href={waGeneral} className="uni-footer-link" target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon size={14} /> WhatsApp
              </a>
              <a href={`https://instagram.com/${INSTAGRAM}`} className="uni-footer-link" target="_blank" rel="noopener noreferrer">
                <InstagramIcon size={14} /> @{INSTAGRAM}
              </a>
              <a href={waLink("Olá! Tenho interesse em trabalhar com vocês — vim pelo site.")} className="uni-footer-link" target="_blank" rel="noopener noreferrer">
                <HeartIcon size={12} color={TOKENS.caramel} /> Trabalhe conosco
              </a>
            </div>
          </div>
        </div>
        <div className="uni-footer-bottom">
          <span>© 2026 Uni Bolsas · CNPJ {STORE.cnpj}</span>
          <span>Feito com cuidado em São Paulo · Brás</span>
        </div>
      </div>
    </footer>
  );
}

window.Manifesto = Manifesto;
window.Social = Social;
window.FAQSection = FAQSection;
window.Location = Location;
window.Newsletter = Newsletter;
window.Footer = Footer;
