-- Libera reserva activa de un producto en un carrito (p. ej. al quitar línea del carrito).
create or replace function public.release_stock_reservation (
  p_cart_id text,
  p_product_id uuid
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
    and r.product_id = p_product_id
    and r.consumed_at is null;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.release_stock_reservation (text, uuid) to anon,
authenticated;
