-- Corrige una sobreventa real en `fulfill_order_payment`.
--
-- SÍNTOMA REPRODUCIDO
--   Stock inicial 10. A reserva 3, B reserva 2. A paga.
--   `fulfill_order_payment` consumía TODAS las reservas activas de esa versión
--   y mercado —no sólo las del pedido que se estaba pagando—, así que la
--   reserva de B quedaba consumida y atribuida al pedido de A.
--   Resultado: la tienda volvía a ofrecer el stock que B tenía apartado.
--   Encadenando el efecto se llegó a vender y cobrar 12 unidades de 10.
--
-- CAUSA
--   El UPDATE sobre `stock_reservations` filtraba sólo por version_id +
--   market_code + consumed_at is null, sin ninguna condición que lo atara al
--   comprador del pedido.
--
-- SOLUCIÓN
--   1. `orders.cart_id` guarda el carrito que originó el pedido.
--   2. El consumo de reservas se limita a ese carrito. Para pedidos anteriores
--      a esta migración (sin cart_id) se cae a `user_id`; si tampoco hay, no se
--      toca ninguna reserva ajena y se deja que expiren por TTL.
--   3. Si el stock fuese a quedar negativo se registra en `audit_log` en vez de
--      enmascararlo en silencio con greatest(...,0).

alter table public.orders
  add column if not exists cart_id text;

create index if not exists orders_cart_idx on public.orders (cart_id)
where
  cart_id is not null;

comment on column public.orders.cart_id is
  'Carrito (cookie mks_cart_id) que originó el pedido. Ata el pedido a sus reservas de stock.';

create or replace function public.fulfill_order_payment (p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
  v_market text;
  v_stock_before int;
  v_faltante int;
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
      select stock into v_stock_before
      from public.product_version_market_stock
      where version_id = v_item.version_id and market_code = v_market
      for update;

      -- Dejar rastro si el pedido excede el stock disponible: antes esto
      -- desaparecía dentro de greatest(...,0) y nadie se enteraba.
      if v_stock_before is not null and v_stock_before < v_item.quantity then
        v_faltante := v_item.quantity - v_stock_before;
        insert into public.audit_log (action, entity_table, entity_id, metadata)
        values (
          'orders.oversell_detected',
          'orders',
          p_order_id,
          jsonb_build_object(
            'version_id', v_item.version_id,
            'market_code', v_market,
            'stock_disponible', v_stock_before,
            'cantidad_pedida', v_item.quantity,
            'faltante', v_faltante
          )
        );
      end if;

      update public.product_version_market_stock
      set
        stock = greatest(stock - v_item.quantity, 0),
        updated_at = now()
      where
        version_id = v_item.version_id
        and market_code = v_market;

      -- Consumir SÓLO las reservas de este pedido.
      update public.stock_reservations
      set
        consumed_at = now(),
        order_id = p_order_id
      where
        version_id = v_item.version_id
        and market_code = v_market
        and consumed_at is null
        and (
          (v_order.cart_id is not null and cart_id = v_order.cart_id)
          or (
            v_order.cart_id is null
            and v_order.user_id is not null
            and user_id = v_order.user_id
          )
        );
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
        and (
          (v_order.cart_id is not null and cart_id = v_order.cart_id)
          or (
            v_order.cart_id is null
            and v_order.user_id is not null
            and user_id = v_order.user_id
          )
        );
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
