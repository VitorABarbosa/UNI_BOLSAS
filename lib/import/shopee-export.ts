import 'server-only';
import ExcelJS from 'exceljs';
import { toColor, toSize, type ImportedColor } from './color-map';

/**
 * Reader for the Shopee Seller Center "Editar em Massa" exports.
 *
 * The Center splits a catalogue across templates, so an import needs more
 * than one file. We take whichever ones the admin uploads and join them by
 * "ID do Produto":
 *
 *   basic_info  → nome e descrição            (obrigatório: sem ele não há produto)
 *   media_info  → categoria, fotos, foto por cor
 *   sales_info  → uma linha POR VARIAÇÃO, com preço e estoque
 *
 * Every sheet has the same preamble: row 1 holds Shopee's internal keys, row 2
 * a metadata line whose first cell names the template, row 3 the human header,
 * rows 4-6 the filling instructions. Real data starts at row 7.
 */

const TEMPLATE_MARKER_ROW = 2;
const DATA_START_ROW = 7;

/** Column positions, from the templates (they are fixed per template). */
const BASIC = { id: 1, name: 3, description: 4 } as const;
const MEDIA = { id: 1, category: 4, coverImage: 5, firstImage: 6, lastImage: 13,
  variationName: 16, firstOption: 17 } as const;
const SALES = { id: 1, name: 2, variation: 4, price: 7, stock: 9 } as const;

export type SheetKind = 'basic_info' | 'media_info' | 'sales_info';

export type ProductDraft = {
  shopeeId: string;
  name: string;
  description: string | null;
  /** Shopee's own category string, e.g. "100095 - Women Bags/Crossbody…". */
  shopeeCategory: string | null;
  /** Cover first, then the extra photos, in the seller's order. */
  imageUrls: string[];
  /** Recognized colour variations, each with its own photo when Shopee has one. */
  colors: (ImportedColor & { imageUrl: string | null })[];
  /** Sizes found packed into variation names ("Preto,grande"). */
  sizes: string[];
  /** Lowest price across variations, in BRL. */
  price: number | null;
  /** Variation labels that aren't colours ("kit com 2") — reported, not imported. */
  ignoredVariations: string[];
};

export type ShopeeExport = {
  drafts: ProductDraft[];
  /** Which templates were recognized among the uploaded files. */
  kinds: SheetKind[];
  /** Products dropped because an earlier row has the same name. */
  duplicates: string[];
  /** Files we couldn't recognize as a Shopee export. */
  unknownFiles: string[];
};

/** True when the file carries a Shopee mass-update template marker. */
export async function isShopeeExport(file: File): Promise<boolean> {
  try {
    return (await readKind(file)) !== null;
  } catch {
    return false;
  }
}

export async function parseShopeeExport(files: File[]): Promise<ShopeeExport> {
  const sheets = new Map<SheetKind, string[][]>();
  const unknownFiles: string[] = [];

  for (const file of files) {
    const parsed = await readSheet(file);
    if (!parsed) {
      unknownFiles.push(file.name);
      continue;
    }
    sheets.set(parsed.kind, parsed.rows);
  }

  const basic = sheets.get('basic_info');
  if (!basic) {
    throw new Error(
      'Falta o arquivo de Informações básicas — é dele que vêm nome e descrição.',
    );
  }

  const media = indexById(sheets.get('media_info') ?? [], MEDIA.id);
  const salesByProduct = groupById(sheets.get('sales_info') ?? [], SALES.id);

  const drafts: ProductDraft[] = [];
  const duplicates: string[] = [];
  const seenNames = new Set<string>();

  for (const row of basic) {
    const shopeeId = cell(row, BASIC.id);
    const name = cell(row, BASIC.name);
    if (!shopeeId || !name) continue;

    const key = normalizeName(name);
    if (seenNames.has(key)) {
      duplicates.push(name);
      continue;
    }
    seenNames.add(key);

    const mediaRow = media.get(shopeeId);
    const salesRows = salesByProduct.get(shopeeId) ?? [];

    drafts.push({
      shopeeId,
      name,
      description: cell(row, BASIC.description) || null,
      shopeeCategory: mediaRow ? cell(mediaRow, MEDIA.category) || null : null,
      imageUrls: mediaRow ? readImages(mediaRow) : [],
      ...readVariations(salesRows, mediaRow),
      price: readPrice(salesRows),
    });
  }

  return { drafts, kinds: [...sheets.keys()], duplicates, unknownFiles };
}

