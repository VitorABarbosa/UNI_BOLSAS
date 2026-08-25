'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  applyCategoryOrganization,
  createMissingCategory,
  previewCategoryOrganization,
  type OrganizePreview,
} from '@/app/admin/_actions/organize';

/**
 * Organiza o catálogo por categoria a partir do nome do produto.
 *
 * O fluxo é sempre analisar → conferir → aplicar. Mover produto em massa é
 * difícil de desfazer, então a lista do que vai mudar aparece antes, com a
 * palavra que motivou cada troca, e cada linha pode ser desmarcada.
 */
export function CategoryOrganizer() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<OrganizePreview | null>(null);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());

  const analyze = () =>
    startTransition(async () => {
      const res = await previewCategoryOrganization();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setPreview(res.data);
      setSkipped(new Set());
      if (res.data.moves.length === 0 && res.data.missingCategories.length === 0) {
        toast.success('Tudo já está na categoria certa');
      }
    });

  const apply = () => {
    if (!preview) return;
    const moves = preview.moves
      .filter((m) => !skipped.has(m.productId))
      .map((m) => ({ productId: m.productId, toSlug: m.toSlug }));
    if (moves.length === 0) {
      toast.error('Nenhum produto selecionado');
      return;
    }
    startTransition(async () => {
      const res = await applyCategoryOrganization(moves);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        `${res.data.updated} produto(s) movido(s)` +
          (res.data.failed > 0 ? ` · ${res.data.failed} falhou(ram)` : ''),
      );
      setPreview(null);
      router.refresh();
    });
  };

  const createCategory = (slug: string) =>
    startTransition(async () => {
      const res = await createMissingCategory(slug);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Categoria "${res.data.label}" criada`);
      router.refresh();
      // Reanalisa: os produtos que dependiam dela agora têm destino.
      const again = await previewCategoryOrganization();
      if (again.ok) setPreview(again.data);
    });

  const toggle = (id: string) =>
    setSkipped((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectedCount = preview
    ? preview.moves.filter((m) => !skipped.has(m.productId)).length
    : 0;

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-lg text-ink">
              Organizar por categoria
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-stone">
              Lê o nome de cada produto e sugere a categoria: mochila vai pra
              Mochilas, mala e bolsa de viagem pra Viagem, e assim por diante.
              Nada é alterado antes de você conferir a lista.
            </p>
          </div>
          <Button onClick={analyze} disabled={pending} variant="outline">
            {preview ? 'Analisar de novo' : 'Analisar catálogo'}
          </Button>
        </div>

        {preview && (
          <div className="space-y-4">
            {preview.missingCategories.length > 0 && (
              <div className="rounded-md border border-leather/40 bg-bone-light p-4">
                <p className="text-sm text-ink">
                  Alguns produtos pedem categorias que ainda não existem:
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {preview.missingCategories.map((c) => (
                    <Button
                      key={c.slug}
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => createCategory(c.slug)}
                    >
                      Criar “{c.label}” ({c.count} produto
                      {c.count > 1 ? 's' : ''})
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 text-sm text-stone">
              <span>
                {preview.totalProducts} produto(s) no catálogo ·{' '}
                <strong className="text-ink">{preview.moves.length}</strong> a
                mover
              </span>
              {preview.unmatched.length > 0 && (
                <span>
                  · {preview.unmatched.length} sem palavra reconhecida (ficam
                  onde estão)
                </span>
              )}
            </div>

            {preview.moves.length > 0 && (
              <>
                <div className="max-h-[420px] overflow-y-auto rounded-md border border-whisper">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-bone-light text-left text-xs uppercase tracking-wider text-stone">
                      <tr>
                        <th className="w-10 p-2"></th>
                        <th className="p-2">Produto</th>
                        <th className="p-2">De</th>
                        <th className="p-2">Para</th>
                        <th className="p-2">Por quê</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.moves.map((m) => (
                        <tr
                          key={m.productId}
                          className={
                            'border-t border-whisper ' +
                            (skipped.has(m.productId) ? 'opacity-40' : '')
                          }
                        >
                          <td className="p-2">
                            <input
                              type="checkbox"
                              aria-label={`Mover ${m.productName}`}
                              checked={!skipped.has(m.productId)}
                              onChange={() => toggle(m.productId)}
                              className="h-4 w-4 cursor-pointer accent-ink"
                            />
                          </td>
                          <td className="p-2 text-ink">{m.productName}</td>
                          <td className="p-2 text-stone">{m.fromLabel}</td>
                          <td className="p-2">
                            <Badge>{m.toLabel}</Badge>
                          </td>
                          <td className="p-2 font-mono text-xs text-stone">
                            “{m.keyword}”
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center gap-3">
                  <Button onClick={apply} disabled={pending || selectedCount === 0}>
                    Aplicar em {selectedCount} produto
                    {selectedCount === 1 ? '' : 's'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setPreview(null)}
                    disabled={pending}
                  >
                    Cancelar
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
