import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { formatMoney } from "@/shared/lib/format-money";
import { OrderStatusBadge } from "@/presentation/components/account/order-status-badge";
import { OrderStatusStepper } from "@/presentation/components/account/order-status-stepper";

export type AccountOrderRow = {
  id: string;
  order_number: string;
  status: string;
  total: number;
  currency: string;
  created_at: string;
  item_count?: number;
};

type Props = {
  order: AccountOrderRow;
  showStepper?: boolean;
};

function formatOrderDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function AccountOrderCard({ order, showStepper = false }: Props) {
  const itemLabel =
    order.item_count != null
      ? `${order.item_count} ${order.item_count === 1 ? "producto" : "productos"}`
      : null;

  return (
    <Link
      href={`/mis-pedidos/${order.id}`}
      className="group block rounded-xl border-4 border-[var(--mks-ink)] bg-white p-4 shadow-[4px_4px_0_0_var(--mks-ink)] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--mks-cyan)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs font-black text-[var(--mks-ink)]">{order.order_number}</p>
          <p className="mt-1 text-xs font-medium text-neutral-500">{formatOrderDate(order.created_at)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <ChevronRight
            className="h-4 w-4 text-neutral-400 transition group-hover:text-[var(--mks-ink)]"
            strokeWidth={3}
            aria-hidden
          />
        </div>
      </div>

      <p className="mt-3 text-sm font-black text-[var(--mks-ink)]">
        {formatMoney(Number(order.total), order.currency)}
        {itemLabel ? (
          <span className="ml-2 text-xs font-medium text-neutral-500">· {itemLabel}</span>
        ) : null}
      </p>

      {showStepper ? (
        <div className="mt-3">
          <OrderStatusStepper status={order.status} variant="mini" />
        </div>
      ) : null}
    </Link>
  );
}
