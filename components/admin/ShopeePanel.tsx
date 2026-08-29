'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import {
  Download,
  ExternalLink,
  Plug,
  RefreshCw,
  Unlink,
  Unplug,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
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
import { ConfirmDialog } from './ConfirmDialog';
import { formatPriceBRL } from '@/lib/format';
import {
  disconnectShopeeShop,
  importAllShopeeItems,
  importShopeeItemToCatalog,
  linkShopeeItem,
  syncShopeeNow,
  updateShopeeImportSettings,
} from '@/app/admin/_actions/shopee';

type Shop = {
  shop_id: number;
  shop_name: string | null;
  expires_at: string;
  refresh_expires_at: string;
  last_sync_at: string | null;
  last_sync_error: string | null;
  last_sync_item_count: number | null;
  default_category_id: string | null;
  auto_import: boolean;
};

type Item = {
  id: string;
  item_id: number;
  item_name: string;
  item_status: string;
  price: number | null;
  stock: number | null;
  image_url: string | null;
  item_url: string;
  product_id: string | null;
  synced_at: string;
};

type Product = { id: string; name: string; slug: string };
type Category = { id: string; label: string };

const UNLINKED = 'none';

export function ShopeePanel({
  configured,
  unavailable,
  shop,
  items,
  products,
  categories,
  notice,
}: {
  configured: boolean;
  /** Preenchido quando a integração não pôde nem ser consultada. */
  unavailable: { reason: string; message: string } | null;
  shop: Shop | null;
  items: Item[];
  products: Product[];
  categories: Category[];
  notice: { connected: string | null; error: string | null };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [categoryId, setCategoryId] = useState<string>(
    shop?.default_category_id ?? categories[0]?.id ?? '',
  );
  const [autoImport, setAutoImport] = useState(shop?.auto_import ?? false);

  // Feedback from the /api/shopee/callback redirect (query string).
  useEffect(() => {
    if (notice.connected) toast.success(`Loja ${notice.connected} conectada`);
    if (notice.error) {
      toast.error(
        notice.error === 'config'
          ? 'Credenciais da Shopee ausentes (SHOPEE_PARTNER_ID / SHOPEE_PARTNER_KEY)'
          : notice.error === 'callback_params'
            ? 'A Shopee não devolveu code/shop_id'
            : notice.error,
      );
    }
  }, [notice.connected, notice.error]);

  const productById = new Map(products.map((p) => [p.id, p]));
  const pendingImport = items.filter(
    (i) => !i.product_id && i.item_status === 'NORMAL',
  ).length;

  const runSync = () => {
    startTransition(async () => {
      const res = await syncShopeeNow();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const { itemCount, autoLinkedCount, importedCount, priceUpdatedCount } = res.data;
      toast.success(
        `${itemCount} itens lidos da Shopee` +
          (importedCount > 0 ? ` · ${importedCount} importados` : '') +
          (autoLinkedCount > 0 ? ` · ${autoLinkedCount} vinculados` : '') +
          (priceUpdatedCount > 0 ? ` · ${priceUpdatedCount} preços atualizados` : ''),
      );
      router.refresh();
    });
  };

  const saveSettings = (nextAuto: boolean, nextCategory: string) => {
    if (!shop) return;
    startTransition(async () => {
      const res = await updateShopeeImportSettings({
        shopId: shop.shop_id,
        defaultCategoryId: nextCategory || null,
        autoImport: nextAuto,
      });
      if (!res.ok) {
        toast.error(res.error);
        setAutoImport(shop.auto_import);
        setCategoryId(shop.default_category_id ?? categories[0]?.id ?? '');
        return;
      }
      router.refresh();
    });
  };

  const importOne = (item: Item) => {
    if (!categoryId) {
      toast.error('Escolha a categoria de destino primeiro');
      return;
    }
    startTransition(async () => {
      const res = await importShopeeItemToCatalog({
        itemRowId: item.id,
        categoryId,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        `“${res.data.name}” criado com ${res.data.imageCount} foto(s)`,
      );
      router.refresh();
    });
  };

  const importAll = () => {
    if (!categoryId) {
      toast.error('Escolha a categoria de destino primeiro');
      return;
    }
    startTransition(async () => {
      const res = await importAllShopeeItems({ categoryId });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const { imported, failed } = res.data;
      if (failed > 0) {
        toast.warning(`${imported} importados · ${failed} falharam (veja os logs)`);
      } else {
        toast.success(`${imported} produtos criados a partir da Shopee`);
      }
      router.refresh();
    });
  };

  const changeLink = (item: Item, value: string) => {
    const productId = value === UNLINKED ? null : value;
    if (productId === item.product_id) return;
    startTransition(async () => {
      const res = await linkShopeeItem({ itemRowId: item.id, productId });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(productId ? 'Item vinculado' : 'Vínculo removido');
      router.refresh();
    });
  };

  const performDisconnect = async () => {
    if (!shop) return;
    const res = await disconnectShopeeShop({ shopId: shop.shop_id });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success('Loja desconectada');
    setConfirmDisconnect(false);
    router.refresh();
  };

  // A integração nem pôde ser consultada. Antes isto era um 500 sem
  // explicação; aqui o admin lê o que falta e o resto do painel segue de pé.
  if (unavailable) {
    return (
      <div className="space-y-6 p-6">
        <Card>
          <CardContent className="space-y-3 p-6">
            <h2 className="font-serif text-lg text-ink">Shopee</h2>
            {unavailable.reason === 'missing-tables' ? (
              <>
                <p className="max-w-2xl text-sm text-stone">
                  As tabelas da integração com a Shopee ainda não existem no
                  banco. O site e o resto do painel seguem funcionando — só esta
                  aba fica indisponível.
                </p>
                <p className="max-w-2xl text-sm text-stone">
                  Para ativar, rode no editor SQL do Supabase, nesta ordem:{' '}
                  <code className="rounded bg-bone-light px-1.5 py-0.5 font-mono text-xs">
                    supabase/migrations/20260822000000_shopee_integration.sql
                  </code>{' '}
                  e{' '}
                  <code className="rounded bg-bone-light px-1.5 py-0.5 font-mono text-xs">
                    supabase/migrations/20260822000001_shopee_import.sql
                  </code>
                  . As duas só criam tabelas novas — não alteram nem apagam
                  nada do que já existe, e podem ser rodadas com o site no ar.
                </p>
                <p className="max-w-2xl border-t border-whisper pt-3 text-sm text-stone">
                  <strong className="text-ink">Enquanto isso</strong>, para pôr
                  um produto novo no site sem depender daqui: use a aba{' '}
                  <Link href="/admin/importar" className="underline">
                    Importar
                  </Link>{' '}
                  (aceita a planilha exportada da Shopee e pula sozinha o que já
                  está no site) ou cadastre à mão em{' '}
                  <Link href="/admin/produtos/novo" className="underline">
                    Produtos → Novo
                  </Link>
                  . Nenhum dos dois usa as tabelas que faltam.
                </p>
              </>
            ) : unavailable.reason === 'no-credentials' ? (
              <p className="max-w-2xl text-sm text-stone">
                Falta uma variável de ambiente do Supabase no servidor:{' '}
                <code className="rounded bg-bone-light px-1.5 py-0.5 font-mono text-xs">
                  {unavailable.message}
                </code>
                . Defina na Vercel (Settings → Environment Variables) e publique
                de novo.
              </p>
            ) : (
              <p className="max-w-2xl text-sm text-stone">
                Não consegui ler a integração com a Shopee:{' '}
                <code className="rounded bg-bone-light px-1.5 py-0.5 font-mono text-xs">
                  {unavailable.message}
                </code>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardContent className="space-y-4 p-6">
          {!configured ? (
            <p className="text-sm text-stone">
              Defina <code className="font-mono text-xs">SHOPEE_PARTNER_ID</code> e{' '}
              <code className="font-mono text-xs">SHOPEE_PARTNER_KEY</code> (Console
              App em open.shopee.com) para habilitar a integração.
            </p>
          ) : !shop ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-ink">Nenhuma loja conectada.</p>
                <p className="text-xs text-stone">
                  A autorização abre a Shopee e volta para cá — o vendedor precisa
                  estar logado na conta da loja.
                </p>
              </div>
              <Button render={<a href="/api/shopee/authorize" />}>
                <Plug className="h-4 w-4" /> Conectar loja Shopee
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm text-ink">
                    <strong>{shop.shop_name ?? 'Loja'}</strong>{' '}
                    <span className="font-mono text-xs text-stone">
                      #{shop.shop_id}
                    </span>
                  </p>
                  <p className="text-xs text-stone">
                    Token renova em {formatDateTime(shop.expires_at)} · autorização
                    válida até {formatDateTime(shop.refresh_expires_at)}
                  </p>
                  <p className="text-xs text-stone">
                    {shop.last_sync_at
                      ? `Última sincronização: ${formatDateTime(shop.last_sync_at)}` +
                        (shop.last_sync_item_count !== null
                          ? ` (${shop.last_sync_item_count} itens)`
                          : '')
                      : 'Ainda não sincronizado'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={runSync} disabled={pending}>
                    <RefreshCw className="h-4 w-4" /> Sincronizar agora
                  </Button>
                  <Button
                    variant="outline"
                    disabled={pending}
                    onClick={() => setConfirmDisconnect(true)}
                  >
                    <Unplug className="h-4 w-4" /> Desconectar
                  </Button>
                </div>
              </div>

              {shop.last_sync_error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  Última sincronização falhou: {shop.last_sync_error}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 border-t border-whisper pt-4">
                <label className="flex items-center gap-2 text-sm text-stone">
                  Categoria dos importados
                  <Select
                    value={categoryId}
                    onValueChange={(v) => {
                      const next = v as string;
                      setCategoryId(next);
                      saveSettings(autoImport, next);
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
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
                </label>

                <label className="flex items-center gap-2 text-sm text-stone">
                  <Switch
                    checked={autoImport}
                    disabled={pending}
                    onCheckedChange={(checked) => {
                      setAutoImport(checked);
                      saveSettings(checked, categoryId);
                    }}
                  />
                  Importar itens novos automaticamente (sync diário)
                </label>

                {pendingImport > 0 && (
                  <Button
                    variant="outline"
                    className="ml-auto"
                    disabled={pending}
                    onClick={importAll}
                  >
                    <Download className="h-4 w-4" /> Importar {pendingImport} pendente
                    {pendingImport > 1 ? 's' : ''}
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {shop && (
        <section className="space-y-3">
          <div className="flex items-baseline gap-2">
            <h2 className="font-serif text-lg text-ink">Itens da Shopee</h2>
            <span className="text-xs text-stone">
              {items.length} itens · {items.length - pendingImport} já no site
            </span>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Foto</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead className="w-[280px]">Produto no site</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-stone">
                    Nenhum item sincronizado ainda. Clique em “Sincronizar agora”.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const linked = item.product_id
                    ? productById.get(item.product_id)
                    : undefined;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="relative h-10 w-10 overflow-hidden rounded-sm bg-whisper">
                          {item.image_url && (
                            <Image
                              src={item.image_url}
                              alt=""
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-ink">{item.item_name}</span>
                        <span className="ml-2 font-mono text-xs text-stone">
                          #{item.item_id}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(item.item_status)}>
                          {statusLabel(item.item_status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {item.price !== null ? formatPriceBRL(item.price) : '—'}
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {item.stock ?? '—'}
                      </TableCell>
                      <TableCell>
                        {linked ? (
                          <div className="flex items-center gap-1">
                            <Link
                              href={`/admin/produtos/${linked.id}`}
                              className="truncate text-sm text-ink hover:underline"
                            >
                              {linked.name}
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={pending}
                              title="Desvincular"
                              onClick={() => changeLink(item, UNLINKED)}
                            >
                              <Unlink className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              disabled={pending || item.item_status !== 'NORMAL'}
                              onClick={() => importOne(item)}
                            >
                              <Download className="h-3.5 w-3.5" /> Importar
                            </Button>
                            <Select
                              value={UNLINKED}
                              onValueChange={(v) => changeLink(item, v as string)}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="ou vincular a…" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={UNLINKED}>
                                  ou vincular a…
                                </SelectItem>
                                {products.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          render={
                            <a
                              href={item.item_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Abrir na Shopee"
                            />
                          }
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </section>
      )}

      <ConfirmDialog
        open={confirmDisconnect}
        onOpenChange={setConfirmDisconnect}
        title="Desconectar a loja Shopee?"
        description={
          <>
            Os tokens são apagados e os {items.length} itens em cache saem do painel.
            Os produtos já importados <strong>continuam no site</strong> — só param
            de receber preço e novidades da Shopee.
          </>
        }
        confirmLabel="Desconectar"
        destructive
        onConfirm={performDisconnect}
      />
    </div>
  );
}

function statusLabel(status: string): string {
  if (status === 'NORMAL') return 'À venda';
  if (status === 'GONE') return 'Fora da Shopee';
  if (status === 'UNLIST') return 'Despublicado';
  return status;
}

function statusVariant(status: string): 'default' | 'secondary' | 'outline' {
  if (status === 'NORMAL') return 'default';
  if (status === 'GONE') return 'outline';
  return 'secondary';
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}
