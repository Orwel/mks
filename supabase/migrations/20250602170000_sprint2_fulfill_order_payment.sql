-- Consumir reservas y descontar stock al confirmar pago

create or replace function public.fulfill_order_payment(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
begin
  select * into v_order from public.orders where id = p_order_id for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'order_not_found');
  end if;

  if v_order.payment_status = 'paid' then
    return jsonb_build_object('ok', true, 'already_paid', true);
  end if;

  for v_item in
    select product_id, quantity
    from public.order_items
    where order_id = p_order_id
  loop
    update public.products
    set stock = greatest(stock - v_item.quantity, 0)
    where id = v_item.product_id;

    update public.stock_reservations
    set consumed_at = now(), order_id = p_order_id
    where product_id = v_item.product_id
      and consumed_at is null
      and order_id is null;
  end loop;

  update public.orders
  set payment_status = 'paid', status = 'paid', updated_at = now()
  where id = p_order_id;

  insert into public.order_status_history (order_id, from_status, to_status, reason)
  values (p_order_id, v_order.status, 'paid', 'payment_confirmed');

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.fulfill_order_payment(uuid) from public;
grant execute on function public.fulfill_order_payment(uuid) to service_role;
