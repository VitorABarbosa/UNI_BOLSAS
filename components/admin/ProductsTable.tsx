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
import {
  deleteProduct,
  setProductActive,
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
  const [onlyActive, setOnlyActive] = useState(false);
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
  }, [initial, debouncedSearch, filterCat, onlyActive, sortKey, sortDir]);

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

      <Table>
        <TableHeader>
          <TableRow>
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
              <TableCell colSpan={8} className="py-10 text-center text-sm text-stone">
                Nenhum produto encontrado.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
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
                      <DropdownMenuItem onClick={() => toggleActive(row)}>
                        {row.active ? 'Remover do site' : 'Voltar pro site'}
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
                        Excluir definitivamente
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
        title="Excluir definitivamente"
        description={
          confirm ? (
            <>
              Apagar <strong>“{confirm.name}”</strong> sem volta
              {confirm.imageCount > 0 && (
                <>
                  , junto com <strong>{confirm.imageCount} imagem(ns)</strong>
                </>
              )}
              .
              <br />
              <br />
              Se este produto ainda estiver na planilha da Shopee, a próxima
              importação vai <strong>criá-lo de novo</strong>. Para tirá-lo do
              site de forma permanente, use <strong>Remover do site</strong>.
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Excluir mesmo assim"
        destructive
        onConfirm={performDelete}
      />
    </div>
  );
}
