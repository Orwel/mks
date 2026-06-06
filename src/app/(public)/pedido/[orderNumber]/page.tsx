import Link from "next/link";

import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";
import { getMarketByCodeAny } from "@/infrastructure/supabase/queries/markets";
import { formatMoney } from "@/shared/lib/format-money";

type Props = {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ status?: string }>;
};

export default async function PedidoPage({ params, searchParams }: Props) {
  const { orderNumber } = await params;
  const { status } = await searchParams;
  const decoded = decodeURIComponent(orderNumber);

  const supabase = createSupabaseAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select(
      "order_number, status, payment_status, total, currency, customer_name, payment_provider, market_code, created_at",
    )
    .eq("order_number", decoded)
    .maybeSingle();

  if (!order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-heading text-2xl font-black">Pedido no encontrado</h1>
        <Link href="/" className="mt-4 inline-block font-bold text-[var(--mks-pink)]">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const paid = order.payment_status === "paid" || order.status === "paid";
  const pending = status === "pending" || order.payment_status === "pending";
  const market = order.market_code
    ? await getMarketByCodeAny(String(order.market_code))
    : null;
  const moneyLocale = market?.default_locale ?? "es-CO";

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--mks-cyan)]">Pedido</p>
      <h1 className="mt-2 font-heading text-3xl font-black">{order.order_number}</h1>
      <p className="mt-2 text-sm text-neutral-600">Hola {order.customer_name},</p>

      <div className="mt-6 rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cream)] p-4">
        {paid ? (
          <p className="font-black text-emerald-800">Pago confirmado. Gracias por tu compra.</p>
        ) : pending ? (
          <p className="font-black text-amber-800">
            Pago pendiente. Te avisaremos cuando se confirme (Mercado Pago / transferencia).
          </p>
        ) : (
          <p className="font-black text-neutral-800">
            Estado: {order.payment_status} · {order.status}
          </p>
        )}
        <p className="mt-2 text-sm">
          Total: {formatMoney(Number(order.total), String(order.currency), moneyLocale)}
        </p>
        <p className="mt-1 text-xs text-neutral-500">Pago con Mercado Pago</p>
      </div>

      <Link
        href="/catalogo"
        className="mt-8 inline-block rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-pink)] px-4 py-2 text-sm font-black text-white transition hover:bg-[var(--mks-yellow)]"
      >
        Seguir comprando
      </Link>
    </div>
  );
}
