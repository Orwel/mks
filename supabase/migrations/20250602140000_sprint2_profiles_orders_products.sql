-- Perfil, pedidos, productos (Sprint 2)

alter table public.profiles
add column if not exists market_code text references public.markets (code) on delete set null;

alter table public.orders
add column if not exists market_code text references public.markets (code) on delete set null,
add column if not exists stripe_checkout_session_id text,
add column if not exists stripe_payment_intent_id text;

create index if not exists orders_stripe_session_idx on public.orders (stripe_checkout_session_id)
where
  stripe_checkout_session_id is not null;

alter table public.order_items
add column if not exists currency char(3) references public.currencies (code) on delete restrict,
add column if not exists unit_price_cop_snapshot numeric(18, 8);

-- Vista depende de products.currency; recrear tras cambio de tipo
drop view if exists public.products_with_available_stock;

update public.products
set
  currency = 'COP'
where
  currency is null
  or length(trim(currency)) <> 3;

alter table public.products
alter column currency type char(3) using upper(trim(currency))::char(3);

alter table public.products
drop constraint if exists products_currency_fkey;

alter table public.products
add constraint products_currency_fkey foreign key (currency) references public.currencies (code) on delete restrict;

update public.orders
set
  currency = 'COP'
where
  currency is null
  or length(trim(currency)) <> 3;

alter table public.orders
alter column currency type char(3) using upper(trim(currency))::char(3);

alter table public.orders
drop constraint if exists orders_currency_fkey;

alter table public.orders
add constraint orders_currency_fkey foreign key (currency) references public.currencies (code) on delete restrict;

create or replace view public.products_with_available_stock with (security_invoker = true) as
select
  p.*,
  greatest(
    p.stock - coalesce(
      (
        select
          sum(r.quantity)::int
        from
          public.stock_reservations r
        where
          r.product_id = p.id
          and r.consumed_at is null
          and r.expires_at > now()
      ),
      0
    ),
    0
  ) as available_stock
from
  public.products p;

grant
select
  on public.products_with_available_stock to anon,
  authenticated;
