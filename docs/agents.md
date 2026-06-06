# Guía para agentes (Cursor / Composer)

Este repositorio es **My Korea Store (MKS)**: e-commerce con **Next.js 16 (App Router)**, **Supabase** y **Mercado Pago** (mercados CO/MX/PE/EC).

## Reglas de trabajo

- Responder y documentar en **español** salvo que el equipo pida otro idioma.
- Seguir **clean architecture** del repo: dominio en `src/core`, casos de uso y puertos en `src/application`, adaptadores en `src/infrastructure`, UI de negocio en `src/presentation`, primitivas shadcn en `src/components/ui`.
- No exponer `SUPABASE_SERVICE_ROLE_KEY` ni secretos de pago en el cliente; solo en servidor (Route Handlers, Server Actions, Edge Functions).
- Respetar **RLS** de Supabase: la app cliente usa anon + JWT; operaciones sensibles con `createSupabaseAdminClient()` solo en servidor.
- Cambios de esquema solo vía **`supabase/migrations/`** (no editar la BD remota a mano sin migración).
- Catálogo: **productos por mercado** (`/mercados/[code]/productos`); stock/precio en `product_version_market_stock`; imágenes en `product_version_images` → bucket **`product-images`**.
- Manual operativo: **`docs/manual-usuario/`**.
- Antes de ampliar el modelo de datos, actualizar **`docs/spec.md`**, **`docs/database.md`** y un **ADR** en `docs/adr/` si la decisión es relevante.

## Rutas útiles

| Área | Ruta en código |
| --- | --- |
| Público | `src/app/(public)/` |
| Auth | `src/app/(auth)/` |
| Cuenta cliente | `src/app/(account)/` |
| Panel staff | `src/app/(dashboard)/` |
| Webhooks | `src/app/api/webhooks/` |
| Cliente Supabase browser | `src/infrastructure/supabase/client.ts` |
| Cliente Supabase server | `src/infrastructure/supabase/server.ts` |

## Calidad

- Tras cambios sustanciales: `npm run lint` y `npm run build` (o `npm run typecheck`).
- No añadir dependencias sin consenso; preferir APIs ya instaladas.

## Referencias

- [README de documentación](./README.md)
- [Manual de administración](./manual-usuario/manual-administracion.md)
- [Especificación](./spec.md)
- [Arquitectura](./architecture.md)
