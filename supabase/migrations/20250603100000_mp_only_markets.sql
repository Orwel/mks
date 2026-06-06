-- Mercado Pago único; mercados CO/MX/PE/EC; trigger sin Stripe

update public.currencies
set mercadopago_supported = true
where code = 'USD';

create or replace function public.validate_market_payment_currency()
returns trigger
language plpgsql
as $$
declare
  cur record;
begin
  select mercadopago_supported
  into cur
  from public.currencies
  where code = new.default_currency;

  if not found then
    raise exception 'Moneda % no existe en currencies', new.default_currency;
  end if;

  if new.default_payment_provider <> 'mercadopago' then
    raise exception 'Solo Mercado Pago está permitido como pasarela';
  end if;

  if cur.mercadopago_supported is not true then
    raise exception 'Moneda % no es compatible con Mercado Pago', new.default_currency;
  end if;

  return new;
end;
$$;

update public.markets
set
  default_payment_provider = 'mercadopago',
  updated_at = now()
where default_payment_provider = 'stripe';

delete from public.markets
where code = 'INT';

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
  ('MX', 'México', 'MXN', 'es-MX', 'mercadopago', '🇲🇽', 1, false),
  ('PE', 'Perú', 'PEN', 'es-PE', 'mercadopago', '🇵🇪', 2, false),
  ('EC', 'Ecuador', 'USD', 'es-EC', 'mercadopago', '🇪🇨', 3, false)
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
