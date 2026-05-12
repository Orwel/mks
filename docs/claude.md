# Guía para Claude (Anthropic)

Contexto del proyecto: **My Korea Store** — catálogo, carrito, checkout dual (Stripe + Mercado Pago), roles `customer` / `employee` / `admin`, legal versionado (Colombia), reservas de stock (`reserve_stock`).

## Prioridades al implementar

1. **Seguridad**: RLS en Postgres; webhooks con verificación de firma e idempotencia (`webhook_events`); nunca filtrar service role al navegador.
2. **Coherencia**: mantener tipos y enums alineados entre `src/core/value-objects` y migraciones SQL (`order_status`, etc.).
3. **UX legal**: checkbox de T&C y privacidad enlazados a versiones concretas; persistir `legal_acceptances` y referencia en `orders`.

## Estilo de respuesta

- Explicaciones claras en **español**.
- Citas de código con el formato requerido por el IDE: bloques con ruta y líneas cuando se señale código existente.

## Dónde mirar primero

| Tema | Archivo / carpeta |
| --- | --- |
| Spec funcional | `docs/spec.md` |
| Esquema y RLS | `docs/database.md`, `supabase/migrations/` |
| Convenciones de capas | `docs/architecture.md` |
| Variables de entorno | `.env.example`, `src/shared/config/env.ts` |

## Supabase Edge

Los esqueletos viven en `supabase/functions/`. Si la lógica vive en Next (`/api`), documentar en `docs/api.md` para no duplicar comportamiento sin dejar constancia.

## Lista de verificación antes de dar por cerrada una feature de pago o pedidos

- [ ] Transiciones de estado de pedido acotadas (sin saltos inválidos).
- [ ] Montos y moneda persistidos como snapshot en `orders` cuando aplique.
- [ ] Pruebas manuales o automatizadas descritas en el PR o en comentario de issue.
