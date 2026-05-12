# Especificación — My Korea Store (MKS)

E-commerce de productos coreanos: **Next.js (App Router)**, **Supabase** (Postgres, Auth, Storage, Edge Functions), **Stripe** (internacional / multi-divisa) y **Mercado Pago** (Colombia).

## Alcance funcional

- **Landing**: hero, propuesta de valor, destacados por categoría, galería de banners, ticker, anuncios (modal/barra), footer legal.
- **Catálogo**: listado, filtros, detalle; categorías personalizables; imágenes en bucket `product-images`.
- **Carrito y checkout**: guest permitido; reserva de stock (~15 min); aceptación versionada de T&C y privacidad.
- **Pagos**: Stripe + Mercado Pago; webhooks idempotentes (`webhook_events`).
- **Pedidos**: estados `cart` → `pending_payment` → `paid` → `processing` → `shipped` → `delivered` (+ `cancelled`, `refunded`).
- **Roles**: `customer`, `employee`, `admin` (admin asigna permisos a empleados; ambos gestionan catálogo y pedidos; solo admin ve usuarios y publica legal).
- **Legal Colombia**: T&C y política de privacidad versionadas; registro de aceptación con IP/UA.

## Decisiones cerradas

| Tema | Decisión |
| --- | --- |
| Divisas | Precio base en **COP**; tasas en `currency_rates`; conversión referencial en UI; cobro real vía pasarela. |
| Checkout invitado | **Sí** (pedidos con `user_id` null + evidencia legal). |
| Stock | **Reserva temporal** + función `reserve_stock`; limpieza programada de expirados. |
| UI | **Tailwind v4 + shadcn/ui** (tokens en `globals.css`). |
| Idioma | **Solo español** (sin i18n por ahora). |

## Rutas Next.js (resumen)

| Ruta | Descripción |
| --- | --- |
| `/` | Landing pública |
| `/catalogo`, `/catalogo/[slug]`, `/categoria/[slug]` | Catálogo |
| `/carrito`, `/checkout` | Compra |
| `/pedido/[orderNumber]` | Seguimiento invitado (validación pendiente) |
| `/login`, `/registro`, `/recuperar` | Auth |
| `/mi-cuenta`, `/mis-pedidos` | Cuenta cliente |
| `/dashboard`, `/productos`, `/pedidos`, … | Panel staff |

## Documentación relacionada

- [Arquitectura](./architecture.md)
- [Base de datos](./database.md)
- [API / integraciones](./api.md)
- [ADRs](./adr/)
