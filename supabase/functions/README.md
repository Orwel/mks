# Edge Functions (Supabase)

Esqueletos HTTP listos para desplegar con `supabase functions deploy <nombre>`.

| Función | Propósito |
| --- | --- |
| `stripe-webhook` | Eventos de pago Stripe |
| `mercadopago-webhook` | Notificaciones Mercado Pago |
| `update-currency-rates` | Tasas de cambio → `currency_rates` |
| `cleanup-expired-reservations` | Limpia reservas de stock vencidas |

Alternativa: usar Route Handlers en Next.js (`/api/webhooks/*`) y llamar a Postgres con `service_role`.