/** Cover photo first, then "Imagem do produto 1..8". */
function readImages(row: string[]): string[] {
  const urls = [cell(row, MEDIA.coverImage)];
  for (let col = MEDIA.firstImage; col <= MEDIA.lastImage; col += 1) {
    urls.push(cell(row, col));
  }
  return urls.filter((url) => /^https?:\/\//i.test(url));
}

/**
 * Colours come from the sales sheet (one row per variation) and their photos
 * from the media sheet, which lists the same options as
 * "Opção N de nome" / "Opção N de imagem" pairs.
 */
function readVariations(
  salesRows: string[][],
  mediaRow: string[] | undefined,
): Pick<ProductDraft, 'colors' | 'sizes' | 'ignoredVariations'> {
  const optionImages = mediaRow ? readOptionImages(mediaRow) : new Map<string, string>();

  const colors: ProductDraft['colors'] = [];
  const sizes: string[] = [];
  const ignoredVariations: string[] = [];

  for (const row of salesRows) {
    const label = cell(row, SALES.variation);
    if (!label) continue;

    const size = toSize(label);
    if (size && !sizes.includes(size)) sizes.push(size);

    const color = toColor(label);
    if (!color) {
      if (!ignoredVariations.includes(label)) ignoredVariations.push(label);
      continue;
    }
    if (colors.some((c) => c.name === color.name)) continue;

    colors.push({
      ...color,
      imageUrl: optionImages.get(normalizeName(label)) ?? null,
    });
  }

  return { colors, sizes, ignoredVariations };
}

/** "Opção 1 de nome" / "Opção 1 de imagem" → { nome normalizado: url }. */
function readOptionImages(row: string[]): Map<string, string> {
  const images = new Map<string, string>();
  for (let col = MEDIA.firstOption; col < row.length; col += 2) {
    const name = cell(row, col);
    const url = cell(row, col + 1);
    if (name && /^https?:\/\//i.test(url)) images.set(normalizeName(name), url);
  }
  return images;
}

/** Cheapest variation — what the storefront quotes as "a partir de". */
function readPrice(salesRows: string[][]): number | null {
  const prices = salesRows
    .map((row) => Number(cell(row, SALES.price).replace(',', '.')))
    .filter((value) => Number.isFinite(value) && value > 0);
  return prices.length > 0 ? Math.min(...prices) : null;
}

async function readSheet(
  file: File,
): Promise<{ kind: SheetKind; rows: string[][] } | null> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const sheet = workbook.worksheets[0];
  if (!sheet) return null;

  const kind = kindFromSheet(sheet);
  if (!kind) return null;

  const rows: string[][] = [];
  for (let r = DATA_START_ROW; r <= sheet.rowCount; r += 1) {
    const row = sheet.getRow(r);
    const values: string[] = [];
    for (let c = 1; c <= sheet.columnCount; c += 1) {
      values[c - 1] = cellText(row.getCell(c).value);
    }
    if (values.some((value) => value !== '')) rows.push(values);
  }
  return { kind, rows };
}

async function readKind(file: File): Promise<SheetKind | null> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const sheet = workbook.worksheets[0];
  return sheet ? kindFromSheet(sheet) : null;
}

function kindFromSheet(sheet: ExcelJS.Worksheet): SheetKind | null {
  const marker = cellText(sheet.getRow(TEMPLATE_MARKER_ROW).getCell(1).value);
  return marker === 'basic_info' || marker === 'media_info' || marker === 'sales_info'
    ? marker
    : null;
}

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    if ('text' in value && typeof value.text === 'string') return value.text.trim();
    if ('result' in value) return cellText(value.result as ExcelJS.CellValue);
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join('').trim();
    }
    if ('hyperlink' in value && typeof value.hyperlink === 'string') return value.hyperlink;
  }
  return '';
}

function cell(row: string[], column: number): string {
  return (row[column - 1] ?? '').trim();
}

function indexById(rows: string[][], idColumn: number): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const row of rows) {
    const id = cell(row, idColumn);
    if (id && !index.has(id)) index.set(id, row);
  }
  return index;
}

function groupById(rows: string[][], idColumn: number): Map<string, string[][]> {
  const groups = new Map<string, string[][]>();
  for (const row of rows) {
    const id = cell(row, idColumn);
    if (!id) continue;
    groups.set(id, [...(groups.get(id) ?? []), row]);
  }
  return groups;
}

function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}
