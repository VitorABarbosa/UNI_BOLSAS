import 'server-only';
import ExcelJS from 'exceljs';

/**
 * Reads a product spreadsheet (the Seller Center export) into plain rows.
 *
 * Accepts .xlsx and .csv because the export format differs by market, and
 * because "salvar como CSV" is the first thing anyone does when a file won't
 * open. Everything comes back as strings — the mapping step decides what each
 * column means.
 */

export type SheetData = {
  headers: string[];
  rows: Record<string, string>[];
  /** Rows dropped because the file is longer than we import in one go. */
  truncated: number;
};

/** One import shouldn't run for an hour: photos are downloaded per product. */
export const MAX_ROWS = 500;

/** How far down we look for the real header row (exports add title banners). */
const HEADER_SCAN_DEPTH = 10;

export async function parseSheet(file: File): Promise<SheetData> {
  const isCsv =
    file.name.toLowerCase().endsWith('.csv') ||
    file.type === 'text/csv' ||
    file.type === 'application/csv';

  const matrix = isCsv
    ? parseCsv(await file.text())
    : await parseXlsx(await file.arrayBuffer());

  return toRows(matrix);
}

async function parseXlsx(buffer: ArrayBuffer): Promise<string[][]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('A planilha não tem nenhuma aba');

  const matrix: string[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const values: string[] = [];
    // ExcelJS row values are 1-indexed with a leading hole at [0].
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      values[colNumber - 1] = cellText(cell.value);
    });
    matrix.push(Array.from(values, (v) => v ?? ''));
  });
  return matrix;
}

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    // Rich text, hyperlinks and formula results arrive as objects.
    if ('text' in value && typeof value.text === 'string') return value.text.trim();
    if ('result' in value) return cellText(value.result as ExcelJS.CellValue);
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join('').trim();
    }
    if ('hyperlink' in value && typeof value.hyperlink === 'string') {
      return value.hyperlink;
    }
  }
  return '';
}

/**
 * Minimal RFC4180 reader with delimiter sniffing — Excel in pt-BR writes
 * semicolons, everything else writes commas.
 */
function parseCsv(text: string): string[][] {
  const content = text.replace(/^\ufeff/, ''); // strip the BOM Excel writes
  const firstLine = content.slice(0, content.indexOf('\n') + 1 || undefined);
  const delimiter =
    (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0)
      ? ';'
      : ',';

  const matrix: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];

    if (quoted) {
      if (char === '"') {
        if (content[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field.trim());
      field = '';
    } else if (char === '\n') {
      row.push(field.trim());
      matrix.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field.trim());
    matrix.push(row);
  }

  return matrix;
}

/**
 * Turns the raw grid into keyed rows. The header is the densest row among the
 * first few — exports like to open with a title or an instructions banner.
 */
function toRows(matrix: string[][]): SheetData {
  const candidates = matrix.slice(0, HEADER_SCAN_DEPTH);
  if (candidates.length === 0) {
    throw new Error('A planilha está vazia');
  }

  let headerIndex = 0;
  let best = -1;
  candidates.forEach((row, index) => {
    const filled = row.filter((cell) => cell.trim() !== '').length;
    if (filled > best) {
      best = filled;
      headerIndex = index;
    }
  });

  const rawHeaders = matrix[headerIndex] ?? [];
  const headers = rawHeaders.map((header, index) =>
    header.trim() === '' ? `Coluna ${index + 1}` : header.trim(),
  );

  const dataRows = matrix
    .slice(headerIndex + 1)
    .filter((row) => row.some((cell) => cell.trim() !== ''));

  const rows = dataRows.slice(0, MAX_ROWS).map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = (row[index] ?? '').trim();
    });
    return record;
  });

  return { headers, rows, truncated: Math.max(0, dataRows.length - MAX_ROWS) };
}
