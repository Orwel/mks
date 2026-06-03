-- Apariencia del sitio (singleton editable desde admin)

create table public.site_settings (
  id int primary key default 1 check (id = 1),
  brand_colors jsonb not null default '{
    "pink": "#ff1b8d",
    "cyan": "#00d4dd",
    "ink": "#0a0a0a",
    "cream": "#fff8f5"
  }'::jsonb,
  hero jsonb not null default '{
    "badge": "From Korea to K-lover",
    "title": "Auténtico sabor coreano, directo a tu puerta",
    "subtitle": "Snacks, skincare, bebidas y más — con la energía visual de My Korea Store.",
    "cta_catalog": "Ver catálogo",
    "cta_login": "Ingresar",
    "bg_from": "#fff8f5",
    "bg_via": "#ffffff",
    "bg_to": "rgba(0,212,221,0.25)"
  }'::jsonb,
  footer jsonb not null default '{
    "tagline": "Productos coreanos auténticos",
    "copyright": "My Korea Store",
    "terms_label": "Términos",
    "privacy_label": "Privacidad"
  }'::jsonb,
  buttons jsonb not null default '{
    "add_to_cart": "Añadir al carrito",
    "view_detail": "Ver detalle",
    "view_catalog": "Ver catálogo",
    "apply_filters": "Aplicar filtros",
    "clear_filters": "Limpiar"
  }'::jsonb,
  sections jsonb not null default '{
    "featured_bg": "#ffffff",
    "categories_bg": "#fff8f5",
    "catalog_title": "Catálogo"
  }'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

insert into public.site_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.site_settings enable row level security;

create policy "site_settings_select_all" on public.site_settings for
select
  using (true);

create policy "site_settings_write_admin" on public.site_settings for all using (public.is_admin ())
with check (public.is_admin ());
