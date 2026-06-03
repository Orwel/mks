-- Panel catálogo / pedidos / marketing: solo administradores (alineado con `requireAdmin()` en Next).
-- Empleados conservan lecturas públicas; no mutan datos operativos del panel.

-- categories
drop policy if exists "categories_select_public" on public.categories;
drop policy if exists "categories_write_staff" on public.categories;

create policy "categories_select_public" on public.categories for
select
  using (is_active = true or public.is_admin ());

create policy "categories_write_admin" on public.categories for all using (public.is_admin ())
with check (public.is_admin ());

-- products
drop policy if exists "products_select_public" on public.products;
drop policy if exists "products_write_staff" on public.products;

create policy "products_select_public" on public.products for
select
  using (is_active = true or public.is_admin ());

create policy "products_write_admin" on public.products for all using (public.is_admin ())
with check (public.is_admin ());

-- product_images
drop policy if exists "product_images_select" on public.product_images;
drop policy if exists "product_images_write_staff" on public.product_images;

create policy "product_images_select" on public.product_images for
select
  using (
    exists (
      select
        1
      from
        public.products p
      where
        p.id = product_id
        and (
          p.is_active = true
          or public.is_admin ()
        )
    )
  );

create policy "product_images_write_admin" on public.product_images for all using (public.is_admin ())
with check (public.is_admin ());

-- legal_documents (borradores solo admin)
drop policy if exists "legal_documents_select_public_current" on public.legal_documents;

create policy "legal_documents_select_public_current" on public.legal_documents for
select
  using (is_current = true or public.is_admin ());

-- orders
drop policy if exists "orders_select_owner_or_staff" on public.orders;
drop policy if exists "orders_update_staff" on public.orders;

create policy "orders_select_owner_or_admin" on public.orders for
select
  using (user_id = auth.uid () or public.is_admin ());

create policy "orders_update_admin" on public.orders for
update
  using (public.is_admin ())
  with check (public.is_admin ());

-- order_items
drop policy if exists "order_items_select_visible_order" on public.order_items;
drop policy if exists "order_items_write_staff" on public.order_items;

create policy "order_items_select_visible_order" on public.order_items for
select
  using (
    exists (
      select
        1
      from
        public.orders o
      where
        o.id = order_id
        and (
          o.user_id = auth.uid ()
          or public.is_admin ()
        )
    )
  );

create policy "order_items_write_admin" on public.order_items for all using (public.is_admin ())
with check (public.is_admin ());

-- order_status_history
drop policy if exists "order_status_history_select_visible" on public.order_status_history;
drop policy if exists "order_status_history_write_staff" on public.order_status_history;

create policy "order_status_history_select_visible" on public.order_status_history for
select
  using (
    exists (
      select
        1
      from
        public.orders o
      where
        o.id = order_id
        and (
          o.user_id = auth.uid ()
          or public.is_admin ()
        )
    )
  );

create policy "order_status_history_write_admin" on public.order_status_history for insert
with check (public.is_admin ());

-- banners
drop policy if exists "banners_select" on public.banners;
drop policy if exists "banners_write_staff" on public.banners;

create policy "banners_select" on public.banners for
select
  using (
    public.is_admin ()
    or (
      is_active = true
      and (
        starts_at is null
        or starts_at <= now()
      )
      and (
        ends_at is null
        or ends_at >= now()
      )
    )
  );

create policy "banners_write_admin" on public.banners for all using (public.is_admin ())
with check (public.is_admin ());

-- ticker_messages
drop policy if exists "ticker_select" on public.ticker_messages;
drop policy if exists "ticker_write_staff" on public.ticker_messages;

create policy "ticker_select" on public.ticker_messages for
select
  using (
    public.is_admin ()
    or (
      is_active = true
      and (
        starts_at is null
        or starts_at <= now()
      )
      and (
        ends_at is null
        or ends_at >= now()
      )
    )
  );

create policy "ticker_write_admin" on public.ticker_messages for all using (public.is_admin ())
with check (public.is_admin ());

-- announcements
drop policy if exists "announcements_select" on public.announcements;
drop policy if exists "announcements_write_staff" on public.announcements;

create policy "announcements_select" on public.announcements for
select
  using (
    public.is_admin ()
    or (
      is_active = true
      and (
        starts_at is null
        or starts_at <= now()
      )
      and (
        ends_at is null
        or ends_at >= now()
      )
    )
  );

create policy "announcements_write_admin" on public.announcements for all using (public.is_admin ())
with check (public.is_admin ());

-- Storage: buckets de panel solo admin (catálogo / marketing / legal)
drop policy if exists "storage_legal_staff_read" on storage.objects;

create policy "storage_legal_admin_read" on storage.objects for
select
  using (bucket_id = 'legal' and public.is_admin ());

drop policy if exists "storage_product_images_staff_insert" on storage.objects;
drop policy if exists "storage_product_images_staff_update" on storage.objects;
drop policy if exists "storage_product_images_staff_delete" on storage.objects;

create policy "storage_product_images_admin_insert" on storage.objects for insert
with check (bucket_id = 'product-images' and public.is_admin ());

create policy "storage_product_images_admin_update" on storage.objects for
update
  using (bucket_id = 'product-images' and public.is_admin ())
  with check (bucket_id = 'product-images' and public.is_admin ());

create policy "storage_product_images_admin_delete" on storage.objects for delete using (
  bucket_id = 'product-images'
  and public.is_admin ()
);

drop policy if exists "storage_category_images_staff_insert" on storage.objects;
drop policy if exists "storage_category_images_staff_update" on storage.objects;
drop policy if exists "storage_category_images_staff_delete" on storage.objects;

create policy "storage_category_images_admin_insert" on storage.objects for insert
with check (bucket_id = 'category-images' and public.is_admin ());

create policy "storage_category_images_admin_update" on storage.objects for
update
  using (bucket_id = 'category-images' and public.is_admin ())
  with check (bucket_id = 'category-images' and public.is_admin ());

create policy "storage_category_images_admin_delete" on storage.objects for delete using (
  bucket_id = 'category-images'
  and public.is_admin ()
);

drop policy if exists "storage_banners_staff_insert" on storage.objects;
drop policy if exists "storage_banners_staff_update" on storage.objects;
drop policy if exists "storage_banners_staff_delete" on storage.objects;

create policy "storage_banners_admin_insert" on storage.objects for insert
with check (bucket_id = 'banners' and public.is_admin ());

create policy "storage_banners_admin_update" on storage.objects for
update
  using (bucket_id = 'banners' and public.is_admin ())
  with check (bucket_id = 'banners' and public.is_admin ());

create policy "storage_banners_admin_delete" on storage.objects for delete using (
  bucket_id = 'banners'
  and public.is_admin ()
);
