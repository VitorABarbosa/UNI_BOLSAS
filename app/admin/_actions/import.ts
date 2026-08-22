'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { createProductFromSource } from '@/lib/catalog/create-product';
import { parseSheet, MAX_ROWS, type SheetData } from '@/lib/import/sheet';
import {
  extractImageUrls,
  guessColumns,
  normalizeName,
  parsePrice,
  type ColumnMapping,
} from '@/lib/import/columns';

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type ParsedSheet = SheetData & { guess: ColumnMapping };

/**
 * Step 1: read the uploaded file and hand back its rows plus a guess at what
 * each column means. Nothing is written yet — the admin confirms the mapping
 * first.
 */
export async function parseImportFile(
  formData: FormData,
): Promise<ActionResult<ParsedSheet>> {
  await requireAdmin();

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Selecione um arquivo .xlsx ou .csv' };
  }

  try {
    const sheet = await parseSheet(file);
    if (sheet.rows.length === 0) {
      return { ok: false, error: 'Não encontrei nenhuma linha de produto no arquivo' };
    }
    return { ok: true, data: { ...sheet, guess: guessColumns(sheet.headers) } };
  } catch (err) {
    console.error('[import] leitura da planilha falhou:', err);
    return {
      ok: false,
      error: err instanceof Error ? `Não consegui ler o arquivo: ${err.message}` : String(err),
    };
  }
}

const MappingSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  price: z.string().nullable(),
  images: z.array(z.string()),
});

const ImportSchema = z.object({
  rows: z.array(z.record(z.string(), z.string())).min(1).max(MAX_ROWS),
  mapping: MappingSchema,
  categoryId: z.string().uuid(),
  /** Rows whose product name already exists are skipped when true. */
  skipExisting: z.boolean(),
  /** Rewrites the price of the products that were skipped as duplicates. */
  updateExistingPrice: z.boolean(),
});

export type ImportReport = {
  created: number;
  skipped: number;
  priceUpdated: number;
  failed: number;
  /** First few problems, to show without flooding the screen. */
  problems: string[];
};

/** Step 2: create one product per row, downloading the photos it points at. */
export async function importSheetRows(
  input: z.infer<typeof ImportSchema>,
): Promise<ActionResult<ImportReport>> {
  await requireAdmin();
  const parsed = ImportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Dados inválidos' };

  const { rows, mapping, categoryId, skipExisting, updateExistingPrice } = parsed.data;
  const supabase = createAdminClient();

  const { data: existing, error: existingError } = await supabase
    .from('products')
    .select('id, name, price_retail');
  if (existingError) return { ok: false, error: existingError.message };

  const byName = new Map(
    (existing ?? []).map((p) => [normalizeName(p.name), p]),
  );

  const report: ImportReport = {
    created: 0,
    skipped: 0,
    priceUpdated: 0,
    failed: 0,
    problems: [],
  };
  const slugs: string[] = [];

  for (const row of rows) {
    const name = (row[mapping.name] ?? '').trim();
    if (!name) {
      report.failed += 1;
      addProblem(report, 'Linha sem nome de produto');
      continue;
    }

    const price = mapping.price ? parsePrice(row[mapping.price]) : null;
    const duplicate = byName.get(normalizeName(name));

    if (duplicate && skipExisting) {
      report.skipped += 1;
      if (updateExistingPrice && price !== null && Number(duplicate.price_retail) !== price) {
        const { error } = await supabase
          .from('products')
          .update({ price_retail: price })
          .eq('id', duplicate.id);
        if (error) addProblem(report, `${name}: preço não atualizado (${error.message})`);
        else report.priceUpdated += 1;
      }
      continue;
    }

    try {
      const created = await createProductFromSource({
        name,
        description: mapping.description ? row[mapping.description]?.trim() || null : null,
        price,
        categoryId,
        imageUrls: extractImageUrls(row, mapping.images),
      });
      report.created += 1;
      slugs.push(created.slug);
      // Keep the map current so two identical rows in the same file don't
      // both get created.
      byName.set(normalizeName(name), {
        id: created.productId,
        name,
        price_retail: price ?? 0,
      });
      if (created.imageCount === 0) {
        addProblem(report, `${name}: criado sem fotos`);
      }
    } catch (err) {
      report.failed += 1;
      addProblem(report, `${name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  revalidatePath('/');
  revalidatePath('/sitemap.xml');
  revalidatePath('/admin/produtos');
  for (const slug of slugs) revalidatePath(`/produtos/${slug}`);

  return { ok: true, data: report };
}

const MAX_PROBLEMS = 10;

function addProblem(report: ImportReport, message: string) {
  if (report.problems.length < MAX_PROBLEMS) report.problems.push(message);
}
