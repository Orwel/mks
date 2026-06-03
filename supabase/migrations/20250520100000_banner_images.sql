-- Imágenes de banners/destacados en bucket `banners` (varias por banner).

create table public.banner_images (
  id uuid primary key default gen_random_uuid (),
  banner_id uuid not null references public.banners (id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index banner_images_banner_idx on public.banner_images (banner_id);

alter table public.banners
alter column image_url drop not null;

alter table public.banners
alter column image_url set default null;

-- RLS (mismo criterio que product_images)
alter table public.banner_images enable row level security;

create policy "banner_images_select" on public.banner_images for
select
  using (
    exists (
      select
        1
      from
        public.banners b
      where
        b.id = banner_id
        and (
          b.is_active = true
          or public.is_admin ()
        )
    )
  );

create policy "banner_images_write_admin" on public.banner_images for all using (public.is_admin ())
with check (public.is_admin ());
