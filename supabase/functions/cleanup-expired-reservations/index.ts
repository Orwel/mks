import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (_req: Request) => {
  return new Response(
    JSON.stringify({
      message:
        "Esqueleto: invocar select public.cleanup_expired_stock_reservations() con service role o SQL directo.",
    }),
    { status: 501, headers: { "Content-Type": "application/json" } },
  );
});
