/* =====================================================================
   IMG — placeholders editoriais (SVG data URIs)
   Toda peça é desenhada como silhueta sobre fundo bone, tom da cor real.
   Quando o lojista trocar pelas fotos reais, basta substituir as URLs.
   ===================================================================== */
(function () {
  const BONE = "#F4EFE6";
  const BONE_LIGHT = "#FAF7F1";
  const BONE_SHADOW = "#E8E1D2";
  const INK = "#111111";

  // Sombra de base sob a peça
  const shadow = (cx = 200, cy = 360, rx = 120, ry = 12) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#000" opacity="0.08"/>`;

  // Wrapper SVG editorial: fundo bone com leve gradiente, vinheta, label discreto
  function frame(content, label = "", sublabel = "") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="bg" cx="50%" cy="42%" r="65%">
          <stop offset="0%" stop-color="${BONE_LIGHT}"/>
          <stop offset="100%" stop-color="${BONE_SHADOW}"/>
        </radialGradient>
        <linearGradient id="hi" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fff" stop-opacity="0.35"/>
          <stop offset="60%" stop-color="#fff" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="lo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#000" stop-opacity="0"/>
          <stop offset="100%" stop-color="#000" stop-opacity="0.18"/>
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#bg)"/>
      ${content}
      ${label ? `<text x="200" y="380" font-family="DM Sans, sans-serif" font-size="9" letter-spacing="3" fill="${INK}" opacity="0.32" text-anchor="middle">${label}</text>` : ""}
      ${sublabel ? `<text x="200" y="392" font-family="Fraunces, serif" font-style="italic" font-size="10" fill="${INK}" opacity="0.42" text-anchor="middle">${sublabel}</text>` : ""}
    </svg>`;
  }

  function dataUri(svg) {
    // Use encodeURIComponent so unicode survives
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg).replace(/'/g, "%27");
  }

  /* ---- Silhuetas por tipo ---- */

  // Bolsa quadrada acolchoada (Matelassê) — formato chunky com chain
  function matelasse(hex) {
    const body = `
      ${shadow(200, 332, 110, 9)}
      <!-- chain handle -->
      <path d="M 130 175 Q 200 110 270 175" fill="none" stroke="#C9A55B" stroke-width="3" stroke-dasharray="4 5" opacity="0.85"/>
      <!-- body -->
      <rect x="118" y="170" width="164" height="155" rx="10" fill="${hex}"/>
      <rect x="118" y="170" width="164" height="155" rx="10" fill="url(#hi)"/>
      <rect x="118" y="170" width="164" height="155" rx="10" fill="url(#lo)"/>
      <!-- diamond stitching -->
      <g stroke="#000" stroke-opacity="0.18" stroke-width="0.7" fill="none">
        <line x1="160" y1="170" x2="118" y2="220"/>
        <line x1="200" y1="170" x2="118" y2="260"/>
        <line x1="240" y1="170" x2="118" y2="300"/>
        <line x1="282" y1="180" x2="146" y2="325"/>
        <line x1="282" y1="220" x2="190" y2="325"/>
        <line x1="282" y1="260" x2="234" y2="325"/>
        <line x1="240" y1="170" x2="282" y2="220"/>
        <line x1="200" y1="170" x2="282" y2="260"/>
        <line x1="160" y1="170" x2="282" y2="300"/>
        <line x1="146" y1="180" x2="282" y2="325"/>
        <line x1="118" y1="220" x2="234" y2="325"/>
        <line x1="118" y1="260" x2="190" y2="325"/>
      </g>
      <!-- gold clasp -->
      <rect x="190" y="218" width="20" height="14" rx="2" fill="#C9A55B"/>
      <rect x="190" y="218" width="20" height="14" rx="2" fill="url(#hi)"/>
    `;
    return dataUri(frame(body, "MATELASSÊ MINI", "22 × 17 × 10 cm"));
  }

  // Kit transversal + carteira
  function lartlune(hex) {
    const body = `
      ${shadow(200, 340, 130, 10)}
      <!-- big bag handle -->
      <path d="M 145 175 Q 195 105 245 175" fill="none" stroke="${hex}" stroke-width="6"/>
      <path d="M 152 178 Q 195 118 238 178" fill="none" stroke="#000" stroke-opacity="0.15" stroke-width="1"/>
      <!-- big bag body -->
      <path d="M 130 175 L 270 175 L 282 320 Q 282 332 270 332 L 130 332 Q 118 332 118 320 Z" fill="${hex}"/>
      <path d="M 130 175 L 270 175 L 282 320 Q 282 332 270 332 L 130 332 Q 118 332 118 320 Z" fill="url(#hi)"/>
      <path d="M 130 175 L 270 175 L 282 320 Q 282 332 270 332 L 130 332 Q 118 332 118 320 Z" fill="url(#lo)"/>
      <!-- front flap -->
      <path d="M 150 175 L 250 175 L 245 245 Q 245 252 238 252 L 162 252 Q 155 252 155 245 Z" fill="#000" fill-opacity="0.12"/>
      <!-- clasp -->
      <circle cx="200" cy="248" r="5" fill="#C9A55B"/>
      <!-- companion wallet bottom-right -->
      <rect x="285" y="285" width="58" height="42" rx="3" fill="${hex}" opacity="0.9"/>
      <rect x="285" y="285" width="58" height="42" rx="3" fill="url(#hi)"/>
      <line x1="285" y1="298" x2="343" y2="298" stroke="#000" stroke-opacity="0.18" stroke-width="0.8"/>
    `;
    return dataUri(frame(body, "KIT L&apos;ART&amp;LUNE", "Bolsa + carteira"));
  }

  // Mochila bicolor
  function mochila(hex, accent = "#FFFFFF") {
    const body = `
      ${shadow(200, 348, 100, 9)}
      <!-- straps -->
      <path d="M 155 165 Q 170 130 195 130 Q 220 130 230 165" fill="none" stroke="${hex}" stroke-width="9" stroke-linecap="round" opacity="0.85"/>
      <path d="M 155 165 Q 170 130 195 130 Q 220 130 230 165" fill="none" stroke="#000" stroke-opacity="0.15" stroke-width="1.2"/>
      <!-- top handle loop -->
      <path d="M 188 142 Q 200 128 212 142" fill="none" stroke="${hex}" stroke-width="3"/>
      <!-- body -->
      <rect x="135" y="160" width="130" height="180" rx="22" fill="${hex}"/>
      <rect x="135" y="160" width="130" height="180" rx="22" fill="url(#hi)"/>
      <rect x="135" y="160" width="130" height="180" rx="22" fill="url(#lo)"/>
      <!-- bicolor front pocket -->
      <path d="M 150 240 L 250 240 L 250 320 Q 250 328 242 328 L 158 328 Q 150 328 150 320 Z" fill="${accent}" opacity="0.92"/>
      <path d="M 150 240 L 250 240" stroke="#000" stroke-opacity="0.12" stroke-width="0.8"/>
      <!-- zipper accent -->
      <line x1="158" y1="245" x2="242" y2="245" stroke="${hex}" stroke-width="1" stroke-dasharray="2 2" opacity="0.5"/>
      <circle cx="244" cy="245" r="3" fill="${hex}"/>
    `;
    return dataUri(frame(body, "MOCHILA MINI BICOLOR", "22 × 27 cm"));
  }

  // Bolsa fitness — duffel pequeno
  function fitness(hex) {
    const body = `
      ${shadow(200, 322, 130, 10)}
      <!-- handles -->
      <path d="M 165 195 Q 170 155 195 155 Q 220 155 225 195" fill="none" stroke="${hex}" stroke-width="6"/>
      <!-- duffel body -->
      <path d="M 90 220 Q 90 195 115 195 L 285 195 Q 310 195 310 220 L 305 295 Q 305 318 280 318 L 120 318 Q 95 318 95 295 Z" fill="${hex}"/>
      <path d="M 90 220 Q 90 195 115 195 L 285 195 Q 310 195 310 220 L 305 295 Q 305 318 280 318 L 120 318 Q 95 318 95 295 Z" fill="url(#hi)"/>
      <path d="M 90 220 Q 90 195 115 195 L 285 195 Q 310 195 310 220 L 305 295 Q 305 318 280 318 L 120 318 Q 95 318 95 295 Z" fill="url(#lo)"/>
      <!-- center zipper -->
      <line x1="105" y1="220" x2="295" y2="220" stroke="#000" stroke-opacity="0.25" stroke-width="1"/>
      <line x1="105" y1="220" x2="295" y2="220" stroke="#fff" stroke-opacity="0.2" stroke-width="0.6" stroke-dasharray="3 3"/>
      <circle cx="200" cy="220" r="4" fill="#C9A55B"/>
      <!-- side strap -->
      <rect x="85" y="245" width="6" height="40" fill="${hex}" opacity="0.7"/>
    `;
    return dataUri(frame(body, "BOLSA FITNESS", "39 × 27 cm"));
  }

  // Mala sport (maior, tipo viagem)
  function sport(hex, open = false) {
    if (open) {
      // versão aberta — vista de cima, mala dividida
      const body = `
        ${shadow(200, 320, 150, 11)}
        <path d="M 70 200 Q 70 175 95 175 L 305 175 Q 330 175 330 200 L 325 285 Q 325 308 300 308 L 100 308 Q 75 308 75 285 Z" fill="${hex}"/>
        <path d="M 70 200 Q 70 175 95 175 L 305 175 Q 330 175 330 200 L 325 285 Q 325 308 300 308 L 100 308 Q 75 308 75 285 Z" fill="url(#hi)"/>
        <line x1="200" y1="178" x2="200" y2="305" stroke="#000" stroke-opacity="0.28" stroke-width="1.4"/>
        <rect x="100" y="220" width="80" height="60" rx="3" fill="#000" fill-opacity="0.18"/>
        <rect x="220" y="220" width="80" height="60" rx="3" fill="#000" fill-opacity="0.18"/>
        <text x="200" y="155" font-family="DM Sans, sans-serif" font-size="9" letter-spacing="2.5" fill="${INK}" opacity="0.4" text-anchor="middle">VISTA INTERNA</text>
      `;
      return dataUri(frame(body, "MALA SPORT", "60 × 30 cm · aberta"));
    }
    const body = `
      ${shadow(200, 318, 150, 11)}
      <path d="M 165 195 Q 170 155 195 155 Q 220 155 225 195" fill="none" stroke="${hex}" stroke-width="7"/>
      <path d="M 70 220 Q 70 195 95 195 L 305 195 Q 330 195 330 220 L 325 305 Q 325 322 308 322 L 92 322 Q 75 322 75 305 Z" fill="${hex}"/>
      <path d="M 70 220 Q 70 195 95 195 L 305 195 Q 330 195 330 220 L 325 305 Q 325 322 308 322 L 92 322 Q 75 322 75 305 Z" fill="url(#hi)"/>
      <path d="M 70 220 Q 70 195 95 195 L 305 195 Q 330 195 330 220 L 325 305 Q 325 322 308 322 L 92 322 Q 75 322 75 305 Z" fill="url(#lo)"/>
      <line x1="85" y1="225" x2="315" y2="225" stroke="#000" stroke-opacity="0.28" stroke-width="1.2"/>
      <line x1="85" y1="225" x2="315" y2="225" stroke="#fff" stroke-opacity="0.2" stroke-width="0.6" stroke-dasharray="3 3"/>
      <circle cx="200" cy="225" r="4.5" fill="#C9A55B"/>
      <rect x="65" y="248" width="8" height="42" fill="${hex}" opacity="0.7"/>
      <rect x="327" y="248" width="8" height="42" fill="${hex}" opacity="0.7"/>
    `;
    return dataUri(frame(body, "MALA SPORT", "60 × 30 cm"));
  }

  // Hero / lifestyle / branding — mood maior, mais editorial
  function lifestyle(hex, label) {
    const body = `
      <rect width="400" height="400" fill="#E8DFCE"/>
      <rect x="0" y="240" width="400" height="160" fill="#D7CDB8" opacity="0.6"/>
      <!-- person silhouette -->
      <ellipse cx="200" cy="120" rx="32" ry="38" fill="#3A2E20" opacity="0.85"/>
      <path d="M 160 158 Q 160 150 168 148 L 232 148 Q 240 150 240 158 L 250 280 Q 250 295 235 295 L 165 295 Q 150 295 150 280 Z" fill="#3A2E20" opacity="0.85"/>
      <!-- bag in hand -->
      <path d="M 252 200 Q 252 195 257 195 L 295 195 Q 300 195 300 200 L 298 248 Q 298 254 292 254 L 260 254 Q 254 254 254 248 Z" fill="${hex}"/>
      <path d="M 260 195 Q 263 178 276 178 Q 289 178 292 195" fill="none" stroke="${hex}" stroke-width="2.5"/>
      <!-- shadow under person -->
      <ellipse cx="200" cy="305" rx="68" ry="6" fill="#000" opacity="0.12"/>
      <text x="32" y="372" font-family="Fraunces, serif" font-style="italic" font-size="12" fill="${INK}" opacity="0.4">${label || "Editorial"}</text>
      <text x="368" y="372" font-family="DM Sans, sans-serif" font-size="9" letter-spacing="3" fill="${INK}" opacity="0.32" text-anchor="end">UNI · 2026</text>
    `;
    return dataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">${body}</svg>`);
  }

  // Promo 5% off — banner editorial
  function promo() {
    const body = `
      <rect width="400" height="400" fill="#111111"/>
      <text x="200" y="155" font-family="Fraunces, serif" font-size="100" font-style="italic" fill="#F4EFE6" text-anchor="middle" letter-spacing="-4">5%</text>
      <text x="200" y="195" font-family="DM Sans, sans-serif" font-size="11" letter-spacing="6" fill="#C9934A" text-anchor="middle">OFF · PRIMEIRA COMPRA</text>
      <line x1="120" y1="220" x2="280" y2="220" stroke="#C9934A" stroke-width="0.8" opacity="0.6"/>
      <text x="200" y="262" font-family="Fraunces, serif" font-size="22" fill="#F4EFE6" text-anchor="middle">cupom <tspan font-style="italic">UNI5</tspan></text>
      <text x="200" y="320" font-family="DM Sans, sans-serif" font-size="10" letter-spacing="4" fill="#E5DECF" text-anchor="middle" opacity="0.7">VÁLIDO NA PRIMEIRA COMPRA</text>
      <text x="200" y="338" font-family="DM Sans, sans-serif" font-size="10" letter-spacing="4" fill="#E5DECF" text-anchor="middle" opacity="0.5">ATACADO E VAREJO · BRÁS SP</text>
    `;
    return dataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">${body}</svg>`);
  }

  // Branding hero — editorial, vertical
  function brandHero() {
    const body = `
      <rect width="400" height="500" fill="#E8DFCE"/>
      <rect x="0" y="0" width="400" height="60" fill="#D7CDB8"/>
      <!-- backdrop arch -->
      <path d="M 60 500 L 60 230 Q 60 130 200 130 Q 340 130 340 230 L 340 500 Z" fill="#F4EFE6"/>
      <!-- model bust -->
      <ellipse cx="200" cy="200" rx="48" ry="55" fill="#5A4534"/>
      <path d="M 145 252 Q 145 244 154 242 L 246 242 Q 255 244 255 252 L 270 420 Q 272 440 252 440 L 148 440 Q 128 440 130 420 Z" fill="#3A2E20"/>
      <!-- bag held -->
      <path d="M 268 295 Q 268 290 274 290 L 322 290 Q 328 290 328 295 L 326 360 Q 326 368 318 368 L 278 368 Q 270 368 270 360 Z" fill="#8B5A3C"/>
      <path d="M 278 290 Q 282 268 298 268 Q 314 268 318 290" fill="none" stroke="#C9A55B" stroke-width="2.5" stroke-dasharray="3 4"/>
      <!-- editorial type -->
      <text x="32" y="44" font-family="Fraunces, serif" font-size="14" font-style="italic" fill="#111" letter-spacing="-0.5">Coleção · 2026</text>
      <text x="368" y="44" font-family="DM Sans, sans-serif" font-size="9" letter-spacing="4" fill="#111" text-anchor="end" opacity="0.6">UNI BOLSAS</text>
      <text x="32" y="478" font-family="Fraunces, serif" font-style="italic" font-size="11" fill="#111" opacity="0.55">elegância que acompanha seu ritmo</text>
    `;
    return dataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">${body}</svg>`);
  }

  // Logo wordmark
  function logo() {
    const body = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 56">
        <text x="0" y="40" font-family="Fraunces, serif" font-size="38" font-weight="500" fill="#111" letter-spacing="-1">uni</text>
        <text x="68" y="40" font-family="Fraunces, serif" font-size="38" font-style="italic" font-weight="400" fill="#8B5A3C" letter-spacing="-1">bolsas</text>
        <line x1="0" y1="48" x2="220" y2="48" stroke="#111" stroke-width="0.8" opacity="0.4"/>
        <text x="0" y="55" font-family="DM Sans, sans-serif" font-size="6" letter-spacing="3" fill="#111" opacity="0.55">ATACADO · VAREJO · BRÁS SP</text>
      </svg>
    `;
    return dataUri(body);
  }

  // Atelier / equipe — para manifesto carousel
  function atelier(seed) {
    const palettes = [
      ["#D8C9AD", "#8B5A3C", "Atelier"],
      ["#C9B393", "#6B4326", "Curadoria"],
      ["#E8DFCE", "#5C1A2B", "Loja"],
    ];
    const [bg, accent, label] = palettes[seed % 3];
    const body = `
      <rect width="400" height="400" fill="${bg}"/>
      <rect x="40" y="60" width="320" height="260" fill="${accent}" opacity="0.18"/>
      ${seed === 0 ? `
        <!-- bags on a rack -->
        <line x1="60" y1="100" x2="340" y2="100" stroke="#3A2E20" stroke-width="3"/>
        <g fill="${accent}">
          <path d="M 90 110 L 140 110 L 145 200 Q 145 210 135 210 L 95 210 Q 85 210 85 200 Z"/>
          <path d="M 165 110 L 215 110 L 220 200 Q 220 210 210 210 L 170 210 Q 160 210 160 200 Z" opacity="0.85"/>
          <path d="M 240 110 L 290 110 L 295 200 Q 295 210 285 210 L 245 210 Q 235 210 235 200 Z" opacity="0.7"/>
        </g>
      ` : seed === 1 ? `
        <!-- person at table -->
        <rect x="40" y="240" width="320" height="100" fill="#3A2E20" opacity="0.5"/>
        <ellipse cx="200" cy="180" rx="38" ry="42" fill="#5A4534"/>
        <path d="M 150 230 L 250 230 L 260 320 L 140 320 Z" fill="#3A2E20"/>
        <rect x="170" y="270" width="60" height="40" fill="${accent}"/>
      ` : `
        <!-- storefront -->
        <rect x="80" y="80" width="240" height="240" fill="#F4EFE6" stroke="${accent}" stroke-width="2"/>
        <rect x="100" y="100" width="100" height="200" fill="${accent}" opacity="0.2"/>
        <rect x="220" y="100" width="100" height="200" fill="${accent}" opacity="0.2"/>
        <text x="200" y="60" font-family="Fraunces, serif" font-style="italic" font-size="22" fill="#111" text-anchor="middle">uni bolsas</text>
        <text x="200" y="350" font-family="DM Sans, sans-serif" font-size="9" letter-spacing="4" fill="#111" text-anchor="middle" opacity="0.6">SHOPPING 900 · BRÁS</text>
      `}
      <text x="32" y="380" font-family="Fraunces, serif" font-style="italic" font-size="11" fill="#111" opacity="0.4">${label}</text>
    `;
    return dataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">${body}</svg>`);
  }

  // Instagram grid placeholders
  function igPost(seed) {
    const variants = [
      `<rect width="400" height="400" fill="#D8C9AD"/>
       <path d="M 130 150 L 270 150 L 280 320 L 120 320 Z" fill="#5C1A2B"/>
       <path d="M 150 150 Q 155 110 200 110 Q 245 110 250 150" fill="none" stroke="#5C1A2B" stroke-width="5"/>`,
      `<rect width="400" height="400" fill="#3A2E20"/>
       <ellipse cx="200" cy="160" rx="42" ry="48" fill="#C9A98C"/>
       <path d="M 140 230 L 260 230 L 270 380 L 130 380 Z" fill="#F4EFE6"/>
       <rect x="240" y="280" width="50" height="60" fill="#8B5A3C"/>`,
      `<rect width="400" height="400" fill="#E8DFCE"/>
       <rect x="80" y="80" width="240" height="240" fill="#F4EFE6" stroke="#8B5A3C" stroke-width="1.5"/>
       <path d="M 150 200 L 250 200 L 256 290 Q 256 300 246 300 L 154 300 Q 144 300 144 290 Z" fill="#0F0F0F"/>
       <rect x="190" y="240" width="20" height="14" rx="2" fill="#C9A55B"/>`,
      `<rect width="400" height="400" fill="#C9B393"/>
       <path d="M 100 180 Q 100 155 125 155 L 275 155 Q 300 155 300 180 L 295 280 Q 295 300 275 300 L 125 300 Q 105 300 105 280 Z" fill="#1A2B4A"/>
       <line x1="115" y1="195" x2="285" y2="195" stroke="#C9A55B" stroke-width="2"/>`,
      `<rect width="400" height="400" fill="#5A4534"/>
       <rect x="40" y="40" width="320" height="320" fill="#F4EFE6" opacity="0.92"/>
       <text x="200" y="180" font-family="Fraunces, serif" font-style="italic" font-size="60" fill="#5C1A2B" text-anchor="middle">olha</text>
       <text x="200" y="240" font-family="Fraunces, serif" font-style="italic" font-size="60" fill="#5C1A2B" text-anchor="middle">essa</text>`,
      `<rect width="400" height="400" fill="#D7CDB8"/>
       <path d="M 130 175 L 270 175 L 280 330 L 120 330 Z" fill="#A47551"/>
       <path d="M 150 175 Q 158 120 200 120 Q 242 120 250 175" fill="none" stroke="#A47551" stroke-width="6"/>
       <text x="40" y="40" font-family="Fraunces, serif" font-style="italic" font-size="14" fill="#111">novidade</text>`,
    ];
    return dataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">${variants[seed % variants.length]}</svg>`);
  }

  /* ---- IMG global ---- */
  window.IMG = {
    // Matelassê
    matelasse_preto:    matelasse("#0F0F0F"),
    matelasse_caramelo: matelasse("#A47551"),
    matelasse_vinho:    matelasse("#5C1A2B"),
    matelasse_offwhite: matelasse("#EFE9DC"),
    matelasse_nude:     matelasse("#C9A98C"),

    // Kit L'ART&LUNE
    lartlune_caramelo: lartlune("#A47551"),
    lartlune_offwhite: lartlune("#EFE9DC"),
    lartlune_preto:    lartlune("#0F0F0F"),
    lartlune_marinho:  lartlune("#1A2B4A"),
    lartlune_rosa:     lartlune("#E5B5B0"),
    lartlune_taupe:    lartlune("#8C7E72"),

    // Mochila bicolor
    mochila_preto_branco:           mochila("#0F0F0F", "#FFFFFF"),
    mochila_preto_branco_lifestyle: lifestyle("#0F0F0F", "Mini Bicolor"),
    mochila_marinho_branco:         mochila("#1A2B4A", "#FFFFFF"),
    mochila_cinza_branco:           mochila("#7A7C80", "#FFFFFF"),
    mochila_preto_pink:             mochila("#0F0F0F", "#FF1493"),
    mochila_marinho_pink:           mochila("#1A2B4A", "#FF1493"),

    // Bolsa Fitness
    fitness_grafite:  fitness("#3A3D40"),
    fitness_vermelho: fitness("#A82238"),
    fitness_pink:     fitness("#C73C7E"),
    fitness_marinho:  fitness("#1A2B4A"),
    fitness_preto:    fitness("#0F0F0F"),

    // Mala Sport
    sport_preto_front:   sport("#0F0F0F"),
    sport_preto_open:    sport("#0F0F0F", true),
    sport_marinho_front: sport("#1A2B4A"),
    sport_marinho_open:  sport("#1A2B4A", true),

    // Hero / branding
    b12_branding_hero: brandHero(),
    b13_promo_5off:    promo(),
    logo:              logo(),

    // Manifesto carousel
    atelier_1: atelier(0),
    atelier_2: atelier(1),
    atelier_3: atelier(2),

    // Instagram grid
    ig_1: igPost(0),
    ig_2: igPost(1),
    ig_3: igPost(2),
    ig_4: igPost(3),
    ig_5: igPost(4),
    ig_6: igPost(5),
  };
})();
