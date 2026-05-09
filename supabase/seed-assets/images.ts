/**
 * SVG generators ported from `Claude Design - Reference/Uni Bolsas/js/images.js`.
 *
 * These return raw SVG strings (not data URIs) so the seed script can upload
 * them as files to Supabase Storage. Only the silhouettes used by the catalog
 * seed are ported here; the brand/marketing variants (promo, brandHero, logo,
 * atelier, igPost) live as static `/public` assets in Plano 02.
 */

const BONE_LIGHT = '#FAF7F1';
const BONE_SHADOW = '#E8E1D2';
const INK = '#111111';

function shadow(cx = 200, cy = 360, rx = 120, ry = 12): string {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#000" opacity="0.08"/>`;
}

function frame(content: string, label = '', sublabel = ''): string {
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
    ${label ? `<text x="200" y="380" font-family="DM Sans, sans-serif" font-size="9" letter-spacing="3" fill="${INK}" opacity="0.32" text-anchor="middle">${label}</text>` : ''}
    ${sublabel ? `<text x="200" y="392" font-family="Fraunces, serif" font-style="italic" font-size="10" fill="${INK}" opacity="0.42" text-anchor="middle">${sublabel}</text>` : ''}
  </svg>`;
}

export function matelasse(hex: string): string {
  const body = `
    ${shadow(200, 332, 110, 9)}
    <path d="M 130 175 Q 200 110 270 175" fill="none" stroke="#C9A55B" stroke-width="3" stroke-dasharray="4 5" opacity="0.85"/>
    <rect x="118" y="170" width="164" height="155" rx="10" fill="${hex}"/>
    <rect x="118" y="170" width="164" height="155" rx="10" fill="url(#hi)"/>
    <rect x="118" y="170" width="164" height="155" rx="10" fill="url(#lo)"/>
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
    <rect x="190" y="218" width="20" height="14" rx="2" fill="#C9A55B"/>
    <rect x="190" y="218" width="20" height="14" rx="2" fill="url(#hi)"/>
  `;
  return frame(body, 'MATELASSÊ MINI', '22 × 17 × 10 cm');
}

export function lartlune(hex: string): string {
  const body = `
    ${shadow(200, 340, 130, 10)}
    <path d="M 145 175 Q 195 105 245 175" fill="none" stroke="${hex}" stroke-width="6"/>
    <path d="M 152 178 Q 195 118 238 178" fill="none" stroke="#000" stroke-opacity="0.15" stroke-width="1"/>
    <path d="M 130 175 L 270 175 L 282 320 Q 282 332 270 332 L 130 332 Q 118 332 118 320 Z" fill="${hex}"/>
    <path d="M 130 175 L 270 175 L 282 320 Q 282 332 270 332 L 130 332 Q 118 332 118 320 Z" fill="url(#hi)"/>
    <path d="M 130 175 L 270 175 L 282 320 Q 282 332 270 332 L 130 332 Q 118 332 118 320 Z" fill="url(#lo)"/>
    <path d="M 150 175 L 250 175 L 245 245 Q 245 252 238 252 L 162 252 Q 155 252 155 245 Z" fill="#000" fill-opacity="0.12"/>
    <circle cx="200" cy="248" r="5" fill="#C9A55B"/>
    <rect x="285" y="285" width="58" height="42" rx="3" fill="${hex}" opacity="0.9"/>
    <rect x="285" y="285" width="58" height="42" rx="3" fill="url(#hi)"/>
    <line x1="285" y1="298" x2="343" y2="298" stroke="#000" stroke-opacity="0.18" stroke-width="0.8"/>
  `;
  return frame(body, 'KIT L&apos;ART&amp;LUNE', 'Bolsa + carteira');
}

export function mochila(hex: string, accent = '#FFFFFF'): string {
  const body = `
    ${shadow(200, 348, 100, 9)}
    <path d="M 155 165 Q 170 130 195 130 Q 220 130 230 165" fill="none" stroke="${hex}" stroke-width="9" stroke-linecap="round" opacity="0.85"/>
    <path d="M 155 165 Q 170 130 195 130 Q 220 130 230 165" fill="none" stroke="#000" stroke-opacity="0.15" stroke-width="1.2"/>
    <path d="M 188 142 Q 200 128 212 142" fill="none" stroke="${hex}" stroke-width="3"/>
    <rect x="135" y="160" width="130" height="180" rx="22" fill="${hex}"/>
    <rect x="135" y="160" width="130" height="180" rx="22" fill="url(#hi)"/>
    <rect x="135" y="160" width="130" height="180" rx="22" fill="url(#lo)"/>
    <path d="M 150 240 L 250 240 L 250 320 Q 250 328 242 328 L 158 328 Q 150 328 150 320 Z" fill="${accent}" opacity="0.92"/>
    <path d="M 150 240 L 250 240" stroke="#000" stroke-opacity="0.12" stroke-width="0.8"/>
    <line x1="158" y1="245" x2="242" y2="245" stroke="${hex}" stroke-width="1" stroke-dasharray="2 2" opacity="0.5"/>
    <circle cx="244" cy="245" r="3" fill="${hex}"/>
  `;
  return frame(body, 'MOCHILA MINI BICOLOR', '22 × 27 cm');
}

export function fitness(hex: string): string {
  const body = `
    ${shadow(200, 322, 130, 10)}
    <path d="M 165 195 Q 170 155 195 155 Q 220 155 225 195" fill="none" stroke="${hex}" stroke-width="6"/>
    <path d="M 90 220 Q 90 195 115 195 L 285 195 Q 310 195 310 220 L 305 295 Q 305 318 280 318 L 120 318 Q 95 318 95 295 Z" fill="${hex}"/>
    <path d="M 90 220 Q 90 195 115 195 L 285 195 Q 310 195 310 220 L 305 295 Q 305 318 280 318 L 120 318 Q 95 318 95 295 Z" fill="url(#hi)"/>
    <path d="M 90 220 Q 90 195 115 195 L 285 195 Q 310 195 310 220 L 305 295 Q 305 318 280 318 L 120 318 Q 95 318 95 295 Z" fill="url(#lo)"/>
    <line x1="105" y1="220" x2="295" y2="220" stroke="#000" stroke-opacity="0.25" stroke-width="1"/>
    <line x1="105" y1="220" x2="295" y2="220" stroke="#fff" stroke-opacity="0.2" stroke-width="0.6" stroke-dasharray="3 3"/>
    <circle cx="200" cy="220" r="4" fill="#C9A55B"/>
    <rect x="85" y="245" width="6" height="40" fill="${hex}" opacity="0.7"/>
  `;
  return frame(body, 'BOLSA FITNESS', '39 × 27 cm');
}

export function sport(hex: string, open = false): string {
  if (open) {
    const body = `
      ${shadow(200, 320, 150, 11)}
      <path d="M 70 200 Q 70 175 95 175 L 305 175 Q 330 175 330 200 L 325 285 Q 325 308 300 308 L 100 308 Q 75 308 75 285 Z" fill="${hex}"/>
      <path d="M 70 200 Q 70 175 95 175 L 305 175 Q 330 175 330 200 L 325 285 Q 325 308 300 308 L 100 308 Q 75 308 75 285 Z" fill="url(#hi)"/>
      <line x1="200" y1="178" x2="200" y2="305" stroke="#000" stroke-opacity="0.28" stroke-width="1.4"/>
      <rect x="100" y="220" width="80" height="60" rx="3" fill="#000" fill-opacity="0.18"/>
      <rect x="220" y="220" width="80" height="60" rx="3" fill="#000" fill-opacity="0.18"/>
      <text x="200" y="155" font-family="DM Sans, sans-serif" font-size="9" letter-spacing="2.5" fill="${INK}" opacity="0.4" text-anchor="middle">VISTA INTERNA</text>
    `;
    return frame(body, 'MALA SPORT', '60 × 30 cm · aberta');
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
  return frame(body, 'MALA SPORT', '60 × 30 cm');
}

export function lifestyle(hex: string, label: string): string {
  const body = `
    <rect width="400" height="400" fill="#E8DFCE"/>
    <rect x="0" y="240" width="400" height="160" fill="#D7CDB8" opacity="0.6"/>
    <ellipse cx="200" cy="120" rx="32" ry="38" fill="#3A2E20" opacity="0.85"/>
    <path d="M 160 158 Q 160 150 168 148 L 232 148 Q 240 150 240 158 L 250 280 Q 250 295 235 295 L 165 295 Q 150 295 150 280 Z" fill="#3A2E20" opacity="0.85"/>
    <path d="M 252 200 Q 252 195 257 195 L 295 195 Q 300 195 300 200 L 298 248 Q 298 254 292 254 L 260 254 Q 254 254 254 248 Z" fill="${hex}"/>
    <path d="M 260 195 Q 263 178 276 178 Q 289 178 292 195" fill="none" stroke="${hex}" stroke-width="2.5"/>
    <ellipse cx="200" cy="305" rx="68" ry="6" fill="#000" opacity="0.12"/>
    <text x="32" y="372" font-family="Fraunces, serif" font-style="italic" font-size="12" fill="${INK}" opacity="0.4">${label || 'Editorial'}</text>
    <text x="368" y="372" font-family="DM Sans, sans-serif" font-size="9" letter-spacing="3" fill="${INK}" opacity="0.32" text-anchor="end">UNI · 2026</text>
  `;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">${body}</svg>`;
}
