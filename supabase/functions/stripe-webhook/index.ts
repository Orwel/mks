import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve((req: Request) => {
  void req;
  return new Response(
    JSON.stringify({
      message:
        "Esqueleto: implementar verificación de firma, idempotencia (webhook_events) y actualización de orders/payment_status.",
    }),
    { status: 501, headers: { "Content-Type": "application/json" } },
  );
});
