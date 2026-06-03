import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve((req: Request) => {
  void req;
  return new Response(
    JSON.stringify({
      message:
        "Esqueleto: job diario (BanRep TRM, etc.) e insertar filas en public.currency_rates.",
    }),
    { status: 501, headers: { "Content-Type": "application/json" } },
  );
});
