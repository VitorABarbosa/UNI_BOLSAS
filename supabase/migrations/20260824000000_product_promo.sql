-- Preço promocional por produto.
--
-- Antes o produto tinha só `price_retail` (varejo) e `price_wholesale` (texto
-- livre do atacado). Não havia como colocar uma peça em promoção sem perder o
-- preço cheio — e sem o preço cheio o site não consegue mostrar o "de/por",
-- que é o que faz a promoção parecer promoção.
--
-- Modelo:
--   * `price_retail`  continua sendo o preço CHEIO (o "de").
--   * `price_promo`   é o preço vigente quando há promoção (o "por").
--   * `promo_ends_at` opcional: passou da data, a promoção some sozinha do
--     site sem ninguém precisar lembrar de tirar.
--
-- A promoção está ativa quando `price_promo` não é nulo, é menor que
-- `price_retail`, e `promo_ends_at` é nulo ou está no futuro.

alter table public.products
  add column if not exists price_promo   numeric(10, 2),
  add column if not exists promo_ends_at timestamptz;

-- Promoção que não é desconto não faz sentido e confundiria o "de/por".
alter table public.products
  drop constraint if exists products_price_promo_below_retail;
alter table public.products
  add constraint products_price_promo_below_retail
  check (price_promo is null or price_promo < price_retail);

comment on column public.products.price_promo is
  'Preço promocional vigente (o "por"). NULL = sem promoção. Sempre menor que price_retail.';
comment on column public.products.promo_ends_at is
  'Fim da promoção. NULL = sem prazo. Passada a data, o site volta a mostrar price_retail.';

-- O catálogo público filtra por promoção ativa; sem índice isso é varredura.
create index if not exists products_promo_idx
  on public.products (price_promo)
  where price_promo is not null;
