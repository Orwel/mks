\echo '── 4.3 Reservar stock crea la reserva ──'
select public.reserve_stock('cccccccc-0000-0000-0000-000000000001','CO',3,'carrito-A') as r;
select 'reservas activas: '||count(*) from public.stock_reservations where cart_id='carrito-A' and consumed_at is null;

\echo ''
\echo '── 4.4 Pedir más de lo disponible debe fallar ──'
select public.reserve_stock('cccccccc-0000-0000-0000-000000000003','CO',99,'carrito-B') as r;

\echo ''
\echo '── 4.4b Disponible = stock - reservas activas de OTROS carritos ──'
select stock, available_stock from public.product_versions_market_availability
where version_id='cccccccc-0000-0000-0000-000000000001' and market_code='CO';

\echo ''
\echo '── 4.x Cantidad inválida ──'
select public.reserve_stock('cccccccc-0000-0000-0000-000000000001','CO',0,'carrito-C') as r;
select public.reserve_stock('cccccccc-0000-0000-0000-000000000001','CO',-5,'carrito-C') as r;

\echo ''
\echo '── 4.x Producto inactivo no se puede reservar ──'
update public.products set is_active=false where id='bbbbbbbb-0000-0000-0000-000000000002';
select public.reserve_stock('cccccccc-0000-0000-0000-000000000003','CO',1,'carrito-D') as r;
update public.products set is_active=true where id='bbbbbbbb-0000-0000-0000-000000000002';

\echo ''
\echo '── 4.5 Liberar la reserva ──'
select public.release_stock_reservation('carrito-A','cccccccc-0000-0000-0000-000000000001','CO') as r;
select 'reservas activas tras liberar: '||count(*) from public.stock_reservations where cart_id='carrito-A' and consumed_at is null;

\echo ''
\echo '── 4.6 Reserva vencida se limpia ──'
select public.reserve_stock('cccccccc-0000-0000-0000-000000000001','CO',2,'carrito-E') as r;
update public.stock_reservations set expires_at = now() - interval '1 minute' where cart_id='carrito-E';
select 'disponible ANTES de limpiar: '||available_stock from public.product_versions_market_availability
 where version_id='cccccccc-0000-0000-0000-000000000001' and market_code='CO';
select public.cleanup_expired_stock_reservations() as limpiadas;
select 'disponible DESPUÉS de limpiar: '||available_stock from public.product_versions_market_availability
 where version_id='cccccccc-0000-0000-0000-000000000001' and market_code='CO';
