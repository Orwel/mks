# API e integraciones

## Webhooks (Next.js)

| Ruta | Estado |
| --- | --- |
| `POST /api/webhooks/mercadopago` | Firma opcional, idempotencia, `fulfill_order_payment` |

Opción recomendada en producción: **Edge Functions** en `supabase/functions/*` (menor latencia, mismo secreto en Supabase) o mantener Route Handlers si prefieres un solo despliegue en Vercel.

## Edge Functions (esqueleto)

Ver `supabase/functions/README.md`.

## Supabase cliente

| Módulo | Uso |
| --- | --- |
| `createSupabaseBrowserClient()` | Cliente en componentes `"use client"` |
| `createSupabaseServerClient()` | Server Components / acciones (cookies) |
| `createSupabaseAdminClient()` | Solo servidor; `SUPABASE_SERVICE_ROLE_KEY` |

## RPC de stock (Postgres)

Firma actual (post `20250605100000_product_versions.sql`):

```sql
reserve_stock(
  p_version_id uuid,
  p_market_code text,
  p_quantity int,
  p_cart_id text,
  p_user_id uuid default null,
  p_ttl_minutes int default 15
) → jsonb

release_stock_reservation(
  p_cart_id text,
  p_version_id uuid,
  p_market_code text
) → jsonb

fulfill_order_payment(p_order_id uuid) → jsonb
```

El carrito invoca reserva/liberación vía Server Actions en `src/app/(public)/carrito/actions.ts`.

## Variables de entorno

Ver `.env.example` en la raíz del repo.

## Server Actions (panel)

CRUD principal en:

- `src/app/(dashboard)/mercados/[code]/productos/actions.ts` — productos y versiones por mercado
- `src/app/(dashboard)/mercados/actions.ts` — mercados
- `src/app/(dashboard)/destacados/actions.ts` — banners hero
- `src/app/(dashboard)/categorias/actions.ts` — categorías
- `src/app/(public)/checkout/actions.ts` — checkout
- `src/app/(public)/contactanos/actions.ts` — formulario de contacto

Validación con zod donde aplique en cada módulo.
