-- Tasas de cambio iniciales (COP base)

insert into
  public.currency_rates (currency, rate_to_cop, source)
values
  ('COP', 1, 'seed'),
  ('USD', 4200, 'seed'),
  ('EUR', 4600, 'seed'),
  ('MXN', 240, 'seed'),
  ('GBP', 5300, 'seed'),
  ('CAD', 3100, 'seed'),
  ('BRL', 820, 'seed'),
  ('ARS', 4.5, 'seed'),
  ('CLP', 4.2, 'seed'),
  ('PEN', 1120, 'seed'),
  ('UYU', 105, 'seed')
on conflict (currency, rate_date) do update
set
  rate_to_cop = excluded.rate_to_cop,
  source = excluded.source;
