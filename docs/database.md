# Base de datos — Supabase / Postgres

## Migraciones

Orden cronológico en `supabase/migrations/`:

| Archivo | Contenido |
| --- | --- |
| `20250511160000_init_schema.sql` | Enums, tablas base, índices, `updated_at`, `handle_new_user`, `is_staff` / `is_admin`, `reserve_stock` (legacy por producto) |
| `20250511160001_rls.sql` | RLS + protección de rol en `profiles` |
| `20250511160002_storage.sql` | Buckets y políticas de `storage.objects` |
| `20250511160003_views.sql` | Vista inicial `products_with_available_stock` |
| `20250512100000_admin_only_panel_rls.sql` | Panel restringido a staff |
| `20250512120000_profiles_role_guard_bootstrap.sql` | Guard de roles en bootstrap |
| `20250514100000_release_stock_reservation.sql` | `release_stock_reservation` (legacy) |
| `20250519100000_announcements_sort_order.sql` | Orden en anuncios |
| `20250520100000_banner_images.sql` | Tabla `banner_images`; varias imágenes por banner |
| `20250602100000_sprint2_currencies.sql` | Catálogo `currencies` (ISO, flags MP) |
| `20250602110000_sprint2_markets.sql` | Tabla `markets` (país, moneda, pasarela) |
| `20250602120000_sprint2_marketing_market_code.sql` | `market_code` en banners, ticker, announcements |
| `20250602130000_sprint2_site_settings.sql` | Singleton `site_settings` (apariencia) |
| `20250602140000_sprint2_profiles_orders_products.sql` | `profiles.market_code`, campos en pedidos/productos |
| `20250602150000_sprint2_subcategories_general.sql` | Subcategoría «General» por raíz |
| `20250602160000_sprint2_currency_rates_seed.sql` | Seed de tasas |
| `20250602170000_sprint2_fulfill_order_payment.sql` | `fulfill_order_payment` |
| `20250603100000_mp_only_markets.sql` | Solo Mercado Pago; mercados CO/MX/PE/EC; elimina INT/Stripe |
| `20250605100000_product_versions.sql` | Versiones, stock por mercado, imágenes por versión, vistas y RPC actualizados |
| `20250605110000_contact_messages.sql` | Formulario `/contactanos` |
| `20250606100000_seed_mks_categories.sql` | Seed categorías MKS |
| `20260824100000_profiles_role_guard_maintenance.sql` | Corrige el guard de roles (sesiones `postgres`/`supabase_admin`), auditoría de cambios de rol y RPC `admin_set_user_role` |
| `20260824100100_promote_angelica_admin.sql` | Data migration idempotente: promueve a admin el perfil indicado |
| `20260824101000_legal_single_source_of_truth.sql` | `legal_documents.title`/`effective_date`; `legal_acceptances` con `source`, versiones, casillas separadas; vista `legal_acceptances_detailed` |
| `20260824101100_seed_legal_ikebana_v1.sql` | Publica T&C y Política de privacidad v1.0.0 de IKEBANA CO S.A.S. |
| `20260824110000_fix_reservation_consumption_oversell.sql` | **Corrige sobreventa**: `orders.cart_id` + `fulfill_order_payment` sólo consume las reservas del pedido pagado; detector `orders.oversell_detected` |

## Modelo de datos (resumen)

### Usuarios y acceso

- **profiles**: rol (`customer` \| `employee` \| `admin`), `market_code` preferido, ligado a `auth.users`.

### Catálogo

- **categories**: jerarquía vía `parent_id` (raíz + subcategorías).
- **products**: datos comunes (slug, nombre, descripción, categoría, `is_featured`, `is_active`, `metadata`).
- **product_images**: legacy; imágenes migradas a versiones (mantener por compatibilidad).
- **product_versions**: variantes por producto (nombre, SKU, orden, activo).
- **product_version_images**: imágenes por versión → bucket `product-images`.
- **product_version_market_stock**: precio, moneda, stock e `is_active` **por versión y mercado**.

> Columnas `products.price`, `products.stock`, `products.currency`, `products.sku` están **deprecated**; usar `product_version_market_stock` y `product_versions`.

### Mercados y moneda

- **currencies**: ISO 4217 + `mercadopago_supported`.
- **markets**: CO, MX, PE, EC (configurables); moneda, locale, solo `mercadopago`.
- **currency_rates**: tasas diarias → COP (referencia UI).

### Pedidos e inventario

- **orders**, **order_items** (`version_id`, `version_name` snapshot), **order_status_history**.
- **stock_reservations**: por `cart_id`, `version_id`, `market_code`; TTL ~15 min; `consumed_at` al pagar.

### Marketing y sitio

- **banners** + **banner_images** (bucket `banners`); posiciones `hero`, `secondary`, `sidebar`.
- **ticker_messages**, **announcements** (`market_code` opcional).
- **site_settings**: colores, hero, footer, botones, fondos de secciones.

### Legal y operación

- **legal_documents**: fuente única de verdad de los textos legales. Una fila
  `is_current = true` por tipo (`terms` / `privacy`). Ver ADR 0005.
- **legal_acceptances**: evidencia *append-only* de cada aceptación (versión
  exacta, fecha, IP, user agent, `source`). Sin políticas RLS de UPDATE/DELETE.
- **legal_acceptances_detailed**: vista de consulta para el panel.
- **contact_messages**: mensajes del formulario público.
- **webhook_events**: idempotencia Mercado Pago.
- **audit_log**: auditoría extensible.

## Vistas

| Vista | Uso |
| --- | --- |
| `product_versions_market_availability` | Stock disponible por versión y mercado (resta reservas activas) |
| `products_market_catalog` | Catálogo agregado por producto y mercado (precio mínimo con stock, stock total) |
| `products_with_available_stock` | Compatibilidad legacy; mercado CO por defecto |

## Funciones RPC

| Función | Descripción |
| --- | --- |
| `reserve_stock(version_id, market_code, quantity, cart_id, user_id?, ttl_minutes?)` | Reserva stock por versión y mercado |
| `release_stock_reservation(cart_id, version_id, market_code)` | Libera reserva al quitar del carrito |
| `fulfill_order_payment(order_id)` | Confirma pago: descuenta stock por versión/mercado y consume **sólo las reservas del carrito del pedido** (`orders.cart_id`) |
| `cleanup_expired_stock_reservations()` | Limpia reservas vencidas (cron / Edge Function) |

## Storage

| Bucket | Uso |
| --- | --- |
| `product-images` | Imágenes de versión de producto (público) |
| `category-images` | Imágenes de categoría (público) |
| `banners` | Destacados y banners de marketing (público) |
| `legal` | PDF / textos legales (staff/admin) |

Límite de subida en app: **5 MB** por archivo (`upload-storage.ts`).

## Seed

`supabase/seed.sql` y migraciones de seed: categorías demo, legal, productos de ejemplo.

```bash
supabase db reset   # local
supabase db push    # remoto
```

## Manual de usuario

Especificaciones de imágenes y guía del panel: [manual-usuario/](./manual-usuario/README.md).
