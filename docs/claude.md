# Guía para Claude (Anthropic)

Contexto del proyecto: **My Korea Store** — catálogo multi-mercado, versiones de producto, carrito, checkout con **Mercado Pago**, roles `customer` / `employee` / `admin`, legal versionado (Colombia), reservas de stock por versión y mercado.

## Prioridades al implementar

1. **Seguridad**: RLS en Postgres; webhooks con verificación de firma e idempotencia (`webhook_events`); nunca filtrar service role al navegador.
2. **Coherencia**: tipos y enums alineados entre `src/core/value-objects` y migraciones SQL; stock/precio en `product_version_market_stock`, no en `products`.
3. **UX legal**: checkbox de T&C y privacidad enlazados a versiones concretas; persistir `legal_acceptances` y referencia en `orders`.

## Estilo de respuesta

- Explicaciones claras en **español**.
- Citas de código con el formato requerido por el IDE: bloques con ruta y líneas cuando se señale código existente.

## Dónde mirar primero

| Tema | Archivo / carpeta |
| --- | --- |
| Manual operativo | `docs/manual-usuario/` |
| Spec funcional | `docs/spec.md` |
| Esquema y RLS | `docs/database.md`, `supabase/migrations/` |
| Convenciones de capas | `docs/architecture.md` |
| Variables de entorno | `.env.example`, `src/shared/config/env.ts` |

## Supabase Edge

Los esqueletos viven en `supabase/functions/`. Si la lógica vive en Next (`/api`), documentar en `docs/api.md` para no duplicar comportamiento sin dejar constancia.

## Lista de verificación antes de dar por cerrada una feature de pago o pedidos

- [ ] Transiciones de estado de pedido acotadas (sin saltos inválidos).
- [ ] Montos y moneda persistidos como snapshot en `orders` cuando aplique.
- [ ] Stock descontado por `version_id` + `market_code` al confirmar pago.
- [ ] Pruebas manuales o automatizadas descritas en el PR o en comentario de issue.
