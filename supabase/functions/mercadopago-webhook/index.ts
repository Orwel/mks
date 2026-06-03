import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve((req: Request) => {
  void req;
  return new Response(
    JSON.stringify({
      message:
        "Esqueleto: validar notificación IPN, correlacionar preference/payment y actualizar pedidos.",
    }),
    { status: 501, headers: { "Content-Type": "application/json" } },
  );
});
