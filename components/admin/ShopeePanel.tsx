'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { ExternalLink, Plug, RefreshCw, Unplug } from 'lucide-react';
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
  linkShopeeItem,
  syncShopeeNow,
} from '@/app/admin/_actions/shopee';

type Shop = {
  shop_id: number;
  shop_name: string | null;
  expires_at: string;
  refresh_expires_at: string;
  last_sync_at: string | null;
  last_sync_error: string | null;
  last_sync_item_count: number | null;
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

const UNLINKED = 'none';

export function ShopeePanel({
  configured,
  shop,
  items,
  products,
  notice,
}: {
  configured: boolean;
  shop: Shop | null;
  items: Item[];
  products: Product[];
  notice: { connected: string | null; error: string | null };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

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

  const runSync = () => {
    startTransition(async () => {
      const res = await syncShopeeNow();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const { itemCount, autoLinkedCount, removedCount } = res.data;
      toast.success(
        `${itemCount} itens sincronizados` +
          (autoLinkedCount > 0 ? ` · ${autoLinkedCount} vinculados` : '') +
          (removedCount > 0 ? ` · ${removedCount} removidos` : ''),
      );
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

  const linkedCount = items.filter((i) => i.product_id).length;

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
            </>
          )}
        </CardContent>
      </Card>

      {shop && (
        <section className="space-y-3">
          <div className="flex items-baseline gap-2">
            <h2 className="font-serif text-lg text-ink">Itens da Shopee</h2>
            <span className="text-xs text-stone">
              {items.length} itens · {linkedCount} vinculados a produtos do site
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
                <TableHead className="w-[240px]">Produto no site</TableHead>
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
                items.map((item) => (
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
                      <Badge
                        variant={item.item_status === 'NORMAL' ? 'default' : 'secondary'}
                      >
                        {item.item_status === 'NORMAL' ? 'À venda' : item.item_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {item.price !== null ? formatPriceBRL(item.price) : '—'}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {item.stock ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.product_id ?? UNLINKED}
                        onValueChange={(v) => changeLink(item, v as string)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sem vínculo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UNLINKED}>Sem vínculo</SelectItem>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                ))
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
            Os tokens são apagados e os {items.length} itens em cache saem do site.
            Para voltar, é preciso autorizar de novo na Shopee.
          </>
        }
        confirmLabel="Desconectar"
        destructive
        onConfirm={performDisconnect}
      />
    </div>
  );
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}
