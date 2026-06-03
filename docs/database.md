# Base de datos — Supabase / Postgres

## Migraciones

Orden en `supabase/migrations/`:

| Archivo | Contenido |
| --- | --- |
| `20250511160000_init_schema.sql` | Enums, tablas, índices, triggers `updated_at`, `handle_new_user`, helpers `is_staff` / `is_admin`, `reserve_stock`, `cleanup_expired_stock_reservations` |
| `20250511160001_rls.sql` | RLS + trigger de protección de rol en `profiles` |
| `20250511160002_storage.sql` | Buckets y políticas de `storage.objects` |
| `20250511160003_views.sql` | Vista `products_with_available_stock` |
| `20250514100000_release_stock_reservation.sql` | Función `release_stock_reservation(cart_id, product_id)` (liberar reserva al quitar del carrito) |

## Tablas principales

- **profiles**: perfil y rol (`customer` \| `employee` \| `admin`), ligado a `auth.users`; `market_code` → mercado preferido.
- **categories**, **products**, **product_images**: catálogo; jerarquía `categories.parent_id`; precio en `products.currency` (FK `currencies`).
- **currencies**: catálogo ISO 4217 + flags Stripe/MP.
- **markets**: mercados admin (moneda de cobro + pasarela).
- **site_settings**: singleton apariencia (colores, hero, footer, botones).
- **currency_rates**: tasas diarias por divisa → COP.
- **legal_documents**, **legal_acceptances**: versionado y evidencia de aceptación.
- **orders**, **order_items**, **order_status_history**: pedidos e historial de estados.
- **stock_reservations**: reservas por `cart_id` / usuario; TTL; `consumed_at` al pagar.
- **banners**, **ticker_messages**, **announcements**: contenido dinámico del landing; `market_code` opcional (NULL = global).
- **webhook_events**: idempotencia de webhooks de pago.
- **audit_log**: auditoría (extensible).

## Funciones destacadas

- `public.reserve_stock(product_id, quantity, cart_id, user_id?, ttl_minutes?)` — `SECURITY DEFINER`; bloquea fila de producto (`FOR UPDATE`).
- `public.release_stock_reservation(cart_id, product_id)` — `SECURITY DEFINER`; elimina reserva activa del carrito para ese producto.
- `public.cleanup_expired_stock_reservations()` — borra reservas no consumidas y vencidas (invocar con `service_role` o cron; Edge Function `cleanup-expired-reservations` con `CRON_SECRET`).

## Storage

| Bucket | Uso |
| --- | --- |
| `product-images` | Imágenes de producto (público) |
| `category-images` | Imágenes de categoría (público) |
| `banners` | Marketing (público) |
| `legal` | PDF / textos legales privados (staff/admin) |

## Seed

`supabase/seed.sql`: categorías demo, documentos legales `1.0.0`, productos de ejemplo, mensaje de ticker.

Ejecutar con `supabase db reset` (local) o aplicar migraciones en remoto con `supabase db push`.
