import Link from "next/link";

import { formatMoney } from "@/shared/lib/format-money";
import { mksButtonClass } from "@/presentation/components/ui/mks-button";
import type { AccountOrderRow } from "@/presentation/components/account/account-order-card";
import { OrderStatusStepper } from "@/presentation/components/account/order-status-stepper";
import { OrderStatusBadge } from "@/presentation/components/account/order-status-badge";
import { getOrderStatusMeta } from "@/shared/lib/order-status-labels";

type Props = {
  order: AccountOrderRow | null;
};

function formatOrderDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function AccountFeaturedOrder({ order }: Props) {
  if (!order) {
    return (
      <div className="flex h-full flex-col justify-center rounded-2xl border-4 border-dashed border-[var(--mks-ink)]/30 bg-white/60 p-6">
        <h2 className="font-heading text-lg font-black text-[var(--mks-ink)]">Sin pedidos activos</h2>
        <p className="mt-2 text-sm font-medium text-neutral-600">
          Cuando compres algo, verás aquí el seguimiento de tu pedido más reciente.
        </p>
        <Link
          href="/catalogo"
          className={mksButtonClass({ variant: "primary", size: "sm", className: "mt-4 w-fit" })}
        >
          Ir a la tienda
        </Link>
      </div>
    );
  }

  const meta = getOrderStatusMeta(order.status);

  return (
    <div className="rounded-2xl border-4 border-[var(--mks-ink)] bg-white p-6 shadow-[8px_8px_0_0_var(--mks-pink)]">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--mks-pink)]">
        Pedido en curso
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h2 className="font-mono text-base font-black text-[var(--mks-ink)]">{order.order_number}</h2>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-xs font-medium text-neutral-500">{formatOrderDate(order.created_at)}</p>
      <p className="mt-2 text-sm font-medium text-neutral-600">{meta.description}</p>
      <p className="mt-2 text-sm font-black text-[var(--mks-ink)]">
        {formatMoney(Number(order.total), order.currency)}
      </p>

      <div className="mt-4">
        <OrderStatusStepper status={order.status} variant="mini" />
      </div>

      <Link
        href={`/mis-pedidos/${order.id}`}
        className={mksButtonClass({ variant: "outline", size: "sm", className: "mt-4" })}
      >
        Ver seguimiento
      </Link>
    </div>
  );
}
