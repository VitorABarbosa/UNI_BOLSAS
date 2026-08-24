'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpDown, MoreHorizontal, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
import { BulkPromoBar } from './BulkPromoBar';
import { productPrice } from '@/lib/product-price';
import { deleteProduct } from '@/app/admin/_actions/products';
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
  color_count: number;
  price_retail: number;
  price_promo: number | null;
  promo_ends_at: string | null;
};

/** Filtros de saúde do catálogo — os problemas que a importação em massa deixa. */
type HealthFilter = 'all' | 'no_image' | 'no_color' | 'on_promo';

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
  const [onlyActive, setOnlyActive] = useState(false);
  const [health, setHealth] = useState<HealthFilter>('all');
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
      if (onlyActive && !p.active) return false;
      if (health === 'no_image' && p.image_count > 0) return false;
      if (health === 'no_color' && p.color_count > 0) return false;
      if (health === 'on_promo' && !productPrice(p).isPromo) return false;
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
  }, [initial, debouncedSearch, filterCat, onlyActive, health, sortKey, sortDir]);

  const allShownSelected =
    rows.length > 0 && rows.every((r) => selected.has(r.id));

  const toggleAllShown = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allShownSelected) rows.forEach((r) => next.delete(r.id));
      else rows.forEach((r) => next.add(r.id));
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
            <SelectValue placeholder="Categoria" />
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
        <Select value={health} onValueChange={(v) => setHealth(v as HealthFilter)}>
          <SelectTrigger className="max-w-[190px]">
            <SelectValue placeholder="Situação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os produtos</SelectItem>
            <SelectItem value="no_image">Sem foto</SelectItem>
            <SelectItem value="no_color">Sem cor cadastrada</SelectItem>
            <SelectItem value="on_promo">Em promoção</SelectItem>
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm text-stone">
          <Switch checked={onlyActive} onCheckedChange={setOnlyActive} />
          Só ativos
        </label>
        <div className="ml-auto">
          <Link
            href="/admin/produtos/novo"
            className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Novo produto
          </Link>
        </div>
      </div>

      {selected.size > 0 && (
        <BulkPromoBar
          ids={[...selected]}
          categories={categories}
          onDone={() => setSelected(new Set())}
        />
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[36px]">
              <input
                type="checkbox"
                aria-label="Selecionar todos os produtos filtrados"
                checked={allShownSelected}
                onChange={toggleAllShown}
                className="h-4 w-4 cursor-pointer accent-ink"
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
            <TableHead>Preço</TableHead>
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
              <TableCell colSpan={10} className="py-10 text-center text-sm text-stone">
                Nenhum produto encontrado.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id} data-selected={selected.has(row.id)}>
                <TableCell>
                  <input
                    type="checkbox"
                    aria-label={`Selecionar ${row.name}`}
                    checked={selected.has(row.id)}
                    onChange={() => toggleOne(row.id)}
                    className="h-4 w-4 cursor-pointer accent-ink"
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
                <TableCell className="whitespace-nowrap text-sm">
                  {(() => {
                    const price = productPrice(row);
                    return price.isPromo ? (
                      <span className="flex items-center gap-1.5">
                        <span className="font-medium text-wine">
                          {price.currentLabel}
                        </span>
                        <s className="text-xs text-stone">{price.originalLabel}</s>
                        <Badge variant="secondary">-{price.discountPct}%</Badge>
                      </span>
                    ) : (
                      <span className="text-ink">{price.currentLabel}</span>
                    );
                  })()}
                </TableCell>
                <TableCell>
                  <Badge variant={row.active ? 'default' : 'secondary'}>
                    {row.active ? 'Ativo' : 'Inativo'}
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
