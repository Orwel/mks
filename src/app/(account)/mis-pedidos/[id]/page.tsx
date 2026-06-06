import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAuth } from "@/infrastructure/supabase/auth-session";
import { getAccountOrderDetail } from "@/infrastructure/supabase/queries/account-orders";
import { getMarketByCodeAny } from "@/infrastructure/supabase/queries/markets";
import { OrderDetailCustomer } from "@/presentation/components/account/order-detail-customer";

type Props = { params: Promise<{ id: string }> };

function formatOrderDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function PedidoDetalleClientePage({ params }: Props) {
  const { id } = await params;
  const session = await requireAuth();
  const order = await getAccountOrderDetail(session.user.id, id);

  if (!order) {
    notFound();
  }

  const market = order.market_code ? await getMarketByCodeAny(order.market_code) : null;
  const moneyLocale = market?.default_locale ?? "es-CO";

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/mis-pedidos"
          className="text-xs font-black uppercase tracking-wide text-[var(--mks-pink)] hover:underline"
        >
          ← Mis pedidos
        </Link>
        <p className="mt-3 text-xs font-black uppercase tracking-[0.25em] text-[var(--mks-cyan)]">
          Pedido
        </p>
        <h1 className="mt-2 font-heading text-3xl font-black tracking-tight text-[var(--mks-ink)] md:text-4xl">
          {order.order_number}
        </h1>
        <p className="mt-2 text-sm font-medium text-neutral-600">
          Realizado el {formatOrderDate(order.created_at)}
        </p>
      </div>

      <OrderDetailCustomer order={order} moneyLocale={moneyLocale} />
    </div>
  );
}
