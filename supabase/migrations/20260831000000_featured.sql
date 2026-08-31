-- Peças em destaque ("as que mais vendem"), escolhidas a dedo no painel.
--
-- Uma coluna e não uma tabela: destaque é uma propriedade do produto, não uma
-- entidade com vida própria. Some junto quando o produto some, e a consulta
-- do catálogo não ganha nenhum join.
--
-- `if not exists` nas duas linhas: rodar de novo não dá erro nem desfaz nada.
-- É aditiva — não altera nem apaga coluna alguma que já exista.

alter table public.products
  add column if not exists featured boolean not null default false;

-- Índice parcial: só indexa as linhas em destaque, que são um punhado. A
-- consulta da vitrine filtra exatamente por `featured = true`.
create index if not exists products_featured_idx
  on public.products (sort_order)
  where featured;
