-- Product versions, market stock, and inventory by country

-- ---------------------------------------------------------------------------
-- New tables
-- ---------------------------------------------------------------------------

create table public.product_versions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null,
  sku text unique,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index product_versions_product_idx on public.product_versions (product_id);

create table public.product_version_images (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.product_versions (id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index product_version_images_version_idx on public.product_version_images (version_id);

create table public.product_version_market_stock (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.product_versions (id) on delete cascade,
  market_code text not null references public.markets (code) on delete cascade,
  price numeric(12, 2) not null check (price >= 0),
  currency char(3) not null references public.currencies (code) on delete restrict,
  stock int not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (version_id, market_code)
);

create index product_version_market_stock_market_idx on public.product_version_market_stock (market_code);

comment on column public.products.price is 'DEPRECATED: use product_version_market_stock.price';
comment on column public.products.currency is 'DEPRECATED: use product_version_market_stock.currency';
comment on column public.products.stock is 'DEPRECATED: use product_version_market_stock.stock';
comment on column public.products.sku is 'DEPRECATED: use product_versions.sku';

-- ---------------------------------------------------------------------------
-- Migrate existing products → default version + market stock + images
-- ---------------------------------------------------------------------------

insert into public.product_versions (product_id, name, sku, sort_order, is_active)
select
  p.id,
  'Versión única',
  p.sku,
  0,
  true
from
  public.products p;

insert into public.product_version_market_stock (version_id, market_code, price, currency, stock, is_active)
select
  pv.id,
  m.code,
  p.price,
  coalesce(p.currency, m.default_currency),
  p.stock,
  p.is_active
from
  public.product_versions pv
  join public.products p on p.id = pv.product_id
  cross join public.markets m
where
  pv.name = 'Versión única';

insert into public.product_version_images (version_id, storage_path, alt_text, sort_order, is_primary, created_at)
select
  pv.id,
  pi.storage_path,
  pi.alt_text,
  pi.sort_order,
  pi.is_primary,
  pi.created_at
from
  public.product_images pi
  join public.product_versions pv on pv.product_id = pi.product_id
  and pv.name = 'Versión única';

-- ---------------------------------------------------------------------------
-- stock_reservations: version + market
-- ---------------------------------------------------------------------------

alter table public.stock_reservations
add column version_id uuid references public.product_versions (id) on delete cascade,
add column market_code text references public.markets (code) on delete cascade;

update public.stock_reservations r
set
  version_id = pv.id,
  market_code = coalesce(
    (
      select o.market_code
      from public.orders o
      where o.id = r.order_id
    ),
    (
      select m.code
      from public.markets m
      where m.is_active = true
      order by m.sort_order
      limit 1
    ),
    'CO'
  )
from
  public.product_versions pv
where
  pv.product_id = r.product_id
  and pv.name = 'Versión única';

alter table public.stock_reservations
alter column version_id set not null,
alter column market_code set not null;

drop index if exists public.stock_reservations_active_cart_product;

create unique index stock_reservations_active_cart_version on public.stock_reservations (
  cart_id,
  version_id,
  market_code
)
where
  consumed_at is null;

create index stock_reservations_version_market_idx on public.stock_reservations (version_id, market_code);

-- ---------------------------------------------------------------------------
-- order_items: version snapshot
-- ---------------------------------------------------------------------------

alter table public.order_items
add column version_id uuid references public.product_versions (id) on delete restrict,
add column version_name text;

-- ---------------------------------------------------------------------------
-- Views
-- ---------------------------------------------------------------------------

drop view if exists public.products_with_available_stock;

create or replace view public.product_versions_market_availability
with (security_invoker = true) as
select
  pv.id as version_id,
  pv.product_id,
  pv.name as version_name,
  pv.sku,
  pv.sort_order as version_sort_order,
  pv.is_active as version_active,
  pvms.market_code,
  pvms.price,
  pvms.currency,
  pvms.stock,
  pvms.is_active as market_stock_active,
  greatest(
    pvms.stock - coalesce(
      (
        select
          sum(r.quantity)::int
        from
          public.stock_reservations r
        where
          r.version_id = pv.id
          and r.market_code = pvms.market_code
          and r.consumed_at is null
          and r.expires_at > now()
      ),
      0
    ),
    0
  ) as available_stock
from
  public.product_versions pv
  join public.product_version_market_stock pvms on pvms.version_id = pv.id;

grant
select
  on public.product_versions_market_availability to anon,
  authenticated;

create or replace view public.products_market_catalog
with (security_invoker = true) as
select
  p.id,
  p.slug,
  p.name,
  p.description,
  p.category_id,
  p.is_featured,
  p.is_active,
  p.metadata,
  p.created_at,
  p.updated_at,
  a.market_code,
  min(a.price) filter (
    where
      a.version_active
      and a.market_stock_active
      and a.available_stock > 0
  ) as price,
  (
    select
      a2.currency
    from
      public.product_versions_market_availability a2
    where
      a2.product_id = p.id
      and a2.market_code = a.market_code
      and a2.version_active
      and a2.market_stock_active
    order by
      a2.available_stock desc,
      a2.price asc
    limit
      1
  ) as currency,
  coalesce(
    sum(a.available_stock) filter (
      where
        a.version_active
        and a.market_stock_active
    ),
    0
  )::int as available_stock,
  (
    select
      a3.sku
    from
      public.product_versions_market_availability a3
    where
      a3.product_id = p.id
      and a3.market_code = a.market_code
      and a3.version_active
      and a3.market_stock_active
      and a3.available_stock > 0
    order by
      a3.version_sort_order,
      a3.price
    limit
      1
  ) as sku
from
  public.products p
  join public.product_versions_market_availability a on a.product_id = p.id
group by
  p.id,
  a.market_code;

grant
select
  on public.products_market_catalog to anon,
  authenticated;

-- Backward-compatible view (uses CO market by default for legacy queries)
create or replace view public.products_with_available_stock
with (security_invoker = true) as
select
  p.id,
  p.slug,
  p.name,
  p.description,
  p.category_id,
  coalesce(c.price, 0) as price,
  coalesce(c.currency, 'COP'::char(3)) as currency,
  coalesce(c.available_stock, 0) as available_stock,
  c.sku,
  p.is_featured,
  p.is_active,
  p.metadata,
  p.created_by,
  p.updated_by,
  p.created_at,
  p.updated_at
from
  public.products p
  left join public.products_market_catalog c on c.id = p.id
  and c.market_code = 'CO';

grant
select
  on public.products_with_available_stock to anon,
  authenticated;

-- ---------------------------------------------------------------------------
-- RPC: reserve / release / fulfill
-- ---------------------------------------------------------------------------

drop function if exists public.reserve_stock (uuid, int, text, uuid, int);

create or replace function public.reserve_stock (
  p_version_id uuid,
  p_market_code text,
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
  v_product_id uuid;
  v_stock int;
  v_reserved int;
  v_version_active boolean;
  v_market_stock_active boolean;
  v_product_active boolean;
begin
  if p_quantity <= 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_quantity');
  end if;

  if length(trim(p_cart_id)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_cart');
  end if;

  select
    pvms.stock,
    pv.product_id,
    pv.is_active,
    pvms.is_active,
    p.is_active
  into
    v_stock,
    v_product_id,
    v_version_active,
    v_market_stock_active,
    v_product_active
  from
    public.product_version_market_stock pvms
    join public.product_versions pv on pv.id = pvms.version_id
    join public.products p on p.id = pv.product_id
  where
    pvms.version_id = p_version_id
    and pvms.market_code = p_market_code
  for update of pvms;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'product_not_found');
  end if;

  if not v_product_active or not v_version_active or not v_market_stock_active then
    return jsonb_build_object('ok', false, 'error', 'product_not_found');
  end if;

  select
    coalesce(sum(r.quantity), 0)::int
  into
    v_reserved
  from
    public.stock_reservations r
  where
    r.version_id = p_version_id
    and r.market_code = p_market_code
    and r.consumed_at is null
    and r.expires_at > now();

  v_available := greatest(v_stock - v_reserved, 0);

  if v_available < p_quantity then
    return jsonb_build_object('ok', false, 'error', 'insufficient_stock');
  end if;

  delete from public.stock_reservations r
  where
    r.cart_id = p_cart_id
    and r.version_id = p_version_id
    and r.market_code = p_market_code
    and r.consumed_at is null;

  insert into public.stock_reservations (
    product_id,
    version_id,
    market_code,
    cart_id,
    user_id,
    quantity,
    expires_at
  )
  values (
    v_product_id,
    p_version_id,
    p_market_code,
    p_cart_id,
    p_user_id,
    p_quantity,
    now() + (greatest(p_ttl_minutes, 1) || ' minutes')::interval
  );

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.reserve_stock (uuid, text, int, text, uuid, int) to anon,
authenticated;

drop function if exists public.release_stock_reservation (text, uuid);

create or replace function public.release_stock_reservation (
  p_cart_id text,
  p_version_id uuid,
  p_market_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if length(trim(p_cart_id)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_cart');
  end if;

  delete from public.stock_reservations r
  where
    r.cart_id = p_cart_id
    and r.version_id = p_version_id
    and r.market_code = p_market_code
    and r.consumed_at is null;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.release_stock_reservation (text, uuid, text) to anon,
authenticated;

create or replace function public.fulfill_order_payment(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
  v_market text;
begin
  select * into v_order from public.orders where id = p_order_id for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'order_not_found');
  end if;

  if v_order.payment_status = 'paid' then
    return jsonb_build_object('ok', true, 'already_paid', true);
  end if;

  v_market := coalesce(v_order.market_code, 'CO');

  for v_item in
    select version_id, product_id, quantity
    from public.order_items
    where order_id = p_order_id
  loop
    if v_item.version_id is not null then
      update public.product_version_market_stock
      set
        stock = greatest(stock - v_item.quantity, 0),
        updated_at = now()
      where
        version_id = v_item.version_id
        and market_code = v_market;

      update public.stock_reservations
      set
        consumed_at = now(),
        order_id = p_order_id
      where
        version_id = v_item.version_id
        and market_code = v_market
        and consumed_at is null
        and order_id is null;
    else
      update public.products
      set stock = greatest(stock - v_item.quantity, 0)
      where id = v_item.product_id;

      update public.stock_reservations
      set
        consumed_at = now(),
        order_id = p_order_id
      where
        product_id = v_item.product_id
        and consumed_at is null
        and order_id is null;
    end if;
  end loop;

  update public.orders
  set payment_status = 'paid', status = 'paid', updated_at = now()
  where id = p_order_id;

  insert into public.order_status_history (order_id, from_status, to_status, reason)
  values (p_order_id, v_order.status, 'paid', 'payment_confirmed');

  return jsonb_build_object('ok', true);
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.product_versions enable row level security;
alter table public.product_version_images enable row level security;
alter table public.product_version_market_stock enable row level security;

create policy "product_versions_select_public" on public.product_versions for
select
  using (
    is_active = true
    or public.is_staff()
  );

create policy "product_versions_write_staff" on public.product_versions for all using (public.is_staff())
with check (public.is_staff());

create policy "product_version_images_select" on public.product_version_images for
select
  using (
    exists (
      select
        1
      from
        public.product_versions pv
        join public.products p on p.id = pv.product_id
      where
        pv.id = version_id
        and (
          (pv.is_active = true and p.is_active = true)
          or public.is_staff()
        )
    )
  );

create policy "product_version_images_write_staff" on public.product_version_images for all using (public.is_staff())
with check (public.is_staff());

create policy "product_version_market_stock_select_public" on public.product_version_market_stock for
select
  using (
    is_active = true
    or public.is_staff()
  );

create policy "product_version_market_stock_write_staff" on public.product_version_market_stock for all using (public.is_staff())
with check (public.is_staff());

-- updated_at triggers
create trigger product_versions_set_updated_at
before update on public.product_versions
for each row
execute function public.set_updated_at();

create trigger product_version_market_stock_set_updated_at
before update on public.product_version_market_stock
for each row
execute function public.set_updated_at();
