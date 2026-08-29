import { requireAdmin } from '@/lib/auth/require-admin';
import { AdminShell } from '@/components/admin/shell/AdminShell';
import { ShopeePanel } from '@/components/admin/ShopeePanel';
import { lookupShopeeShop } from '@/lib/shopee/tokens';
import { isShopeeConfigured } from '@/lib/shopee/config';

export const metadata = {
  title: 'Shopee · Uni Bolsas Admin',
};

// Tokens and sync timestamps change out of band (cron), so never cache.
export const dynamic = 'force-dynamic';

export default async function ShopeePage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const { user, supabase } = await requireAdmin();
  const params = await searchParams;

  // Nada aqui pode lançar: numa página, um throw vira a tela de "server error"
  // e o admin não descobre o motivo. Cada falha vira um estado explicável.
  const lookup = await lookupShopeeShop();

  const [{ data: items }, { data: products }, { data: categories }] = await Promise.all([
    supabase
      .from('shopee_items')
      .select(
        'id, item_id, item_name, item_status, price, stock, image_url, item_url, product_id, synced_at',
      )
      .order('item_name'),
    supabase.from('products').select('id, name, slug').order('name'),
    supabase.from('categories').select('id, label').order('sort_order'),
  ]);

  return (
    <AdminShell user={{ email: user.email ?? '' }} title="Shopee">
      <ShopeePanel
        configured={isShopeeConfigured()}
        unavailable={lookup.ok ? null : { reason: lookup.reason, message: lookup.message }}
        shop={
          lookup.ok && lookup.shop
            ? {
                shop_id: lookup.shop.shop_id,
                shop_name: lookup.shop.shop_name,
                expires_at: lookup.shop.expires_at,
                refresh_expires_at: lookup.shop.refresh_expires_at,
                last_sync_at: lookup.shop.last_sync_at,
                last_sync_error: lookup.shop.last_sync_error,
                last_sync_item_count: lookup.shop.last_sync_item_count,
                default_category_id: lookup.shop.default_category_id,
                auto_import: lookup.shop.auto_import,
              }
            : null
        }
        items={items ?? []}
        products={products ?? []}
        categories={categories ?? []}
        notice={{ connected: params.connected ?? null, error: params.error ?? null }}
      />
    </AdminShell>
  );
}
