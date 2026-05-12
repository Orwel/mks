-- Buckets de Storage (Supabase)
insert into
  storage.buckets (id, name, public)
values
  ('product-images', 'product-images', true),
  ('category-images', 'category-images', true),
  ('banners', 'banners', true),
  ('legal', 'legal', false)
on conflict (id) do nothing;

-- Lectura pública de buckets públicos
create policy "storage_product_images_public_read" on storage.objects for
select
  using (bucket_id = 'product-images');

create policy "storage_category_images_public_read" on storage.objects for
select
  using (bucket_id = 'category-images');

create policy "storage_banners_public_read" on storage.objects for
select
  using (bucket_id = 'banners');

-- legal: solo staff
create policy "storage_legal_staff_read" on storage.objects for
select
  using (bucket_id = 'legal' and public.is_staff ());

create policy "storage_legal_admin_write" on storage.objects for insert
with check (bucket_id = 'legal' and public.is_admin ());

create policy "storage_legal_admin_update" on storage.objects for
update
  using (bucket_id = 'legal' and public.is_admin ())
  with check (bucket_id = 'legal' and public.is_admin ());

create policy "storage_legal_admin_delete" on storage.objects for delete using (
  bucket_id = 'legal'
  and public.is_admin ()
);

-- Escritura staff en buckets públicos de catálogo / marketing
create policy "storage_product_images_staff_insert" on storage.objects for insert
with check (bucket_id = 'product-images' and public.is_staff ());

create policy "storage_product_images_staff_update" on storage.objects for
update
  using (bucket_id = 'product-images' and public.is_staff ())
  with check (bucket_id = 'product-images' and public.is_staff ());

create policy "storage_product_images_staff_delete" on storage.objects for delete using (
  bucket_id = 'product-images'
  and public.is_staff ()
);

create policy "storage_category_images_staff_insert" on storage.objects for insert
with check (bucket_id = 'category-images' and public.is_staff ());

create policy "storage_category_images_staff_update" on storage.objects for
update
  using (bucket_id = 'category-images' and public.is_staff ())
  with check (bucket_id = 'category-images' and public.is_staff ());

create policy "storage_category_images_staff_delete" on storage.objects for delete using (
  bucket_id = 'category-images'
  and public.is_staff ()
);

create policy "storage_banners_staff_insert" on storage.objects for insert
with check (bucket_id = 'banners' and public.is_staff ());

create policy "storage_banners_staff_update" on storage.objects for
update
  using (bucket_id = 'banners' and public.is_staff ())
  with check (bucket_id = 'banners' and public.is_staff ());

create policy "storage_banners_staff_delete" on storage.objects for delete using (
  bucket_id = 'banners'
  and public.is_staff ()
);
