-- My Korea Store — esquema inicial (Postgres / Supabase)
-- Extensiones
create extension if not exists "pgcrypto";

-- Enums
create type public.user_role as enum ('customer', 'employee', 'admin');

create type public.order_status as enum (
  'cart',
  'pending_payment',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
);

create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');

create type public.payment_provider as enum ('stripe', 'mercadopago');

create type public.banner_position as enum ('hero', 'secondary', 'sidebar');

create type public.announcement_display_mode as enum ('modal', 'toast', 'bar');

create type public.announcement_frequency as enum (
  'once_per_session',
  'once_per_user',
  'always'
);

create type public.legal_document_type as enum ('terms', 'privacy');

-- Perfiles (1:1 con auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text,
  role public.user_role not null default 'customer',
  is_active boolean not null default true,
  default_address jsonb,
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);

-- Categorías
create table public.categories (
  id uuid primary key default gen_random_uuid (),
  slug text not null unique,
  name text not null,
  description text,
  image_url text,
  parent_id uuid references public.categories (id) on delete set null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index categories_parent_idx on public.categories (parent_id);

-- Productos (precio base en COP)
create table public.products (
  id uuid primary key default gen_random_uuid (),
  slug text not null unique,
  name text not null,
  description text,
  category_id uuid not null references public.categories (id) on delete restrict,
  price numeric(12, 2) not null check (price >= 0),
  currency text not null default 'COP',
  stock int not null default 0 check (stock >= 0),
  sku text unique,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_idx on public.products (category_id);
create index products_featured_idx on public.products (is_featured) where is_featured = true;

-- Imágenes de producto (paths en bucket product-images)
create table public.product_images (
  id uuid primary key default gen_random_uuid (),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index product_images_product_idx on public.product_images (product_id);

-- Tasas de cambio (referencia; COP como base)
create table public.currency_rates (
  id uuid primary key default gen_random_uuid (),
  currency text not null,
  rate_to_cop numeric(18, 8) not null check (rate_to_cop > 0),
  rate_date date not null default (timezone ('utc', now()))::date,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  unique (currency, rate_date)
);

-- Documentos legales versionados
create table public.legal_documents (
  id uuid primary key default gen_random_uuid (),
  type public.legal_document_type not null,
  version text not null,
  content text not null,
  published_at timestamptz not null default now(),
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (type, version)
);

create index legal_documents_current_idx on public.legal_documents (type)
where
  is_current = true;

-- Aceptaciones legales (evidencia checkout)
create table public.legal_acceptances (
  id uuid primary key default gen_random_uuid (),
  user_id uuid references public.profiles (id) on delete set null,
  email text not null,
  terms_document_id uuid not null references public.legal_documents (id) on delete restrict,
  privacy_document_id uuid not null references public.legal_documents (id) on delete restrict,
  accepted_at timestamptz not null default now(),
  ip_address text,
  user_agent text
);

create index legal_acceptances_user_idx on public.legal_acceptances (user_id);
create index legal_acceptances_email_idx on public.legal_acceptances (email);

-- Pedidos
create table public.orders (
  id uuid primary key default gen_random_uuid (),
  order_number text not null unique,
  user_id uuid references public.profiles (id) on delete set null,
  status public.order_status not null default 'pending_payment',
  subtotal numeric(12, 2) not null default 0,
  shipping numeric(12, 2) not null default 0,
  discount numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  currency text not null default 'COP',
  rate_to_cop_snapshot numeric(18, 8),
  payment_provider public.payment_provider,
  payment_external_id text,
  payment_status public.payment_status not null default 'pending',
  shipping_address jsonb,
  billing_address jsonb,
  customer_email text not null,
  customer_phone text,
  customer_name text not null,
  notes text,
  legal_acceptance_id uuid not null references public.legal_acceptances (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_user_idx on public.orders (user_id);
create index orders_status_idx on public.orders (status);

-- Ítems de pedido (snapshots)
create table public.order_items (
  id uuid primary key default gen_random_uuid (),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  product_name text not null,
  unit_price numeric(12, 2) not null,
  quantity int not null check (quantity > 0),
  subtotal numeric(12, 2) generated always as (unit_price * quantity) stored,
  created_at timestamptz not null default now()
);

create index order_items_order_idx on public.order_items (order_id);

-- Historial de estados
create table public.order_status_history (
  id uuid primary key default gen_random_uuid (),
  order_id uuid not null references public.orders (id) on delete cascade,
  from_status public.order_status,
  to_status public.order_status not null,
  changed_by uuid references auth.users (id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);

create index order_status_history_order_idx on public.order_status_history (order_id);

-- Reservas de stock (TTL ~15 min; consumo al confirmar pago)
create table public.stock_reservations (
  id uuid primary key default gen_random_uuid (),
  product_id uuid not null references public.products (id) on delete cascade,
  cart_id text not null,
  user_id uuid references auth.users (id) on delete set null,
  quantity int not null check (quantity > 0),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  order_id uuid references public.orders (id) on delete set null,
  created_at timestamptz not null default now()
);

create index stock_reservations_product_idx on public.stock_reservations (product_id);

create unique index stock_reservations_active_cart_product on public.stock_reservations (
  cart_id,
  product_id
)
where
  consumed_at is null;

-- Contenido dinámico landing
create table public.banners (
  id uuid primary key default gen_random_uuid (),
  title text,
  subtitle text,
  image_url text not null,
  link_url text,
  position public.banner_position not null default 'secondary',
  starts_at timestamptz,
  ends_at timestamptz,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ticker_messages (
  id uuid primary key default gen_random_uuid (),
  message text not null,
  link_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.announcements (
  id uuid primary key default gen_random_uuid (),
  title text not null,
  body text not null,
  image_url text,
  cta_label text,
  cta_url text,
  display_mode public.announcement_display_mode not null default 'modal',
  frequency public.announcement_frequency not null default 'once_per_session',
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Webhooks idempotentes
create table public.webhook_events (
  id uuid primary key default gen_random_uuid (),
  provider public.payment_provider not null,
  external_id text not null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, external_id)
);

-- Auditoría
create table public.audit_log (
  id uuid primary key default gen_random_uuid (),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_table text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- updated_at genérico
create or replace function public.set_updated_at ()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at ();

create trigger set_categories_updated_at
before update on public.categories
for each row
execute function public.set_updated_at ();

create trigger set_products_updated_at
before update on public.products
for each row
execute function public.set_updated_at ();

create trigger set_orders_updated_at
before update on public.orders
for each row
execute function public.set_updated_at ();

create trigger set_legal_documents_updated_at
before update on public.legal_documents
for each row
execute function public.set_updated_at ();

create trigger set_banners_updated_at
before update on public.banners
for each row
execute function public.set_updated_at ();

create trigger set_ticker_updated_at
before update on public.ticker_messages
for each row
execute function public.set_updated_at ();

create trigger set_announcements_updated_at
before update on public.announcements
for each row
execute function public.set_updated_at ();

-- Perfil al registrarse
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'customer'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user ();

-- Helpers RLS
create or replace function public.is_staff ()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select
      1
    from
      public.profiles p
    where
      p.id = auth.uid ()
      and p.role in ('admin', 'employee')
      and p.is_active = true
  );
$$;

create or replace function public.is_admin ()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select
      1
    from
      public.profiles p
    where
      p.id = auth.uid ()
      and p.role = 'admin'
      and p.is_active = true
  );
$$;

-- Reserva atómica de inventario
create or replace function public.reserve_stock (
  p_product_id uuid,
  p_quantity int,
  p_cart_id text,
  p_user_id uuid default null,
  p_ttl_minutes int default 15
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_available int;
begin
  if p_quantity <= 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_quantity');
  end if;

  if length(trim(p_cart_id)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_cart');
  end if;

  select
    p.stock - coalesce(
      (
        select
          sum(r.quantity)::int
        from
          public.stock_reservations r
        where
          r.product_id = p_product_id
          and r.consumed_at is null
          and r.expires_at > now()
      ),
      0
    )
  into
    v_available
  from
    public.products p
  where
    p.id = p_product_id
    and p.is_active = true
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'product_not_found');
  end if;

  if v_available < p_quantity then
    return jsonb_build_object('ok', false, 'error', 'insufficient_stock');
  end if;

  delete from public.stock_reservations r
  where r.cart_id = p_cart_id
    and r.product_id = p_product_id
    and r.consumed_at is null;

  insert into public.stock_reservations (
    product_id,
    cart_id,
    user_id,
    quantity,
    expires_at
  )
  values (
    p_product_id,
    p_cart_id,
    p_user_id,
    p_quantity,
    now() + (greatest(p_ttl_minutes, 1) || ' minutes')::interval
  );

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.reserve_stock (uuid, int, text, uuid, int) to anon,
authenticated;

create or replace function public.cleanup_expired_stock_reservations ()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.stock_reservations
  where consumed_at is null
    and expires_at < now();
$$;

grant execute on function public.cleanup_expired_stock_reservations () to service_role;
