-- Vista de stock disponible (considera reservas activas)
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
