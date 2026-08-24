\echo '── 5.1 El catálogo cambia por mercado (precio y moneda propios) ──'
select market_code, name, min_price, currency, total_stock
from public.products_market_catalog
where slug in ('ramen-test','crema-test')
order by market_code, name;

\echo ''
\echo '── 5.3 Producto sin precio en un mercado NO aparece en ese mercado ──'
select
  (select count(*) from public.products_market_catalog where slug='crema-test' and market_code='PE') as crema_en_PE_debe_ser_0,
  (select count(*) from public.products_market_catalog where slug='crema-test' and market_code='CO') as crema_en_CO_debe_ser_1,
  (select count(*) from public.products_market_catalog where slug='ramen-test' and market_code='EC') as ramen_en_EC_debe_ser_1;

\echo ''
\echo '── 5.x Versión sin precio en el mercado no es reservable ahí ──'
select public.reserve_stock('cccccccc-0000-0000-0000-000000000002','PE',1,'carrito-PE') as suave_en_PE;

\echo ''
\echo '── 5.x Stock 0 en un mercado no bloquea el otro ──'
select public.reserve_stock('cccccccc-0000-0000-0000-000000000003','MX',1,'carrito-MX') as crema_en_MX_stock0;
select public.reserve_stock('cccccccc-0000-0000-0000-000000000003','CO',1,'carrito-CO') as crema_en_CO_stock2;

\echo ''
\echo '── 5.x El stock es independiente por mercado ──'
select market_code, stock, available_stock
from public.product_versions_market_availability
where version_id='cccccccc-0000-0000-0000-000000000001'
order by market_code;
