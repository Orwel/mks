# Especificación — My Korea Store (MKS)

E-commerce de productos coreanos: **Next.js (App Router)**, **Supabase** (Postgres, Auth, Storage, Edge Functions), **Mercado Pago** (multi-mercado LATAM).

## Alcance funcional

- **Landing**: hero configurable, ticker, destacados por categoría, panel de banners (hero), anuncios (modal/barra), footer legal.
- **Catálogo multi-mercado**: listado, filtros, detalle con versiones; precio/stock por país; selector de mercado en header.
- **Carrito y checkout**: guest permitido; reserva de stock (~15 min) por versión y mercado; aceptación versionada de T&C y privacidad.
- **Pagos**: **Mercado Pago** por mercado (CO, MX, PE, EC); webhooks idempotentes (`webhook_events`).
- **Pedidos**: estados `cart` → `pending_payment` → `paid` → `processing` → `shipped` → `delivered` (+ `cancelled`, `refunded`).
- **Roles**: `customer`, `employee`, `admin` (panel staff; admin gestiona usuarios, legal y contacto).
- **Legal Colombia**: T&C y política de privacidad versionadas; registro de aceptación con IP/UA.

## Decisiones cerradas

| Tema | Decisión |
| --- | --- |
| Mercados | Países en tabla `markets`; inventario y precio en `product_version_market_stock` |
| Versiones | Un producto puede tener N versiones (SKU, imágenes, stock por mercado) |
| Divisas | Moneda por mercado; tasas en `currency_rates` (referencia); cobro vía Mercado Pago |
| Pasarela | **Solo Mercado Pago** (migración `20250603100000_mp_only_markets.sql`) |
| Checkout invitado | **Sí** (pedidos con `user_id` null + evidencia legal) |
| Stock | Reserva por `version_id` + `market_code`; TTL configurable |
| UI | Tailwind v4 + shadcn/ui (tokens en `globals.css`) |
| Idioma | Solo español (locale por mercado en formato de moneda) |

## Rutas Next.js

### Tienda pública (`src/app/(public)/`)

| Ruta | Descripción |
| --- | --- |
| `/` | Landing |
| `/catalogo`, `/catalogo/[slug]`, `/categoria/[slug]` | Catálogo |
| `/carrito`, `/checkout` | Compra |
| `/pedido/[orderNumber]` | Seguimiento |
| `/nosotros`, `/contactanos` | Institucional y contacto |
| `/terminos`, `/privacidad` | Legal público |
| `/landing2`, `/landing3`, `/landing4` | Variantes de diseño (pruebas) |

### Auth y cuenta

| Ruta | Descripción |
| --- | --- |
| `/login`, `/registro`, `/recuperar` | Auth |
| `/mi-cuenta`, `/mis-pedidos` | Cuenta cliente |

### Panel administración (`src/app/(dashboard)/`)

| Ruta | Descripción |
| --- | --- |
| `/dashboard` | Resumen |
| `/mercados` | Países y monedas |
| `/mercados/[code]/productos` | Catálogo por mercado |
| `/categorias` | Árbol de categorías |
| `/apariencia` | Colores, hero, footer |
| `/pedidos`, `/pedidos/[orderId]` | Operación de pedidos |
| `/destacados` | Banners del hero (ex `/banners`) |
| `/ticker`, `/anuncios` | Marketing |
| `/legal` | Documentos legales |
| `/contacto` | Mensajes de contacto |
| `/usuarios` | Roles (admin) |

> `/productos` redirige a `/mercados`.

## Imágenes (resumen)

| Uso | Proporción | Tamaño recomendado |
| --- | --- | --- |
| Producto (catálogo, ficha, destacados) | 1:1 | 1200 × 1200 px |
| Banner hero (Destacados admin) | 4:3 | 920 × 690 px |

Detalle: [manual-usuario/whatsapp-especificaciones-imagenes.txt](./manual-usuario/whatsapp-especificaciones-imagenes.txt).

## Documentación relacionada

- [Manual de usuario](./manual-usuario/README.md)
- [Arquitectura](./architecture.md)
- [Base de datos](./database.md)
- [API / integraciones](./api.md)
- [ADRs](./adr/)
