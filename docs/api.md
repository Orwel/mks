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

## Variables de entorno

Ver `.env.example` en la raíz del repo.

## Próximos contratos

- **Server Actions**: `checkout`, `createOrder`, `adminUpdateOrderStatus`, CRUD productos (validación con zod).
- **RPC / SQL**: consumo de reservas al confirmar pago (transacción con actualización de `products.stock`).
