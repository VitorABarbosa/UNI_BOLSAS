-- RLS for the catalog tables.
-- - Catalog tables (categories, products, product_colors, product_images):
--   * SELECT  -> public (anyone, even logged-out)
--   * INSERT/UPDATE/DELETE -> only rows where public.is_admin() is true
-- - admins: RLS enabled with NO policies => only service_role can touch it.

-- ---------------------------------------------------------------------------
-- is_admin() helper. SECURITY DEFINER so policies can read public.admins
-- regardless of the caller's own RLS, and the search_path is pinned so it
-- cannot be hijacked by a malicious schema in the caller's path.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Catalog tables: enable RLS + 4 policies each.
-- ---------------------------------------------------------------------------

-- categories
alter table public.categories enable row level security;

create policy categories_read_public
  on public.categories for select
  using (true);

create policy categories_admin_insert
  on public.categories for insert
  to authenticated
  with check (public.is_admin());

create policy categories_admin_update
  on public.categories for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy categories_admin_delete
  on public.categories for delete
  to authenticated
  using (public.is_admin());

-- products
alter table public.products enable row level security;

create policy products_read_public
  on public.products for select
  using (true);

create policy products_admin_insert
  on public.products for insert
  to authenticated
  with check (public.is_admin());

create policy products_admin_update
  on public.products for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy products_admin_delete
  on public.products for delete
  to authenticated
  using (public.is_admin());

-- product_colors
alter table public.product_colors enable row level security;

create policy product_colors_read_public
  on public.product_colors for select
  using (true);

create policy product_colors_admin_insert
  on public.product_colors for insert
  to authenticated
  with check (public.is_admin());

create policy product_colors_admin_update
  on public.product_colors for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy product_colors_admin_delete
  on public.product_colors for delete
  to authenticated
  using (public.is_admin());

-- product_images
alter table public.product_images enable row level security;

create policy product_images_read_public
  on public.product_images for select
  using (true);

create policy product_images_admin_insert
  on public.product_images for insert
  to authenticated
  with check (public.is_admin());

create policy product_images_admin_update
  on public.product_images for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy product_images_admin_delete
  on public.product_images for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- admins: RLS on, no policies. Only service_role bypasses RLS.
-- ---------------------------------------------------------------------------
alter table public.admins enable row level security;
