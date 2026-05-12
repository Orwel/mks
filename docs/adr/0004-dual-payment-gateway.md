# ADR 0004 — Stripe + Mercado Pago

## Decisión

- **Mercado Pago**: foco Colombia / COP.
- **Stripe**: internacional y multi-divisa en checkout.

Los webhooks actualizan `payment_status` y disparan transiciones de `order_status` de forma idempotente (`webhook_events`).

## Consecuencias

- Dos integraciones que mantener (firmas, retries, estados).
- Complejidad de routing en checkout según país/moneda del comprador.
