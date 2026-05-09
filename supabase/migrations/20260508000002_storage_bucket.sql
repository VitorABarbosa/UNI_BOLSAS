-- Storage bucket for product images.
-- Public read, admin write -- the same access pattern as the catalog tables.
-- SVG is in allowed mime types so the seed script can upload generated
-- placeholders; can be removed later once admin uploads only real photos.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'products',
  'products',
  true,
  5242880,
  array['image/webp', 'image/jpeg', 'image/png', 'image/svg+xml']
)
on conflict (id) do nothing;

create policy products_bucket_read_public
  on storage.objects for select
  using (bucket_id = 'products');

create policy products_bucket_admin_insert
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'products' and public.is_admin());

create policy products_bucket_admin_update
  on storage.objects for update
  to authenticated
  using (bucket_id = 'products' and public.is_admin())
  with check (bucket_id = 'products' and public.is_admin());

create policy products_bucket_admin_delete
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'products' and public.is_admin());
