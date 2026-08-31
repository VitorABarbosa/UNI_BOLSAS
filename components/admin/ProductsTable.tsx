'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpDown, EyeOff, MoreHorizontal, Plus, Star, Undo2, X } from 'lucide-react';
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
  setFeaturedSelection,
} from '@/app/admin/_actions/products';
import { publicImageUrl } from '@/lib/supabase/image-url';
import { MAX_FEATURED } from '@/lib/catalog/featured';

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
  featured: boolean;
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
  const [status, setStatus] = useState<'all' | 'on' | 'off' | 'featured'>(
    'all',
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>('sort_order');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [confirm, setConfirm] = useState<{
    id: string;
    name: string;
    imageCount: number;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  /**
   * A VITRINE MORA AQUI, não na prop do servidor.
   *
   * Antes a estrela desenhava `row.featured`, que só mudava depois da ação no
   * servidor mais um `router.refresh()` — dois pulos de rede antes de
   * qualquer pixel mudar. Enquanto isso a tabela inteira ficava desabilitada.
   * O clique parecia não ter funcionado, a pessoa clicava de novo, e o
   * segundo clique desfazia o primeiro.
   *
   * Agora o clique muda a tela na hora e a gravação vai atrás. Se ela falhar,
   * a estrela volta ao que o servidor diz e o erro aparece.
   */
  const serverFeatured = useMemo(
    () => initial.filter((p) => p.featured).map((p) => p.id),
    [initial],
  );
  const [featured, setFeatured] = useState<string[]>(serverFeatured);
  const featuredSet = useMemo(() => new Set(featured), [featured]);
  const [savingFeatured, setSavingFeatured] = useState(false);

  // O que queremos que a vitrine seja. Fica em ref porque a gravação em curso
  // precisa enxergar cliques que aconteceram depois que ela começou.
  const wanted = useRef<string[]>(serverFeatured);
  const saving = useRef(false);
  const again = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Quando o servidor manda dados novos, ele passa a mandar — a não ser que
  // haja clique nosso ainda não gravado, que não pode ser atropelado por uma
  // recarga disparada por outra ação da tela.
  const serverKey = serverFeatured.join(',');
  useEffect(() => {
    if (saving.current || timer.current) return;
    setFeatured(serverFeatured);
    wanted.current = serverFeatured;
    // serverFeatured é derivado de serverKey; seguir a string evita repetir o
    // efeito a cada render só porque o array é novo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverKey]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const flushFeatured = useCallback(async () => {
    // Uma gravação por vez. Se chegar clique no meio, a que está rodando
    // repete o laço com a lista nova em vez de abrir uma segunda requisição.
    if (saving.current) {
      again.current = true;
      return;
    }
    saving.current = true;
    setSavingFeatured(true);
    try {
      do {
        again.current = false;
        const res = await setFeaturedSelection(wanted.current);
        if (!res.ok) {
          toast.error(res.error);
          setFeatured(serverFeatured);
          wanted.current = serverFeatured;
          again.current = false;
          return;
        }
      } while (again.current);
      router.refresh();
    } finally {
      saving.current = false;
      setSavingFeatured(false);
    }
  }, [router, serverFeatured]);

  /**
   * Aplica a nova vitrine na tela e agenda a gravação. O respiro de 400ms
   * junta a rajada de cliques de quem está montando a seleção numa gravação
   * só — e continua parecendo instantâneo, porque a tela já mudou.
   */
  const applyFeatured = (next: string[], message: string): boolean => {
    if (next.length > MAX_FEATURED) {
      toast.error(
        `A vitrine cabe ${MAX_FEATURED} peças — tire alguma antes de pôr mais.`,
      );
      return false;
    }
    setFeatured(next);
    wanted.current = next;
    toast.success(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      void flushFeatured();
    }, 400);
    return true;
  };

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
      if (status === 'featured' && !featuredSet.has(p.id)) return false;
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
  }, [initial, debouncedSearch, filterCat, status, sortKey, sortDir, featuredSet]);

  const countOn = initial.filter((p) => p.active).length;
  const countOff = initial.length - countOn;
  const countFeatured = featured.length;

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

  const bulkSetFeatured = (on: boolean) => {
    const ids = selectedVisible;
    if (ids.length === 0) return;
    const next = on
      ? [...featured, ...ids.filter((id) => !featuredSet.has(id))]
      : featured.filter((id) => !ids.includes(id));
    const diff = Math.abs(next.length - featured.length);
    if (diff === 0) return;
    const done = applyFeatured(
      next,
      on
        ? `${diff} peça(s) em destaque · ${next.length} na vitrine`
        : `${diff} peça(s) fora dos destaques`,
    );
    // Recusado por não caber: a seleção fica, pra pessoa poder tirar peças e
    // tentar de novo sem remarcar tudo.
    if (done) setSelected(new Set());
  };

  const toggleFeatured = (row: ProductListRow) => {
    const on = featuredSet.has(row.id);
    applyFeatured(
      on ? featured.filter((id) => id !== row.id) : [...featured, row.id],
      on
        ? `“${row.name}” saiu dos destaques`
        : `“${row.name}” entrou nos destaques`,
    );
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
              ['featured', `Em destaque (${countFeatured})`],
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

      {/* A estrela sozinha não se explica: quem abre o painel pela primeira
          vez precisa saber o que ela faz e onde o resultado aparece. */}
      <p className="flex items-center gap-1.5 text-sm text-stone">
        <Star className="h-3.5 w-3.5 fill-leather text-leather" />
        Clique na estrela para pôr a peça na vitrine{' '}
        <strong className="font-medium text-ink">Destaques da casa</strong>, no
        topo da home. Cabem {MAX_FEATURED}.
      </p>

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
              variant="outline"
              size="sm"
              onClick={() => bulkSetFeatured(true)}
            >
              <Star className="mr-1 h-4 w-4" /> Destacar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => bulkSetFeatured(false)}
            >
              Tirar destaque
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
            <TableHead className="w-[90px]">
              Destaque
              <span className="ml-1 font-mono text-[10px] text-stone">
                {countFeatured}/{MAX_FEATURED}
              </span>
              {/* A tela já mudou; isto avisa que o servidor ainda está
                  recebendo, sem travar nada enquanto isso. */}
              {savingFeatured && (
                <span className="ml-1 text-[10px] font-normal text-stone">
                  salvando…
                </span>
              )}
            </TableHead>
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
                <TableCell>
                  {/* Sem `disabled`: a estrela responde ao clique sempre, e
                      a gravação corre por fora. Era o `disabled` global que
                      apagava a tabela inteira a cada clique. */}
                  <button
                    type="button"
                    onClick={() => toggleFeatured(row)}
                    title={
                      featuredSet.has(row.id)
                        ? 'Tirar da vitrine de destaques'
                        : 'Pôr na vitrine de destaques'
                    }
                    aria-pressed={featuredSet.has(row.id)}
                    aria-label={`${featuredSet.has(row.id) ? 'Tirar' : 'Pôr'} “${row.name}” nos destaques`}
                    className="group rounded p-1 transition-colors hover:bg-bone-light"
                  >
                    {/* A estrela apagada era `text-whisper` (#E5DECF) sobre
                        fundo osso: praticamente invisível. Quem não enxerga o
                        botão não descobre que pode clicar nele. */}
                    <Star
                      className={
                        'h-4 w-4 transition-colors ' +
                        (featuredSet.has(row.id)
                          ? 'fill-leather text-leather'
                          : 'text-stone/45 group-hover:text-leather')
                      }
                    />
                  </button>
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
