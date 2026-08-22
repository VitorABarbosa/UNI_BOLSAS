-- Shopee -> site integration.
--
-- Direction is one-way: we PULL the shop's catalog from the Shopee Open
-- Platform (open.shopee.com, região BR) and cache it here so the public site
-- can render a "comprar na Shopee" CTA with live price/stock without hitting
-- Shopee on every request.
--
-- Two tables:
--   * shopee_shops — one row per authorized shop. Holds the OAuth tokens.
--     RLS is ENABLED WITH NO POLICIES, so only the service role reaches it
--     (same posture as public.admins). Tokens are stored as-is: the
--     access_token lives 4h and the refresh_token 30 days, and Shopee rotates
--     both on every refresh, so a leak window is short — but the row must
--     never be exposed to anon/authenticated.
--   * shopee_items — the cached catalog. Everything in it is already public
--     on shopee.com.br, so SELECT is public; writes go through the service
--     role (sync job) or an admin (manual product linking).

-- ============================================================================
-- shopee_shops
-- ============================================================================

create table public.shopee_shops (
  shop_id               bigint primary key,
  shop_name             text,
  region                text        not null default 'BR',
  access_token          text        not null,
  refresh_token         text        not null,
  -- access_token expiry (Shopee returns expire_in seconds, ~4h)
  expires_at            timestamptz not null,
  -- refresh_token expiry (30 days). Past this the shop must re-authorize.
  refresh_expires_at    timestamptz not null,
  last_sync_at          timestamptz,
  last_sync_error       text,
  last_sync_item_count  int,
  authorized_at         timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.shopee_shops enable row level security;
-- No policies on purpose: service_role only.

create trigger shopee_shops_set_updated_at
  before update on public.shopee_shops
  for each row execute function public.set_updated_at();

-- ============================================================================
-- shopee_items
-- ============================================================================

create table public.shopee_items (
  id                 uuid primary key default gen_random_uuid(),
  shop_id            bigint not null references public.shopee_shops(shop_id) on delete cascade,
  item_id            bigint not null unique,
  -- Link to our own catalog. NULL = item exists on Shopee but isn't mapped to
  -- a product on the site yet (mapped automatically by name, or by hand in
  -- /admin/shopee).
  product_id         uuid references public.products(id) on delete set null,
  item_name          text not null,
  item_sku           text,
  -- NORMAL | BANNED | UNLIST | REVIEWING | DELETED (Shopee's item_status)
  item_status        text not null,
  currency           text not null default 'BRL',
  -- Lowest current price across models (numeric so the site can format it).
  price              numeric(10, 2),
  original_price     numeric(10, 2),
  -- Total available stock across models. NULL when Shopee didn't report it.
  stock              int,
  image_url          text,
  item_url           text not null,
  has_model          boolean not null default false,
  shopee_update_time timestamptz,
  synced_at          timestamptz not null default now(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- One Shopee item per product (and vice-versa): the PDP renders a single
-- "comprar na Shopee" CTA, so an ambiguous mapping has no meaning.
create unique index shopee_items_product_id_key
  on public.shopee_items (product_id)
  where product_id is not null;
create index shopee_items_shop_id_status_idx on public.shopee_items (shop_id, item_status);

create trigger shopee_items_set_updated_at
  before update on public.shopee_items
  for each row execute function public.set_updated_at();

alter table public.shopee_items enable row level security;

create policy shopee_items_read_public
  on public.shopee_items for select
  using (true);

-- Admins can link/unlink an item to a product from the admin UI. Inserts and
-- deletes stay with the sync job (service role), which owns the mirror.
create policy shopee_items_admin_update
  on public.shopee_items for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
