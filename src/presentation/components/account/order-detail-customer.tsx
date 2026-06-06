import Link from "next/link";

import type { AccountOrderDetail } from "@/infrastructure/supabase/queries/account-orders";
import { formatMoney } from "@/shared/lib/format-money";
import { getOrderStatusMeta } from "@/shared/lib/order-status-labels";
import { OrderStatusBadge } from "@/presentation/components/account/order-status-badge";
import { OrderStatusStepper } from "@/presentation/components/account/order-status-stepper";
import { mksButtonClass } from "@/presentation/components/ui/mks-button";

type Props = {
  order: AccountOrderDetail;
  moneyLocale?: string;
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAddress(address: Record<string, unknown> | null): string | null {
  if (!address) return null;
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ]
    .filter((p) => typeof p === "string" && p.trim())
    .map((p) => String(p).trim());
  return parts.length > 0 ? parts.join(", ") : null;
}

export function OrderDetailCustomer({ order, moneyLocale = "es-CO" }: Props) {
  const meta = getOrderStatusMeta(order.status);
  const address = formatAddress(order.shipping_address);
  const showRetryPayment =
    order.status === "pending_payment" || order.payment_status === "pending";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <OrderStatusBadge status={order.status} />
        {showRetryPayment ? (
          <Link
            href={`/pedido/${encodeURIComponent(order.order_number)}`}
            className="text-xs font-black uppercase text-[var(--mks-pink)] hover:underline"
          >
            Ver estado de pago →
          </Link>
        ) : null}
      </div>

      <section className="rounded-2xl border-4 border-[var(--mks-ink)] bg-white p-6 shadow-[6px_6px_0_0_var(--mks-cyan)]">
        <h2 className="font-heading text-sm font-black uppercase tracking-wide text-neutral-500">
          Seguimiento
        </h2>
        <p className="mt-2 text-sm font-medium text-neutral-600">{meta.description}</p>
        <div className="mt-4">
          <OrderStatusStepper status={order.status} variant="full" />
        </div>
      </section>

      <section className="rounded-2xl border-4 border-[var(--mks-ink)] bg-white shadow-[6px_6px_0_0_var(--mks-ink)]">
        <h2 className="border-b-4 border-[var(--mks-ink)] bg-[var(--mks-cream)] px-4 py-3 font-heading text-sm font-black text-[var(--mks-ink)]">
          Productos
        </h2>
        <ul className="divide-y-2 divide-neutral-100">
          {order.items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="font-heading text-sm font-black text-[var(--mks-ink)]">
                  {item.product_name}
                </p>
                {item.version_name ? (
                  <p className="text-xs font-medium text-neutral-500">{item.version_name}</p>
                ) : null}
                <p className="mt-1 text-xs text-neutral-500">Cantidad: {item.quantity}</p>
              </div>
              <p className="shrink-0 text-sm font-black text-[var(--mks-ink)]">
                {formatMoney(item.subtotal, order.currency, moneyLocale)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border-4 border-[var(--mks-ink)] bg-white p-6 shadow-[4px_4px_0_0_var(--mks-ink)]">
          <h2 className="font-heading text-sm font-black text-[var(--mks-ink)]">Resumen</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-neutral-600">Subtotal</dt>
              <dd className="font-medium">{formatMoney(order.subtotal, order.currency, moneyLocale)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-neutral-600">Envío</dt>
              <dd className="font-medium">{formatMoney(order.shipping, order.currency, moneyLocale)}</dd>
            </div>
            {order.discount > 0 ? (
              <div className="flex justify-between gap-2">
                <dt className="text-neutral-600">Descuento</dt>
                <dd className="font-medium">
                  −{formatMoney(order.discount, order.currency, moneyLocale)}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-2 border-t-2 border-neutral-200 pt-2 font-black text-[var(--mks-ink)]">
              <dt>Total</dt>
              <dd>{formatMoney(order.total, order.currency, moneyLocale)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-neutral-500">Pago con Mercado Pago</p>
        </section>

        <section className="rounded-2xl border-4 border-[var(--mks-ink)] bg-white p-6 shadow-[4px_4px_0_0_var(--mks-ink)]">
          <h2 className="font-heading text-sm font-black text-[var(--mks-ink)]">Envío</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-xs font-bold uppercase text-neutral-500">Nombre</dt>
              <dd className="font-medium">{order.customer_name}</dd>
            </div>
            {order.customer_phone ? (
              <div>
                <dt className="text-xs font-bold uppercase text-neutral-500">Teléfono</dt>
                <dd className="font-medium">{order.customer_phone}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-xs font-bold uppercase text-neutral-500">Dirección</dt>
              <dd className="font-medium">{address ?? "—"}</dd>
            </div>
          </dl>
        </section>
      </div>

      {order.history.length > 0 ? (
        <section className="rounded-2xl border-4 border-[var(--mks-ink)] bg-white p-6 shadow-[4px_4px_0_0_var(--mks-ink)]">
          <h2 className="font-heading text-sm font-black text-[var(--mks-ink)]">Historial</h2>
          <ul className="mt-3 space-y-3">
            {order.history.map((entry, i) => {
              const toMeta = getOrderStatusMeta(entry.to_status);
              return (
                <li key={`${entry.created_at}-${i}`} className="border-l-4 border-[var(--mks-cyan)] pl-3">
                  <p className="text-sm font-black text-[var(--mks-ink)]">{toMeta.label}</p>
                  <p className="text-xs text-neutral-500">{formatDateTime(entry.created_at)}</p>
                  {entry.reason ? (
                    <p className="mt-0.5 text-xs font-medium text-neutral-600">{entry.reason}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link href="/catalogo" className={mksButtonClass({ variant: "accent", size: "sm" })}>
          Seguir comprando
        </Link>
        <Link href="/contactanos" className={mksButtonClass({ variant: "outline", size: "sm" })}>
          ¿Necesitas ayuda?
        </Link>
      </div>
    </div>
  );
}
