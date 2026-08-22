-- Shopee as a CATALOG SOURCE.
--
-- The first migration mirrored the Shopee catalog so the site could link to
-- it. The site is a showroom, not a checkout, so the flow changed: a Shopee
-- item is now IMPORTED as a real product (`public.products` + images in
-- Storage) and sells through the same WhatsApp CTA as everything else.
--
-- That needs two things the mirror wasn't storing:
--   * the full description and every photo URL, so the import doesn't have to
--     call Shopee again;
--   * where new items should land (`default_category_id`) and whether the
--     daily sync may import them on its own (`auto_import`).

alter table public.shopee_items
  add column description text,
  -- Every photo of the listing, in Shopee's order. The import downloads these
  -- into our own Storage bucket — we never hotlink the Shopee CDN.
  add column image_urls text[] not null default '{}';

alter table public.shopee_shops
  -- Category assigned to products created by the import. NULL disables the
  -- automatic import (a product row cannot exist without a category).
  add column default_category_id uuid references public.categories(id) on delete set null,
  add column auto_import boolean not null default false;
