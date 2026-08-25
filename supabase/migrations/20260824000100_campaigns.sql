-- Campanhas de desconto montadas no painel.
--
-- O site já mostra o "de/por" das promoções da Shopee (espelhadas de
-- `shopee_items`), mas aquilo é criado lá, não aqui. Estas tabelas dão à loja
-- uma campanha própria: "Dia das Mães, -20% nessas 12 bolsas, de 01 a 12/05".
--
-- Duas tabelas em vez de uma coluna em `products` porque campanha é um objeto
-- com vida própria: tem nome, período e um conjunto de peças. Encerrada a
-- campanha, os preços voltam sozinhos — não há o que limpar produto a produto.
--
-- O código do site funciona com ou sem estas tabelas: se não existirem, as
-- consultas simplesmente seguem sem campanha. Aplicar esta migration é
-- opcional e pode ser feito a qualquer momento, sem janela de manutenção.

create table if not exists public.campaigns (
  id              uuid primary key default gen_random_uuid(),
  name            text        not null,
  -- percent: desconta sobre o preço de cada peça | fixed: mesmo preço pra todas
  discount_kind   text        not null default 'percent'
                              check (discount_kind in ('percent', 'fixed')),
  discount_value  numeric(10, 2) not null check (discount_value > 0),
  -- Null = já valendo / sem prazo.
  starts_at       timestamptz,
  ends_at         timestamptz,
  -- Interruptor manual, independente do período.
  active          boolean     not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table if not exists public.campaign_products (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  product_id  uuid not null references public.products(id)  on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (campaign_id, product_id)
);

create index if not exists campaign_products_product_idx
  on public.campaign_products (product_id);
create index if not exists campaigns_active_idx
  on public.campaigns (active) where active;

drop trigger if exists campaigns_set_updated_at on public.campaigns;
create trigger campaigns_set_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

-- ============================================================================
-- RLS
-- O site público precisa ler pra calcular o preço; escrever é só de admin,
-- mesma postura das outras tabelas do catálogo.
-- ============================================================================

alter table public.campaigns enable row level security;
alter table public.campaign_products enable row level security;

drop policy if exists campaigns_read_public on public.campaigns;
create policy campaigns_read_public
  on public.campaigns for select using (true);

drop policy if exists campaign_products_read_public on public.campaign_products;
create policy campaign_products_read_public
  on public.campaign_products for select using (true);

drop policy if exists campaigns_admin_write on public.campaigns;
create policy campaigns_admin_write
  on public.campaigns for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists campaign_products_admin_write on public.campaign_products;
create policy campaign_products_admin_write
  on public.campaign_products for all
  using (public.is_admin()) with check (public.is_admin());

comment on table public.campaigns is
  'Campanhas de desconto criadas no painel. Vale quando active e dentro do período.';
