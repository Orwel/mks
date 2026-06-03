-- Mercados configurables por admin (Sprint 2)

create table public.markets (
  code text primary key check (code ~ '^[A-Z0-9_]{2,10}$'),
  name text not null,
  default_currency char(3) not null references public.currencies (code) on delete restrict,
  default_locale text not null default 'es',
  default_payment_provider public.payment_provider not null,
  flag_emoji text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index markets_active_sort_idx on public.markets (is_active, sort_order);

create trigger markets_set_updated_at
before update on public.markets
for each row execute function public.set_updated_at();

create or replace function public.validate_market_payment_currency()
returns trigger
language plpgsql
as $$
declare
  cur record;
begin
  select stripe_presentment, mercadopago_supported
  into cur
  from public.currencies
  where code = new.default_currency;

  if not found then
    raise exception 'Moneda % no existe en currencies', new.default_currency;
  end if;

  if new.default_payment_provider = 'stripe' and cur.stripe_presentment is not true then
    raise exception 'Moneda % no es compatible con Stripe', new.default_currency;
  end if;

  if new.default_payment_provider = 'mercadopago' and cur.mercadopago_supported is not true then
    raise exception 'Moneda % no es compatible con Mercado Pago', new.default_currency;
  end if;

  return new;
end;
$$;

create trigger markets_validate_payment_currency
before insert or update on public.markets
for each row execute function public.validate_market_payment_currency();

alter table public.markets enable row level security;

create policy "markets_select_active_or_admin" on public.markets for
select
  using (is_active = true or public.is_admin ());

create policy "markets_write_admin" on public.markets for all using (public.is_admin ())
with check (public.is_admin ());

insert into
  public.markets (
    code,
    name,
    default_currency,
    default_locale,
    default_payment_provider,
    flag_emoji,
    sort_order,
    is_active
  )
values
  ('CO', 'Colombia', 'COP', 'es-CO', 'mercadopago', '🇨🇴', 0, true),
  ('INT', 'Internacional', 'USD', 'en-US', 'stripe', '🌎', 1, true)
on conflict (code) do update
set
  name = excluded.name,
  default_currency = excluded.default_currency,
  default_locale = excluded.default_locale,
  default_payment_provider = excluded.default_payment_provider,
  flag_emoji = excluded.flag_emoji,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();
