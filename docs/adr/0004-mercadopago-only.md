# ADR 0004 — Solo Mercado Pago y mercados multidivisa

## Estado

Aceptado (reemplaza dual gateway Stripe + Mercado Pago).

## Contexto

- Operación en Colombia; pagos vía **Mercado Pago**.
- Compradores eligen **mercado** (país) al entrar; precios y cobro usan la moneda de ese mercado.
- Mercados configurables: Colombia (COP), México (MXN), Perú (PEN), Ecuador (USD).

## Decisión

1. Una pasarela: **Mercado Pago** (Preference → `init_point`).
2. Cookie `mks_market` → fila `markets` → `default_currency` + `default_locale`.
3. Precios maestros en productos (COP típico) + conversión con `currency_rates` para mostrar y cobrar en moneda del mercado.
4. `currency_id` en MP = `orders.currency` = moneda del mercado.
5. Admin activa/desactiva mercados; monedas restringidas por `mercadopago_supported`.

## Consecuencias

- Sin Stripe ni PayU en código ni env de producción.
- Cuenta MP debe soportar monedas de mercados activos (validar en sandbox).
- Webhook MP + `fulfill_order_payment` idempotente.
