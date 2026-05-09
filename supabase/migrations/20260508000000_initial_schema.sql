-- Initial schema for Uni Bolsas catalog.
-- See docs/superpowers/specs/2026-05-08-uni-bolsas-stack-migration-design.md §4.1
-- for the modeling decisions behind these choices.

create extension if not exists pgcrypto;

-- ============================================================================
-- Tables
-- ============================================================================

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  label       text not null,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.products (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,
  name              text not null,
  tagline           text,
  description       text,
  category_id       uuid not null references public.categories(id) on delete restrict,
  badge             text,
  price_retail      numeric(10, 2) not null,
  price_wholesale   text,
  dimensions        text,
  weight            text,
  material          text,
  sizes             text[] not null default '{Único}',
  active            boolean not null default true,
  sort_order        int not null default 0,
  seo_title         text,
  seo_description   text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index products_category_id_idx on public.products (category_id);
create index products_active_sort_order_idx on public.products (active, sort_order);

create table public.product_colors (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  name        text not null,
  hex         text not null,
  accent_hex  text,
  sort_order  int  not null default 0
);

create index product_colors_product_id_sort_order_idx
  on public.product_colors (product_id, sort_order);

create table public.product_images (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products(id) on delete cascade,
  color_id      uuid     references public.product_colors(id) on delete cascade,
  storage_path  text not null,
  alt           text,
  sort_order    int  not null default 0
);

create index product_images_product_color_sort_idx
  on public.product_images (product_id, color_id, sort_order);

create table public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- updated_at triggers
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();
