import Link from "next/link";

import { AccountOrderCard, type AccountOrderRow } from "@/presentation/components/account/account-order-card";

type Props = {
  orders: AccountOrderRow[];
};

export function AccountOrdersPreview({ orders }: Props) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-heading text-lg font-black text-[var(--mks-ink)]">Mis pedidos recientes</h2>
        {orders.length > 0 ? (
          <Link
            href="/mis-pedidos"
            className="text-xs font-black uppercase tracking-wide text-[var(--mks-pink)] hover:underline"
          >
            Ver todos →
          </Link>
        ) : null}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border-4 border-dashed border-[var(--mks-ink)]/30 bg-white/60 p-6 text-sm font-medium text-neutral-600">
          Aún no tienes pedidos. Cuando completes una compra, aparecerán aquí.
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <AccountOrderCard order={order} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
