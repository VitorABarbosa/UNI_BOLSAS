'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpDown, EyeOff, MoreHorizontal, Plus, Undo2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from './ConfirmDialog';
import {
  deleteProduct,
  setProductActive,
  setProductsActive,
} from '@/app/admin/_actions/products';
import { publicImageUrl } from '@/lib/supabase/image-url';

export type ProductListRow = {
  id: string;
  slug: string;
  name: string;
  active: boolean;
  sort_order: number;
  category_id: string;
  category_label: string;
  image_count: number;
  cover_storage_path: string | null;
};

type SortKey = 'sort_order' | 'name';

export function ProductsTable({
  initial,
  categories,
}: {
  initial: ProductListRow[];
  categories: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [status, setStatus] = useState<'all' | 'on' | 'off'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>('sort_order');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [confirm, setConfirm] = useState<{
    id: string;
    name: string;
    imageCount: number;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  // Debounce 150ms — search updates fast enough to feel responsive but
  // avoids re-filtering on every keystroke for larger lists.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 150);
    return () => clearTimeout(t);
  }, [search]);

  const rows = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    let r = initial.filter((p) => {
      if (
        q &&
        !(p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q))
      )
        return false;
      if (filterCat !== 'all' && p.category_id !== filterCat) return false;
      if (status === 'on' && !p.active) return false;
      if (status === 'off' && p.active) return false;
      return true;
    });
    r = [...r].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'sort_order')
        cmp = a.sort_order - b.sort_order || a.name.localeCompare(b.name);
      else cmp = a.name.localeCompare(b.name);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return r;
  }, [initial, debouncedSearch, filterCat, status, sortKey, sortDir]);

  const countOn = initial.filter((p) => p.active).length;
  const countOff = initial.length - countOn;

  const performDelete = async () => {
    if (!confirm) return;
    const res = await deleteProduct(confirm.id);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success('Produto excluído');
    setConfirm(null);
    router.refresh();
  };

  const toggleActive = (row: { id: string; name: string; active: boolean }) => {
    startTransition(async () => {
      const res = await setProductActive(row.id, !row.active);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        row.active
          ? `“${row.name}” saiu do site (a importação vai pular)`
          : `“${row.name}” voltou pro site`,
      );
      router.refresh();
    });
  };

  // A seleção acompanha o que está filtrado: marcar "todos" marca o que a
  // pessoa está vendo, nunca o catálogo inteiro escondido atrás do filtro.
  const visibleIds = rows.map((r) => r.id);
  const selectedVisible = visibleIds.filter((id) => selected.has(id));
  const allVisibleSelected =
    visibleIds.length > 0 && selectedVisible.length === visibleIds.length;

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAllVisible = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });

  const bulkSetActive = (active: boolean) => {
    const ids = selectedVisible;
    if (ids.length === 0) return;
    startTransition(async () => {
      const res = await setProductsActive(ids, active);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        active
          ? `${res.data.count} produto(s) de volta no site`
          : `${res.data.count} produto(s) fora do site — a importação vai pular`,
      );
      setSelected(new Set());
      router.refresh();
    });
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir('asc');
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Buscar nome ou slug…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={filterCat} onValueChange={(v) => setFilterCat(v as string)}>
          <SelectTrigger className="max-w-[180px]">
            {/* Sem esta função o Base UI mostra o valor cru — aqui aparecia
                "all", e nas outras telas apareceria o UUID da categoria. */}
            <SelectValue placeholder="Categoria">
              {(v) =>
                v === 'all'
                  ? 'Todas categorias'
                  : (categories.find((c) => c.id === v)?.label ?? 'Categoria')
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Três estados, não um interruptor: depois de tirar produtos do
            site é preciso conseguir listar justamente os que estão fora pra
            conferir — coisa que "só ativos" não permitia. */}
        <div className="flex items-center rounded-lg border border-whisper p-0.5">
          {(
            [
              ['all', `Todos (${initial.length})`],
              ['on', `No site (${countOn})`],
              ['off', `Fora do site (${countOff})`],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
              className={
                'rounded-md px-3 py-1.5 text-sm transition-colors ' +
                (status === value
                  ? 'bg-ink text-bone'
                  : 'text-stone hover:text-ink')
              }
            >
              {label}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <Link
            href="/admin/produtos/novo"
            className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Novo produto
          </Link>
        </div>
      </div>

      {selectedVisible.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-ink/15 bg-bone-light px-3 py-2">
          <span className="text-sm text-ink">
            <strong>{selectedVisible.length}</strong> selecionado
            {selectedVisible.length > 1 ? 's' : ''}
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => bulkSetActive(false)}
            >
              <EyeOff className="mr-1 h-4 w-4" /> Remover do site
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => bulkSetActive(true)}
            >
              <Undo2 className="mr-1 h-4 w-4" /> Voltar pro site
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelected(new Set())}
            >
              <X className="mr-1 h-4 w-4" /> Limpar
            </Button>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <Checkbox
                aria-label="Selecionar todos os produtos da lista"
                checked={allVisibleSelected}
                indeterminate={
                  selectedVisible.length > 0 && !allVisibleSelected
                }
                onChange={toggleAllVisible}
                disabled={rows.length === 0}
              />
            </TableHead>
            <TableHead className="w-[60px]">Capa</TableHead>
            <TableHead>
              <button
                type="button"
                onClick={() => toggleSort('name')}
                className="flex items-center gap-1"
              >
                Nome <ArrowUpDown className="h-3 w-3" />
              </button>
            </TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <button
                type="button"
                onClick={() => toggleSort('sort_order')}
                className="flex items-center gap-1"
              >
                Ordem <ArrowUpDown className="h-3 w-3" />
              </button>
            </TableHead>
            <TableHead>Imagens</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="py-10 text-center text-sm text-stone">
                Nenhum produto encontrado.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.id}
                data-selected={selected.has(row.id) || undefined}
                className={
                  (selected.has(row.id) ? 'bg-bone-light ' : '') +
                  // Fora do site fica mais apagado: dá pra varrer a lista e ver
                  // num relance o que está publicado e o que não está.
                  (row.active ? '' : 'opacity-60')
                }
              >
                <TableCell>
                  <Checkbox
                    aria-label={`Selecionar ${row.name}`}
                    checked={selected.has(row.id)}
                    onChange={() => toggleOne(row.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="relative h-10 w-10 overflow-hidden rounded-sm bg-whisper">
                    {row.cover_storage_path && (
                      <Image
                        src={publicImageUrl(row.cover_storage_path)}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/produtos/${row.id}`}
                    className="text-ink hover:underline"
                  >
                    {row.name}
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-xs text-stone">
                  {row.slug}
                </TableCell>
                <TableCell className="text-sm">{row.category_label}</TableCell>
                <TableCell>
                  <Badge variant={row.active ? 'default' : 'secondary'}>
                    {row.active ? 'No site' : 'Fora do site'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm tabular-nums text-stone">
                  {row.sort_order}
                </TableCell>
                <TableCell className="text-sm tabular-nums">
                  {row.image_count}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon" disabled={pending}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/admin/produtos/${row.id}`)}
                      >
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() =>
                          setConfirm({
                            id: row.id,
                            name: row.name,
                            imageCount: row.image_count,
                          })
                        }
                      >
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Excluir produto"
        description={
          confirm ? (
            <>
              Excluir <strong>“{confirm.name}”</strong>?
              {confirm.imageCount > 0 && (
                <>
                  {' '}
                  Vai apagar <strong>{confirm.imageCount} imagem(ns)</strong> junto.
                </>
              )}
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Excluir"
        destructive
        onConfirm={performDelete}
      />
    </div>
  );
}
