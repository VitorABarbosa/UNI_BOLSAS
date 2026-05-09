-- Switch products → categories FK from on delete restrict to on delete cascade.
-- See docs/superpowers/specs/2026-05-09-uni-bolsas-admin-design.md §3.6
-- Removing a category should cascade to its products (admin UX decision).

alter table public.products drop constraint products_category_id_fkey;

alter table public.products
  add constraint products_category_id_fkey
  foreign key (category_id) references public.categories(id) on delete cascade;
