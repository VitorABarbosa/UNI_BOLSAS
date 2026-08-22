'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FileSpreadsheet, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatPriceBRL } from '@/lib/format';
import { extractImageUrls, parsePrice } from '@/lib/import/columns';
import {
  importSheetRows,
  parseImportFile,
  type ImportReport,
  type ParsedSheet,
} from '@/app/admin/_actions/import';

type Category = { id: string; label: string };

const NONE = 'none';
const PREVIEW_ROWS = 5;

export function SheetImporter({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const [sheet, setSheet] = useState<ParsedSheet | null>(null);
  const [fileName, setFileName] = useState('');
  const [nameCol, setNameCol] = useState('');
  const [descCol, setDescCol] = useState(NONE);
  const [priceCol, setPriceCol] = useState(NONE);
  const [imageCols, setImageCols] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [skipExisting, setSkipExisting] = useState(true);
  const [updateExistingPrice, setUpdateExistingPrice] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);

  const readFile = (file: File) => {
    setFileName(file.name);
    setReport(null);
    const formData = new FormData();
    formData.set('file', file);

    startTransition(async () => {
      const res = await parseImportFile(formData);
      if (!res.ok) {
        toast.error(res.error);
        setSheet(null);
        return;
      }
      setSheet(res.data);
      setNameCol(res.data.guess.name ?? res.data.headers[0] ?? '');
      setDescCol(res.data.guess.description ?? NONE);
      setPriceCol(res.data.guess.price ?? NONE);
      setImageCols(res.data.guess.images);
      toast.success(
        `${res.data.rows.length} linhas lidas` +
          (res.data.truncated > 0
            ? ` (${res.data.truncated} ficaram de fora do limite)`
            : ''),
      );
    });
  };

  const runImport = () => {
    if (!sheet || !nameCol || !categoryId) return;
    startTransition(async () => {
      const res = await importSheetRows({
        rows: sheet.rows,
        mapping: {
          name: nameCol,
          description: descCol === NONE ? null : descCol,
          price: priceCol === NONE ? null : priceCol,
          images: imageCols,
        },
        categoryId,
        skipExisting,
        updateExistingPrice,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setReport(res.data);
      toast.success(`${res.data.created} produtos criados`);
      router.refresh();
    });
  };

  const toggleImageCol = (header: string) => {
    setImageCols((prev) =>
      prev.includes(header) ? prev.filter((h) => h !== header) : [...prev, header],
    );
  };

  const preview = sheet?.rows.slice(0, PREVIEW_ROWS) ?? [];

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardContent className="space-y-4 p-6">
          <div>
            <h2 className="font-serif text-lg text-ink">1 · Escolha a planilha</h2>
            <p className="text-sm text-stone">
              O arquivo que o Seller Center da Shopee exporta (.xlsx) ou qualquer
              planilha salva em .csv. Nada é criado nesta etapa.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileInput}
              type="file"
              accept=".xlsx,.csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) readFile(file);
              }}
            />
            <Button disabled={pending} onClick={() => fileInput.current?.click()}>
              <Upload className="h-4 w-4" /> Escolher arquivo
            </Button>
            {fileName && (
              <span className="flex items-center gap-2 text-sm text-stone">
                <FileSpreadsheet className="h-4 w-4" />
                {fileName}
                {sheet && ` · ${sheet.rows.length} linhas`}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {sheet && (
        <>
          <Card>
            <CardContent className="space-y-4 p-6">
              <div>
                <h2 className="font-serif text-lg text-ink">
                  2 · Confira as colunas
                </h2>
                <p className="text-sm text-stone">
                  Chutei pelo nome do cabeçalho. Corrija o que estiver errado.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <ColumnPicker
                  label="Nome do produto"
                  value={nameCol}
                  headers={sheet.headers}
                  onChange={setNameCol}
                />
                <ColumnPicker
                  label="Descrição"
                  value={descCol}
                  headers={sheet.headers}
                  onChange={setDescCol}
                  optional
                />
                <ColumnPicker
                  label="Preço"
                  value={priceCol}
                  headers={sheet.headers}
                  onChange={setPriceCol}
                  optional
                />
                <div className="space-y-1">
                  <span className="text-xs text-stone">Categoria de destino</span>
                  <Select value={categoryId} onValueChange={(v) => setCategoryId(v as string)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs text-stone">
                  Colunas com URL de foto ({imageCols.length} marcadas)
                </span>
                <div className="flex flex-wrap gap-2">
                  {sheet.headers.map((header) => (
                    <button
                      key={header}
                      type="button"
                      onClick={() => toggleImageCol(header)}
                      className={
                        imageCols.includes(header)
                          ? 'rounded-full bg-leather px-3 py-1 text-xs text-pearl'
                          : 'rounded-full border border-whisper px-3 py-1 text-xs text-stone hover:border-leather/40'
                      }
                    >
                      {header}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-6 border-t border-whisper pt-4">
                <label className="flex items-center gap-2 text-sm text-stone">
                  <Switch checked={skipExisting} onCheckedChange={setSkipExisting} />
                  Pular produtos que já existem (pelo nome)
                </label>
                <label className="flex items-center gap-2 text-sm text-stone">
                  <Switch
                    checked={updateExistingPrice}
                    disabled={!skipExisting}
                    onCheckedChange={setUpdateExistingPrice}
                  />
                  Atualizar o preço dos que já existem
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <div>
                <h2 className="font-serif text-lg text-ink">3 · Prévia</h2>
                <p className="text-sm text-stone">
                  As {Math.min(PREVIEW_ROWS, sheet.rows.length)} primeiras linhas,
                  já do jeito que vão entrar no site.
                </p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Fotos</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((row, i) => {
                    const price = priceCol === NONE ? null : parsePrice(row[priceCol]);
                    const images = extractImageUrls(row, imageCols);
                    const description =
                      descCol === NONE ? '' : (row[descCol] ?? '');
                    return (
                      <TableRow key={i}>
                        <TableCell className="text-ink">
                          {row[nameCol] || (
                            <span className="text-destructive">sem nome</span>
                          )}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {price !== null ? formatPriceBRL(price) : '—'}
                        </TableCell>
                        <TableCell className="tabular-nums">{images.length}</TableCell>
                        <TableCell className="max-w-[380px] truncate text-xs text-stone">
                          {description || '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <Button
                disabled={pending || !nameCol || !categoryId}
                onClick={runImport}
              >
                Importar {sheet.rows.length} linhas
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {report && (
        <Card>
          <CardContent className="space-y-3 p-6">
            <h2 className="font-serif text-lg text-ink">Resultado</h2>
            <ul className="space-y-1 text-sm text-ink">
              <li>{report.created} produtos criados</li>
              {report.skipped > 0 && <li>{report.skipped} já existiam e foram pulados</li>}
              {report.priceUpdated > 0 && (
                <li>{report.priceUpdated} preços atualizados</li>
              )}
              {report.failed > 0 && (
                <li className="text-destructive">{report.failed} linhas falharam</li>
              )}
            </ul>
            {report.problems.length > 0 && (
              <ul className="space-y-1 rounded-md bg-bone-light p-3 text-xs text-stone">
                {report.problems.map((problem, i) => (
                  <li key={i}>· {problem}</li>
                ))}
              </ul>
            )}
            <p className="text-xs text-stone">
              Cores e tamanhos não vêm na planilha — abra cada produto em Produtos
              para completar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ColumnPicker({
  label,
  value,
  headers,
  onChange,
  optional = false,
}: {
  label: string;
  value: string;
  headers: string[];
  onChange: (value: string) => void;
  optional?: boolean;
}) {
  return (
    <div className="space-y-1">
      <span className="text-xs text-stone">{label}</span>
      <Select value={value} onValueChange={(v) => onChange(v as string)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Escolher coluna" />
        </SelectTrigger>
        <SelectContent>
          {optional && <SelectItem value={NONE}>Não importar</SelectItem>}
          {headers.map((header) => (
            <SelectItem key={header} value={header}>
              {header}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
