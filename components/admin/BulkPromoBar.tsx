'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  bulkApplyPromo,
  bulkClearPromo,
  bulkSetActive,
  bulkSetCategory,
} from '@/app/admin/_actions/bulk';

type BulkBarProps = {
  ids: string[];
  categories: { id: string; label: string }[];
  onDone: () => void;
};

/**
 * Barra de ações em massa da lista de produtos.
 *
 * Existe por causa da importação da Shopee: com centenas de anúncios
 * entrando de uma vez, colocar uma coleção em promoção ou despublicar um lote
 * um a um é inviável.
 */
export function BulkPromoBar({ ids, categories, onDone }: BulkBarProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<'percent' | 'fixed'>('percent');
  const [value, setValue] = useState('10');
  const [endsAt, setEndsAt] = useState('');

  const run = (fn: () => Promise<{ ok: boolean; error?: string; data?: unknown }>) =>
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        toast.error(res.error ?? 'Não consegui aplicar');
        return;
      }
      const data = res.data as { updated?: number; skipped?: number } | undefined;
      const skipped = data?.skipped ?? 0;
      toast.success(
        `${data?.updated ?? 0} produto(s) atualizado(s)` +
          (skipped > 0 ? ` · ${skipped} pulado(s)` : ''),
      );
      onDone();
      router.refresh();
    });

  const applyPromo = () => {
    const num = Number(value.replace(',', '.'));
    if (!Number.isFinite(num) || num <= 0) {
      toast.error('Informe um valor maior que zero');
      return;
    }
    run(() =>
      bulkApplyPromo({
        ids,
        mode,
        value: num,
        // O input não tem fuso; quem converte é o navegador, que conhece o de
        // quem está preenchendo.
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      }),
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-leather/30 bg-bone-light p-3">
      <span className="font-sans text-sm font-medium text-ink">
        {ids.length} selecionado{ids.length > 1 ? 's' : ''}
      </span>

      <div className="flex items-center gap-2">
        <Select value={mode} onValueChange={(v) => setMode(v as 'percent' | 'fixed')}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="percent">Desconto (%)</SelectItem>
            <SelectItem value="fixed">Preço fixo (R$)</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="number"
          min="0"
          step={mode === 'percent' ? '1' : '0.01'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-24"
        />
        <Input
          type="datetime-local"
          value={endsAt}
          onChange={(e) => setEndsAt(e.target.value)}
          className="w-[210px]"
          title="Validade da promoção (opcional)"
        />
        <Button size="sm" onClick={applyPromo} disabled={pending}>
          Aplicar promoção
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => run(() => bulkClearPromo(ids))}
          disabled={pending}
        >
          Remover promoção
        </Button>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Select
          value=""
          onValueChange={(v) => run(() => bulkSetCategory(ids, v as string))}
        >
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Mover para…" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="outline"
          onClick={() => run(() => bulkSetActive(ids, true))}
          disabled={pending}
        >
          Publicar
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => run(() => bulkSetActive(ids, false))}
          disabled={pending}
        >
          Despublicar
        </Button>
      </div>
    </div>
  );
}
