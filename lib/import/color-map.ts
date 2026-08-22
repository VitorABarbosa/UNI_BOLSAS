/**
 * Colour vocabulary for the importer (client-safe).
 *
 * Sellers type variation names by hand, so the same colour arrives as
 * "Vinho", "vinho", "marom" or "Marrom Unitaria", and some variations aren't
 * colours at all ("kit com 2", "Preto,grande"). We recognize the colour words
 * we know, keep the seller's own label as the swatch name, and skip whatever
 * has no colour in it — a wrong swatch on the storefront is worse than none.
 */

/** Extends lib/content/color-palette.ts with the words the exports use. */
const COLOR_HEX: Record<string, string> = {
  preto: '#0F0F0F',
  preta: '#0F0F0F',
  branco: '#FFFFFF',
  branca: '#FFFFFF',
  offwhite: '#EFE9DC',
  bege: '#D9C3A5',
  beje: '#D9C3A5',
  nude: '#C9A98C',
  caramelo: '#A47551',
  camel: '#A47551',
  marrom: '#6B4326',
  marom: '#6B4326',
  chocolate: '#4A2C1A',
  taupe: '#8B7D6F',
  cinza: '#7A7C80',
  prata: '#C0C0C4',
  dourado: '#C9A227',
  vinho: '#5C1A2B',
  vermelho: '#A82238',
  vermelha: '#A82238',
  rosa: '#E5B5B0',
  rose: '#E8C4C0',
  pink: '#C73C7E',
  roxo: '#6B4A7A',
  lilas: '#B9A7CC',
  azul: '#2B4A7A',
  marinho: '#1A2B4A',
  jeans: '#4A6B8A',
  verde: '#4A6B4A',
  amarelo: '#E0B341',
  laranja: '#D2691E',
};

export type ImportedColor = { name: string; hex: string };

/**
 * "Marrom Escuro" → {name: 'Marrom Escuro', hex: '#6B4326'}
 * "azul com branco" → keeps the label, takes the first colour it recognizes
 * "kit com 2" → null (not a colour)
 * "Preto,grande" → {name: 'Preto', …} — the size half is dropped
 */
export function toColor(rawVariation: string): ImportedColor | null {
  const raw = rawVariation.trim();
  if (!raw) return null;

  // Some sellers pack the size into the same field: "Preto,grande".
  const label = raw.split(',')[0]?.trim() ?? raw;

  const words = normalize(label).split(/\s+/).filter(Boolean);
  // Try the whole label glued together first, so "off white" and "Off-White"
  // both land on `offwhite`; then fall back to the individual words.
  const hex =
    COLOR_HEX[words.join('')] ?? words.map((word) => COLOR_HEX[word]).find(Boolean);
  if (!hex) return null;

  return { name: titleCase(label), hex };
}

/** The size half of "Preto,grande", when there is one. */
export function toSize(rawVariation: string): string | null {
  const parts = rawVariation.split(',');
  if (parts.length < 2) return null;
  const size = parts.slice(1).join(',').trim();
  return size ? titleCase(size) : null;
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ');
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((word) => (word ? word[0]!.toUpperCase() + word.slice(1) : word))
    .join(' ')
    .trim();
}
