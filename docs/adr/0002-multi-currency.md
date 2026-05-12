# ADR 0002 — Multi-divisa con precio en COP

## Decisión

Los productos almacenan precio en **COP**. Las tasas de referencia viven en `currency_rates`. La UI puede mostrar montos convertidos; el cobro final lo define **Stripe** / **Mercado Pago**.

## Consecuencias

- Requiere job o función programada para actualizar tasas.
- Los pedidos deben guardar snapshot (`currency`, `rate_to_cop_snapshot` cuando aplique) para trazabilidad.
