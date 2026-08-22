/**
 * Column detection for the spreadsheet importer (client-safe: the mapping UI
 * runs in the browser).
 *
 * The Seller Center export changes shape between markets and categories, so
 * nothing here is hardcoded to one template — we guess, show the guess in the
 * mapping step, and let the admin correct it before anything is created.
 */

export type ColumnMapping = {
  name: string | null;
  description: string | null;
  price: string | null;
  /** May be several columns ("Imagem 1", "Imagem 2", …) or a single one. */
  images: string[];
};

const NAME_PATTERNS = [
  /nome\s*do\s*produto/i,
  /product\s*name/i,
  /^nome$/i,
  /^name$/i,
  /t[íi]tulo/i,
];
const DESCRIPTION_PATTERNS = [/descri[çc][ãa]o/i, /description/i];
const PRICE_PATTERNS = [
  /pre[çc]o\s*de\s*venda/i,
  /^pre[çc]o$/i,
  /pre[çc]o/i,
  /^price$/i,
  /price/i,
  /valor/i,
];
const IMAGE_PATTERNS = [/imagem/i, /image/i, /foto/i, /photo/i];

/** Best-effort mapping for a set of headers. Nulls mean "couldn't tell". */
export function guessColumns(headers: string[]): ColumnMapping {
  return {
    name: firstMatch(headers, NAME_PATTERNS),
    description: firstMatch(headers, DESCRIPTION_PATTERNS),
    price: firstMatch(headers, PRICE_PATTERNS),
    images: headers.filter((h) => IMAGE_PATTERNS.some((p) => p.test(h))),
  };
}

/** Patterns are ordered by specificity — the first one that hits wins. */
function firstMatch(headers: string[], patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const hit = headers.find((h) => pattern.test(h));
    if (hit) return hit;
  }
  return null;
}

/**
 * "R$ 89,90" / "89,90" / "89.90" / "1.234,56" → 89.9 / 1234.56.
 * Returns null for anything that isn't a usable number.
 */
export function parsePrice(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d.,-]/g, '').trim();
  if (!cleaned) return null;

  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');

  // Whichever separator comes last is the decimal one; the other is thousands.
  let normalized: string;
  if (lastComma > lastDot) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    normalized = cleaned.replace(/,/g, '');
  } else {
    normalized = cleaned;
  }

  const value = Number(normalized);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

/**
 * Pulls image URLs out of the mapped columns. One cell may hold several URLs
 * (comma, semicolon or newline separated), which is how some exports do it.
 */
export function extractImageUrls(
  row: Record<string, string>,
  columns: string[],
): string[] {
  const urls: string[] = [];
  for (const column of columns) {
    const cell = row[column];
    if (!cell) continue;
    for (const piece of cell.split(/[\s,;]+/)) {
      const url = piece.trim();
      if (/^https?:\/\//i.test(url) && !urls.includes(url)) urls.push(url);
    }
  }
  return urls;
}

/** "Bolsa Matelassê" → "bolsamatelasse", for duplicate detection. */
export function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}
