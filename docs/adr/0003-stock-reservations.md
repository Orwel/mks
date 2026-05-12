# ADR 0003 — Reservas de stock temporales

## Decisión

Al agregar al carrito se llama a `reserve_stock` con TTL configurable (por defecto 15 minutos). Las filas en `stock_reservations` no consumidas y vencidas se eliminan con `cleanup_expired_stock_reservations`.

## Consecuencias

- Reduce overselling frente a checkout concurrente.
- Puede bloquear stock brevemente si el usuario abandona el carrito (aceptado).
